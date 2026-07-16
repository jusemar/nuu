import { obterRotuloModalidadePreco } from "../../constants/modalidades-preco";
import type { OperacaoAlteracaoEmMassa } from "../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type {
  DadosAlteracaoEmMassa,
  ModalidadePrecoProduto,
  ProdutoAlteracaoEmMassa,
} from "../../types/alteracao-em-massa.types";

export type ResultadoLinhaPreview =
  | "alterado"
  | "sem_alteracao"
  | "conflito"
  | "ignorado";

export type LinhaPreviewAlteracaoEmMassa = {
  id: string;
  produtoId: string;
  produto: string;
  sku: string;
  campo: string;
  atual: string;
  novo: string;
  resultado: ResultadoLinhaPreview;
  motivo?: string;
};

export type AlteracoesCalculadasProduto = {
  produto: {
    ativo?: boolean;
    categoriaId?: string;
    marcaId?: string;
    marcaNome?: string;
    secoesLoja?: string[];
    ncm?: string;
    pesoEmGramas?: number | null;
    alturaEmCm?: number | null;
    larguraEmCm?: number | null;
    comprimentoEmCm?: number | null;
  };
  precos: Array<{
    precoId: string;
    modalidade: ModalidadePrecoProduto;
    precoEmCentavos?: number;
    prazo?: string;
  }>;
  estoque?: { varianteId: string; quantidade: number };
};

export type PlanoProdutoAlteracaoEmMassa = {
  produto: ProdutoAlteracaoEmMassa;
  versao: string;
  linhas: LinhaPreviewAlteracaoEmMassa[];
  alteracoes: AlteracoesCalculadasProduto;
};

function dinheiro(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor / 100);
}

function aplicarNumero(atual: number, operacao: string, valor: number) {
  if (operacao === "definir") return valor;
  if (operacao === "aumentar" || operacao === "aumentar_valor") {
    return atual + valor;
  }
  if (operacao === "reduzir" || operacao === "reduzir_valor") {
    return atual - valor;
  }
  if (operacao === "aumentar_percentual") {
    return Math.round(atual * (1 + valor / 100));
  }
  return Math.round(atual * (1 - valor / 100));
}

function linha(
  produto: ProdutoAlteracaoEmMassa,
  indice: number,
  campo: string,
  atual: string,
  novo: string,
  motivo?: string,
): LinhaPreviewAlteracaoEmMassa {
  return {
    id: `${produto.id}-${indice}`,
    produtoId: produto.id,
    produto: produto.nome,
    sku: produto.sku,
    campo,
    atual,
    novo,
    resultado: motivo
      ? "conflito"
      : atual === novo
        ? "sem_alteracao"
        : "alterado",
    motivo,
  };
}

function calcularSecoes(
  atuais: string[],
  operacao: Extract<OperacaoAlteracaoEmMassa, { campo: "secoes" }>,
) {
  if (operacao.operacao === "substituir") return [...operacao.secoesIds];
  const novas = new Set(atuais);
  operacao.secoesIds.forEach((id) => {
    if (operacao.operacao === "remover") novas.delete(id);
    else novas.add(id);
  });
  return [...novas];
}

export function obterVersaoProdutoAlteracaoEmMassa(
  produto: ProdutoAlteracaoEmMassa,
) {
  return JSON.stringify({
    produto: produto.atualizadoEm.toISOString(),
    variante: produto.varianteTecnicaAtualizadaEm?.toISOString() ?? null,
    precos: produto.precosModalidades
      .map((preco) => [preco.modalidade, preco.atualizadoEm.toISOString()])
      .toSorted(([a], [b]) => a.localeCompare(b)),
  });
}

export function calcularPlanoAlteracaoEmMassa(
  produtos: ProdutoAlteracaoEmMassa[],
  operacoes: OperacaoAlteracaoEmMassa[],
  dados: DadosAlteracaoEmMassa,
): PlanoProdutoAlteracaoEmMassa[] {
  return produtos.map((produto) => {
    const alteracoes: AlteracoesCalculadasProduto = {
      produto: {},
      precos: [],
    };

    if (produto.tipoProduto !== "simple") {
      return {
        produto,
        versao: obterVersaoProdutoAlteracaoEmMassa(produto),
        alteracoes,
        linhas: [
          {
            id: `${produto.id}-ignorado`,
            produtoId: produto.id,
            produto: produto.nome,
            sku: produto.sku,
            campo: "Produto",
            atual: "Com variantes",
            novo: "—",
            resultado: "ignorado" as const,
            motivo: "Produtos com variantes não participam desta fase.",
          },
        ],
      };
    }

    const linhas = operacoes.map((operacao, indice) => {
      let resultado: LinhaPreviewAlteracaoEmMassa;
      switch (operacao.campo) {
        case "status":
          resultado = linha(
            produto,
            indice,
            "Status",
            produto.ativo ? "Ativo" : "Inativo",
            operacao.valor ? "Ativo" : "Inativo",
          );
          if (resultado.resultado === "alterado") {
            alteracoes.produto.ativo = operacao.valor;
          }
          return resultado;
        case "categoria": {
          const categoria = dados.categorias.find(
            (item) => item.id === operacao.categoriaId && item.ativa,
          );
          resultado = linha(
            produto,
            indice,
            "Categoria",
            produto.categoriaNome,
            categoria?.nome ?? "—",
            categoria ? undefined : "Categoria indisponível ou inativa.",
          );
          if (resultado.resultado === "alterado") {
            alteracoes.produto.categoriaId = operacao.categoriaId;
          }
          return resultado;
        }
        case "marca": {
          const marca = dados.marcas.find(
            (item) => item.id === operacao.marcaId && item.ativa,
          );
          resultado = linha(
            produto,
            indice,
            "Marca",
            produto.marcaNome,
            marca?.nome ?? "—",
            marca ? undefined : "Marca indisponível ou inativa.",
          );
          if (resultado.resultado === "alterado" && marca) {
            alteracoes.produto.marcaId = operacao.marcaId;
            alteracoes.produto.marcaNome = marca.nome;
          }
          return resultado;
        }
        case "secoes": {
          const novas = calcularSecoes(produto.secoesLoja, operacao).toSorted();
          const atuais = [...produto.secoesLoja].toSorted();
          resultado = linha(
            produto,
            indice,
            "Seções da Loja",
            atuais.join(", ") || "Nenhuma",
            novas.join(", ") || "Nenhuma",
          );
          if (resultado.resultado === "alterado") {
            alteracoes.produto.secoesLoja = novas;
          }
          return resultado;
        }
        case "preco": {
          const preco = produto.precosModalidades.find(
            (item) => item.modalidade === operacao.modalidade,
          );
          const rotulo = obterRotuloModalidadePreco(operacao.modalidade);
          if (!preco) {
            return linha(
              produto,
              indice,
              `Preço · ${rotulo}`,
              "Sem modalidade",
              "—",
              "A modalidade não existe neste produto.",
            );
          }
          const valorOperacao = operacao.operacao.includes("percentual")
            ? operacao.valor
            : Math.round(operacao.valor * 100);
          const novoPreco = aplicarNumero(
            preco.precoEmCentavos,
            operacao.operacao,
            valorOperacao,
          );
          resultado = linha(
            produto,
            indice,
            `Preço · ${rotulo}`,
            dinheiro(preco.precoEmCentavos),
            novoPreco < 0 ? "—" : dinheiro(novoPreco),
            novoPreco < 0 ? "O preço resultante seria negativo." : undefined,
          );
          if (resultado.resultado === "alterado") {
            alteracoes.precos.push({
              precoId: preco.id,
              modalidade: operacao.modalidade,
              precoEmCentavos: novoPreco,
            });
          }
          return resultado;
        }
        case "prazo": {
          const preco = produto.precosModalidades.find(
            (item) => item.modalidade === operacao.modalidade,
          );
          resultado = linha(
            produto,
            indice,
            `Prazo · ${obterRotuloModalidadePreco(operacao.modalidade)}`,
            preco?.prazo || "Não informado",
            operacao.valor,
            preco ? undefined : "A modalidade não existe neste produto.",
          );
          if (resultado.resultado === "alterado" && preco) {
            const existente = alteracoes.precos.find(
              (item) => item.modalidade === operacao.modalidade,
            );
            if (existente) existente.prazo = operacao.valor;
            else {
              alteracoes.precos.push({
                precoId: preco.id,
                modalidade: operacao.modalidade,
                prazo: operacao.valor,
              });
            }
          }
          return resultado;
        }
        case "estoque": {
          const atual = produto.estoqueVarianteTecnica;
          if (atual === null || !produto.varianteTecnicaId) {
            return linha(
              produto,
              indice,
              "Estoque",
              "Sem variante técnica",
              "—",
              "Produto simples sem variante técnica confiável.",
            );
          }
          const novo = aplicarNumero(atual, operacao.operacao, operacao.valor);
          resultado = linha(
            produto,
            indice,
            "Estoque",
            String(atual),
            novo < 0 ? "—" : String(novo),
            novo < 0 ? "O estoque resultante seria negativo." : undefined,
          );
          if (resultado.resultado === "alterado") {
            alteracoes.estoque = {
              varianteId: produto.varianteTecnicaId,
              quantidade: novo,
            };
          }
          return resultado;
        }
        case "ncm": {
          const numeros = operacao.valor.replace(/\D/g, "");
          const formatado = `${numeros.slice(0, 4)}.${numeros.slice(4, 6)}.${numeros.slice(6, 8)}`;
          resultado = linha(
            produto,
            indice,
            "NCM",
            produto.ncm || "Não informado",
            formatado,
          );
          if (resultado.resultado === "alterado") {
            alteracoes.produto.ncm = formatado;
          }
          return resultado;
        }
        case "peso":
        case "altura":
        case "largura":
        case "comprimento": {
          const atuais = {
            peso:
              produto.pesoEmGramas === null
                ? null
                : produto.pesoEmGramas / 1000,
            altura: produto.alturaEmCm,
            largura: produto.larguraEmCm,
            comprimento: produto.comprimentoEmCm,
          };
          const unidade = operacao.campo === "peso" ? "kg" : "cm";
          const atual = atuais[operacao.campo];
          const novo = operacao.operacao === "limpar" ? null : operacao.valor;
          resultado = linha(
            produto,
            indice,
            operacao.campo[0].toUpperCase() + operacao.campo.slice(1),
            atual === null ? "Não informado" : `${atual} ${unidade}`,
            novo === null ? "Não informado" : `${novo} ${unidade}`,
          );
          if (resultado.resultado === "alterado") {
            if (operacao.campo === "peso") {
              alteracoes.produto.pesoEmGramas =
                novo === null ? null : Math.round(novo * 1000);
            } else if (operacao.campo === "altura") {
              alteracoes.produto.alturaEmCm = novo;
            } else if (operacao.campo === "largura") {
              alteracoes.produto.larguraEmCm = novo;
            } else {
              alteracoes.produto.comprimentoEmCm = novo;
            }
          }
          return resultado;
        }
      }
    });

    return {
      produto,
      versao: obterVersaoProdutoAlteracaoEmMassa(produto),
      linhas,
      alteracoes,
    };
  });
}

export function calcularPreviewAlteracaoEmMassa(
  produtos: ProdutoAlteracaoEmMassa[],
  operacoes: OperacaoAlteracaoEmMassa[],
  dados: DadosAlteracaoEmMassa,
) {
  return calcularPlanoAlteracaoEmMassa(produtos, operacoes, dados).flatMap(
    (plano) => plano.linhas,
  );
}
