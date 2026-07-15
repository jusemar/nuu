import type { RascunhoImportacaoFornecedor } from "../../queries/listar-rascunhos-importacao-fornecedor";
import {
  ajustarPrecosRascunhosImportacaoFornecedor,
  atualizarCamposRascunhosImportacaoFornecedor,
} from "../../actions/atualizar-rascunhos-conciliacao-importacao-fornecedor";
import type { OpcaoValorPadraoLoja } from "./tabela-mapeamento-campos-fornecedor";
import {
  type ItemConciliacaoFornecedor,
  TabelaConciliacaoFornecedor,
} from "./tabela-conciliacao-fornecedor";

type AbaConciliacaoImportacaoFornecedorProps = {
  importacaoId: string;
  fornecedor: string;
  rascunhos: RascunhoImportacaoFornecedor[];
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: Array<{ id: string; nome: string }>;
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

function montarItensConciliacaoArquivo(
  rascunhos: RascunhoImportacaoFornecedor[],
): ItemConciliacaoFornecedor[] {
  return rascunhos.map((rascunho) => {
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
}: AbaConciliacaoImportacaoFornecedorProps) {
  if (rascunhos.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xs">
        <p className="font-medium text-slate-900">
          Nenhum rascunho criado para conciliação.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Volte para Vinculação e marque os produtos que serão criados.
        </p>
      </div>
    );
  }

  return (
    <TabelaConciliacaoFornecedor
      tipoOrigem="arquivo"
      fornecedor={fornecedor}
      titulo="Conciliação da importação"
      subtitulo="Revise os rascunhos criados antes de avançar no fluxo."
      hrefVoltar={`/admin/fornecedores/importacoes/${importacaoId}?etapa=vinculacao`}
      hrefProximaEtapa={`/admin/fornecedores/importacoes/${importacaoId}/publicacao`}
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
      categoriasLoja={categoriasLoja}
      marcasLoja={marcasLoja}
    />
  );
}
