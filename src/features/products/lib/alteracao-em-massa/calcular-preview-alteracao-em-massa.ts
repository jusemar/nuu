import { obterRotuloModalidadePreco } from "../../constants/modalidades-preco";
import type { OperacaoAlteracaoEmMassa } from "../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type {
  DadosAlteracaoEmMassa,
  ModalidadePrecoProduto,
  ProdutoAlteracaoEmMassa,
} from "../../types/alteracao-em-massa.types";
import { serializarVersoesProdutoAlteracaoEmMassa } from "./concorrencia-alteracao-em-massa";

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
  entregaPropria: Array<{
    precoEntregaId: number;
    ativo?: boolean;
    precoEmCentavos?: number;
    entregaProgramadaAtiva?: boolean;
    prazoMinimoProgramadaDias?: number;
    precoProgramadaEmCentavos?: number;
  }>;
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

export function obterVersaoProdutoAlteracaoEmMassa(
  produto: ProdutoAlteracaoEmMassa,
) {
  return serializarVersoesProdutoAlteracaoEmMassa(produto);
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
      entregaPropria: [],
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

    const linhas = operacoes.flatMap((operacao, indice) => {
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
          return [resultado];
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
          return [resultado];
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
          return [resultado];
        }
        case "preco": {
          const precosExistentes = produto.precosModalidades.filter(
            (preco) =>
              Number.isSafeInteger(preco.precoEmCentavos) &&
              preco.precoEmCentavos >= 0,
          );
          if (precosExistentes.length === 0) {
            return [
              linha(
                produto,
                indice,
                "Preço",
                "Nenhuma modalidade com preço",
                "—",
                "O produto não possui modalidade com preço válido.",
              ),
            ];
          }

          return precosExistentes.map((preco, indiceModalidade) => {
            const rotulo = obterRotuloModalidadePreco(preco.modalidade);
            const valorOperacao = operacao.operacao.includes("percentual")
              ? operacao.valor
              : Math.round(operacao.valor * 100);
            const novoPreco = aplicarNumero(
              preco.precoEmCentavos,
              operacao.operacao,
              valorOperacao,
            );
            const resultadoPreco = linha(
              produto,
              indice * 10 + indiceModalidade,
              `Preço · ${rotulo}`,
              dinheiro(preco.precoEmCentavos),
              novoPreco < 0 ? "—" : dinheiro(novoPreco),
              novoPreco < 0 ? "O preço resultante seria negativo." : undefined,
            );
            if (resultadoPreco.resultado === "alterado") {
              alteracoes.precos.push({
                precoId: preco.id,
                modalidade: preco.modalidade,
                precoEmCentavos: novoPreco,
              });
            }
            return resultadoPreco;
          });
        }
        case "prazo": {
          const preco = produto.precosModalidades.find(
            (item) => item.modalidade === operacao.modalidade,
          );
          const rotulo = obterRotuloModalidadePreco(operacao.modalidade);
          resultado = linha(
            produto,
            indice,
            `Prazo · ${rotulo}`,
            preco?.prazo || "Não informado",
            operacao.valor,
            preco
              ? undefined
              : `A modalidade ${rotulo} não está cadastrada neste produto; o prazo pertence ao registro da modalidade.`,
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
          return [resultado];
        }
        case "estoque": {
          const atual = produto.estoqueVarianteTecnica;
          if (atual === null || !produto.varianteTecnicaId) {
            return [
              linha(
                produto,
                indice,
                "Estoque",
                "Sem variante técnica",
                "—",
                produto.conflitoVarianteTecnica ??
                  "Produto simples sem variante técnica confiável.",
              ),
            ];
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
          return [resultado];
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
          return [resultado];
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
          return [resultado];
        }
        case "entrega_rapida": {
          if (produto.precosEntregaPropria.length === 0) {
            return [
              linha(
                produto,
                indice,
                "Entrega rápida",
                "Sem destino configurado",
                "—",
                "O produto não possui regra de Entrega Própria; nenhuma cobertura será criada.",
              ),
            ];
          }

          return produto.precosEntregaPropria.flatMap(
            (precoEntrega, indiceDestino) => {
              const alteracao = {
                precoEntregaId: precoEntrega.id,
              } as AlteracoesCalculadasProduto["entregaPropria"][number];
              const linhasDestino: LinhaPreviewAlteracaoEmMassa[] = [];
              if (operacao.ativo !== undefined) {
                const resultadoStatus = linha(
                  produto,
                  indice * 100 + indiceDestino * 10,
                  `Entrega rápida · ${precoEntrega.destino} · Status`,
                  precoEntrega.ativo ? "Ativa" : "Inativa",
                  operacao.ativo ? "Ativa" : "Inativa",
                );
                if (resultadoStatus.resultado === "alterado") {
                  alteracao.ativo = operacao.ativo;
                }
                linhasDestino.push(resultadoStatus);
              }
              if (operacao.preco !== undefined) {
                const novoPreco = Math.round(operacao.preco * 100);
                const resultadoPreco = linha(
                  produto,
                  indice * 100 + indiceDestino * 10 + 1,
                  `Entrega rápida · ${precoEntrega.destino} · Valor`,
                  dinheiro(precoEntrega.precoEmCentavos),
                  dinheiro(novoPreco),
                );
                if (resultadoPreco.resultado === "alterado") {
                  alteracao.precoEmCentavos = novoPreco;
                }
                linhasDestino.push(resultadoPreco);
              }
              if (Object.keys(alteracao).length > 1) {
                alteracoes.entregaPropria.push(alteracao);
              }
              return linhasDestino;
            },
          );
        }
        case "entrega_programada": {
          if (produto.precosEntregaPropria.length === 0) {
            return [
              linha(
                produto,
                indice,
                "Entrega programada",
                "Sem destino configurado",
                "—",
                "O produto não possui regra de Entrega Própria; nenhuma cobertura será criada.",
              ),
            ];
          }

          return produto.precosEntregaPropria.flatMap(
            (precoEntrega, indiceDestino) => {
              const alteracao = {
                precoEntregaId: precoEntrega.id,
              } as AlteracoesCalculadasProduto["entregaPropria"][number];
              const linhasDestino: LinhaPreviewAlteracaoEmMassa[] = [];
              if (operacao.ativa !== undefined) {
                const resultadoStatus = linha(
                  produto,
                  indice * 100 + indiceDestino * 10,
                  `Entrega programada · ${precoEntrega.destino} · Status`,
                  precoEntrega.entregaProgramadaAtiva ? "Ativa" : "Inativa",
                  operacao.ativa ? "Ativa" : "Inativa",
                );
                if (resultadoStatus.resultado === "alterado") {
                  alteracao.entregaProgramadaAtiva = operacao.ativa;
                }
                linhasDestino.push(resultadoStatus);
              }
              if (operacao.prazoMinimoDias !== undefined) {
                const resultadoPrazo = linha(
                  produto,
                  indice * 100 + indiceDestino * 10 + 1,
                  `Entrega programada · ${precoEntrega.destino} · Prazo mínimo`,
                  precoEntrega.prazoMinimoProgramadaDias === null
                    ? "Não informado"
                    : `${precoEntrega.prazoMinimoProgramadaDias} dia(s) corrido(s)`,
                  `${operacao.prazoMinimoDias} dia(s) corrido(s)`,
                );
                if (resultadoPrazo.resultado === "alterado") {
                  alteracao.prazoMinimoProgramadaDias =
                    operacao.prazoMinimoDias;
                }
                linhasDestino.push(resultadoPrazo);
              }
              if (operacao.valor !== undefined) {
                const novoPreco = Math.round(operacao.valor * 100);
                const resultadoValor = linha(
                  produto,
                  indice * 100 + indiceDestino * 10 + 2,
                  `Entrega programada · ${precoEntrega.destino} · Valor`,
                  precoEntrega.precoProgramadaEmCentavos === null
                    ? "Não informado"
                    : dinheiro(precoEntrega.precoProgramadaEmCentavos),
                  dinheiro(novoPreco),
                );
                if (resultadoValor.resultado === "alterado") {
                  alteracao.precoProgramadaEmCentavos = novoPreco;
                }
                linhasDestino.push(resultadoValor);
              }
              if (Object.keys(alteracao).length > 1) {
                alteracoes.entregaPropria.push(alteracao);
              }
              return linhasDestino;
            },
          );
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
