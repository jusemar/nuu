import { alterarDecisaoRascunhosImportacaoFornecedor } from "../../actions/alterar-decisao-rascunhos-importacao-fornecedor";
import {
  ajustarPrecosRascunhosImportacaoFornecedor,
  atualizarCamposRascunhosImportacaoFornecedor,
} from "../../actions/atualizar-rascunhos-conciliacao-importacao-fornecedor";
import type { RascunhoImportacaoFornecedor } from "../../queries/listar-rascunhos-importacao-fornecedor";
import {
  type ItemConciliacaoFornecedor,
  TabelaConciliacaoFornecedor,
} from "./tabela-conciliacao-fornecedor";
import type { OpcaoValorPadraoLoja } from "./tabela-mapeamento-campos-fornecedor";

type AbaConciliacaoImportacaoFornecedorProps = {
  importacaoId: string;
  fornecedor: string;
  rascunhos: RascunhoImportacaoFornecedor[];
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: Array<{ id: string; nome: string }>;
  /**
   * Navegação da etapa. O padrão são as rotas do fluxo por arquivo; a
   * integração por API passa as dela, porque só o endereço muda — a
   * experiência da Conciliação é a mesma para as duas origens.
   */
  hrefVoltar?: string;
  hrefProximaEtapa?: string;
  tipoOrigem?: "arquivo" | "api";
};

const ROTULOS_PENDENCIAS: Record<string, string> = {
  "Falta nome do produto": "Nome obrigatório",
  "Falta categoria": "Categoria obrigatória",
  "Falta marca": "Marca obrigatória",
  "Falta preço da loja": "Preço pendente",
  "Falta seção da loja": "Seção da loja",
  "Falta modalidade comercial": "Modalidade pendente",
  "Falta prazo de entrega": "Prazo pendente",
};

const ROTULOS_MODALIDADE = {
  dropshipping: "Dropshipping",
  stock: "Estoque próprio",
  pre_sale: "Pré-venda",
  order_basis: "Sob encomenda",
} as const;

function montarPendencias(rascunho: RascunhoImportacaoFornecedor) {
  return rascunho.pendencias.map(
    (pendencia) => ROTULOS_PENDENCIAS[pendencia] ?? pendencia,
  );
}

function montarAlertas(rascunho: RascunhoImportacaoFornecedor) {
  const alertas: string[] = [];

  if (!rascunho.ncm) alertas.push("NCM não recebido");
  if (!rascunho.ean) alertas.push("EAN não recebido");
  if (rascunho.imagens.length === 0) alertas.push("Sem imagem recebida");

  return alertas;
}

/**
 * Monta o item de Conciliação do caminho "atualizar produto existente".
 *
 * Difere do caminho "criar": não exige categoria, marca, seção nem modalidade
 * (o produto real já tem tudo isso) e carrega `produtoAtualizado` com o
 * retrato atual da loja, usado pela tabela para montar a comparação.
 */
/**
 * Motivos concretos no lugar de um badge "Alerta" sem explicação.
 *
 * Diferença entre fornecedor e loja NÃO é erro: a vinculação já estabeleceu que
 * os dois representam o mesmo produto, e o gestor pode ter decidido manter o
 * nome da loja de propósito. Por isso as divergências entram como informação
 * ("Preço difere do atual"), e só falta de dado obrigatório vira pendência.
 */
function montarAlertasItemVinculado(
  rascunho: RascunhoImportacaoFornecedor,
  aguardandoAprovacao: boolean,
) {
  const alertas: string[] = [];

  const precoRecebido = Number(rascunho.precoLoja);
  const precoAtual = Number(rascunho.precoAtualLoja);
  if (
    Number.isFinite(precoRecebido) &&
    Number.isFinite(precoAtual) &&
    precoRecebido !== precoAtual
  ) {
    const sentido = precoRecebido > precoAtual ? "sobe" : "desce";
    alertas.push(`Preço ${sentido} em relação ao atual da loja`);
  }

  if (
    typeof rascunho.estoqueFornecedor === "number" &&
    typeof rascunho.estoqueAtualLoja === "number" &&
    rascunho.estoqueFornecedor !== rascunho.estoqueAtualLoja
  ) {
    alertas.push(
      `Estoque muda de ${rascunho.estoqueAtualLoja} para ${rascunho.estoqueFornecedor}`,
    );
  }

  // Categoria, marca e seções só aparecem quando o gestor as reescreveu nesta
  // conciliação — é o único caso em que a publicação vai tocar no catálogo.
  if (
    rascunho.categoriaId &&
    rascunho.categoriaId !== rascunho.categoriaAtualLojaId
  ) {
    alertas.push(`Categoria será alterada para ${rascunho.categoriaNome}`);
  }
  if (rascunho.marcaId && rascunho.marcaId !== rascunho.marcaAtualLojaId) {
    alertas.push(`Marca será alterada para ${rascunho.marcaNome}`);
  }
  if (rascunho.secoesLoja.length > 0) {
    alertas.push("Seções da loja serão alteradas");
  }

  if (aguardandoAprovacao) {
    alertas.push("Aguardando aprovação para publicar");
  }

  return alertas;
}

function montarItemConciliacaoAtualizacao(
  rascunho: RascunhoImportacaoFornecedor,
): ItemConciliacaoFornecedor {
  const pendenciasObrigatorias = rascunho.pendencias;
  const aguardandoAprovacao = rascunho.status === "pendente_conciliacao";

  return {
    id: rascunho.id,
    produto: {
      nome: rascunho.nome,
      codigo: rascunho.codigoFornecedor,
      preco: rascunho.precoLoja,
      precoFornecedor: rascunho.precoFornecedor,
      precoLoja: rascunho.precoLoja,
      estoque: rascunho.estoqueFornecedor,
      complemento: rascunho.produtoAtualizadoNome,
      imagemUrl: null,
    },
    acaoPrevista: "atualizar",
    statusVinculacao: "vinculado",
    status:
      pendenciasObrigatorias.length > 0
        ? "pendencia"
        : rascunho.status === "pronto_para_publicar"
          ? "pronto"
          : "alerta",
    pendenciasObrigatorias,
    alertas: montarAlertasItemVinculado(rascunho, aguardandoAprovacao),
    regrasObrigatorias: pendenciasObrigatorias.map((pendencia) => ({
      campo: pendencia,
      label: pendencia,
      estrategia: "conciliacao",
      observacao: "Resolva antes de aprovar.",
      bloqueiaPublicacao: true,
    })),
    regrasImportantes: [],
    configuracaoPreco: null,
    // O estado-base de um item vinculado é o PRODUTO REAL, não o rascunho.
    //
    // Antes, `camposRascunho` simplesmente não era preenchido aqui, e a tela
    // caía nos textos de ausência: "Marca: Pendente", "Categoria: Pendente",
    // "Seções: Não definidas" — mesmo com o produto da loja tendo os três. O
    // código do fornecedor serve para ACHAR o produto; achado o vínculo, o que
    // a loja já pratica é a verdade até o gestor decidir mudar.
    //
    // O valor do rascunho vem primeiro porque ele só existe quando o gestor
    // editou o campo nesta conciliação — nesse caso é a decisão dele que vale.
    camposRascunho: {
      categoriaId: rascunho.categoriaId ?? rascunho.categoriaAtualLojaId,
      categoriaNome: rascunho.categoriaNome ?? rascunho.categoriaAtualLojaNome,
      marcaId: rascunho.marcaId ?? rascunho.marcaAtualLojaId,
      marcaNome: rascunho.marcaNome ?? rascunho.marcaAtualLojaNome,
      secoesLoja:
        rascunho.secoesLoja.length > 0
          ? rascunho.secoesLoja
          : rascunho.secoesAtuaisLoja,
      ncm: rascunho.ncm,
      ean: rascunho.ean,
      statusRascunho: rascunho.status,
    },
    produtoAtualizado: {
      produtoId: rascunho.produtoAtualizadoId ?? "",
      nome: rascunho.produtoAtualizadoNome,
      sku: rascunho.produtoAtualizadoSku,
      precoAtual: rascunho.precoAtualLoja,
      estoqueAtual: rascunho.estoqueAtualLoja,
      modalidadeAtual: rascunho.modalidadeAtualLoja,
      prazoAtual: rascunho.prazoAtualLoja,
    },
  };
}

function montarItensConciliacaoArquivo(
  rascunhos: RascunhoImportacaoFornecedor[],
): ItemConciliacaoFornecedor[] {
  return rascunhos.map((rascunho) => {
    // A presença de `produtoAtualizadoId` é o único sinal que separa os dois
    // caminhos. Sem ela, tudo abaixo continua sendo o caminho "criar produto".
    if (rascunho.produtoAtualizadoId) {
      return montarItemConciliacaoAtualizacao(rascunho);
    }

    const pendenciasObrigatorias = montarPendencias(rascunho);
    const alertas = montarAlertas(rascunho);
    const modalidade = rascunho.configuracaoComercial.modalidade;
    const prazo =
      rascunho.configuracaoComercial.prazoEntrega.valorPadraoTexto ?? null;

    return {
      id: rascunho.id,
      produto: {
        nome: rascunho.nome,
        codigo: rascunho.codigoFornecedor,
        preco: rascunho.precoLoja,
        precoFornecedor: rascunho.precoFornecedor,
        precoLoja: rascunho.precoLoja,
        estoque: rascunho.estoqueFornecedor,
        complemento: rascunho.descricao,
        imagemUrl: rascunho.imagens[0] ?? null,
      },
      acaoPrevista: "criar",
      statusVinculacao: "novo",
      status:
        pendenciasObrigatorias.length > 0
          ? "pendencia"
          : rascunho.status === "pronto_para_publicar"
            ? "pronto"
            : alertas.length > 0
              ? "alerta"
              : "pronto",
      pendenciasObrigatorias,
      alertas,
      regrasObrigatorias: pendenciasObrigatorias.map((pendencia) => ({
        campo: pendencia,
        label: pendencia,
        estrategia: "conciliacao",
        observacao: "Resolva antes da publicação.",
        bloqueiaPublicacao: true,
      })),
      regrasImportantes: alertas.map((alerta) => ({
        campo: alerta,
        label: alerta,
        estrategia: "conciliacao",
        observacao: "Pode ser revisado nesta etapa.",
      })),
      configuracaoPreco: {
        modalidade: modalidade ? ROTULOS_MODALIDADE[modalidade] : null,
        valorAplicado: rascunho.precoLoja,
        prazo,
        cardPrincipal: true,
        origem: "Configuração da importação",
      },
      camposRascunho: {
        categoriaId: rascunho.categoriaId,
        categoriaNome: rascunho.categoriaNome,
        marcaId: rascunho.marcaId,
        marcaNome: rascunho.marcaNome,
        secoesLoja: rascunho.secoesLoja,
        ncm: rascunho.ncm,
        ean: rascunho.ean,
        peso: rascunho.peso,
        altura: rascunho.altura,
        largura: rascunho.largura,
        comprimento: rascunho.comprimento,
        statusRascunho: rascunho.status,
        modalidadeComercial: modalidade,
        prazoEntrega: prazo,
      },
    };
  });
}

export function AbaConciliacaoImportacaoFornecedor({
  importacaoId,
  fornecedor,
  rascunhos,
  categoriasLoja,
  marcasLoja,
  hrefVoltar,
  hrefProximaEtapa,
  tipoOrigem = "arquivo",
}: AbaConciliacaoImportacaoFornecedorProps) {
  if (rascunhos.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xs">
        <p className="font-medium text-slate-900">
          Nenhum item selecionado para conciliação ainda.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Volte para Vinculação, selecione os itens vinculados ou marcados como
          novos e clique em &quot;Continuar para conciliação&quot;.
        </p>
      </div>
    );
  }

  return (
    <TabelaConciliacaoFornecedor
      tipoOrigem={tipoOrigem}
      fornecedor={fornecedor}
      titulo="Conciliação da importação"
      subtitulo="Revise os rascunhos criados antes de avançar no fluxo."
      hrefVoltar={
        hrefVoltar ??
        `/admin/fornecedores/importacoes/${importacaoId}?etapa=vinculacao`
      }
      hrefProximaEtapa={
        hrefProximaEtapa ??
        `/admin/fornecedores/importacoes/${importacaoId}/publicacao`
      }
      textoAcaoPrincipal="Continuar para publicação"
      itens={montarItensConciliacaoArquivo(rascunhos)}
      aoAjustarPrecosSelecionados={ajustarPrecosRascunhosImportacaoFornecedor.bind(
        null,
        importacaoId,
      )}
      aoAtualizarCamposRascunhos={atualizarCamposRascunhosImportacaoFornecedor.bind(
        null,
        importacaoId,
      )}
      aoAlterarDecisaoRascunhos={alterarDecisaoRascunhosImportacaoFornecedor.bind(
        null,
        importacaoId,
      )}
      categoriasLoja={categoriasLoja}
      marcasLoja={marcasLoja}
    />
  );
}
