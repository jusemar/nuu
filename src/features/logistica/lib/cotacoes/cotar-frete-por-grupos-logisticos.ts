import type {
  ItemLogistico,
  PacoteEnvio,
  ResultadoCotacaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import type {
  CotacaoGrupoLogistico,
  ResultadoCotacoesGruposLogisticos,
} from "../../types/cotacoes-grupos-logisticos";
import type { GrupoLogistico } from "../../types/grupos-logisticos";
import {
  type ConfiguracaoCotacaoFreteInterna,
  cotarFreteInterno,
  type DependenciasCotacaoFreteInterna,
} from "./cotar-frete-interno";

function filtrarPacotesDoGrupo(
  pacotes: PacoteEnvio[],
  itensGrupo: ItemLogistico[],
): PacoteEnvio[] {
  const identificadores = new Set(itensGrupo.map((item) => item.identificador));

  return pacotes.flatMap((pacote) => {
    const itens = pacote.itens.filter((item) =>
      identificadores.has(item.identificador),
    );

    if (itens.length === 0) return [];

    return [
      {
        ...pacote,
        itens,
        quantidadeVolumes: itens.reduce(
          (total, item) => total + item.quantidade,
          0,
        ),
        pesoTotalEmGramas: itens.reduce(
          (total, item) => total + item.pesoEmGramas * item.quantidade,
          0,
        ),
      },
    ];
  });
}

function criarSolicitacaoDoGrupo(
  solicitacao: SolicitacaoCotacaoFrete,
  grupo: GrupoLogistico<ItemLogistico>,
  preservarSolicitacaoOriginal: boolean,
): SolicitacaoCotacaoFrete {
  if (preservarSolicitacaoOriginal) return solicitacao;

  return {
    ...solicitacao,
    identificador: `${solicitacao.identificador}:${grupo.chave}`,
    itens: [...grupo.itens],
    pacotes: filtrarPacotesDoGrupo(solicitacao.pacotes, grupo.itens),
    gruposLogisticos: [{ ...grupo, itens: [...grupo.itens] }],
  };
}

function obterDependenciasDoGrupo(
  grupo: GrupoLogistico<ItemLogistico>,
  dependencias: DependenciasCotacaoFreteInterna,
): DependenciasCotacaoFreteInterna {
  if (grupo.origemExpedicao === "loja") return dependencias;

  return {
    frenet: dependencias.frenet,
  };
}

function criarFalhaInesperada(
  solicitacao: SolicitacaoCotacaoFrete,
): ResultadoCotacaoFrete {
  return {
    sucesso: false,
    solicitacao,
    opcoes: [],
    erros: [
      {
        codigo: "cotacao-grupo-logistico-indisponivel",
        mensagem: "Nao foi possivel concluir a cotacao deste grupo logistico.",
      },
    ],
  };
}

export async function cotarFretePorGruposLogisticos(
  solicitacao: SolicitacaoCotacaoFrete,
  dependencias: DependenciasCotacaoFreteInterna,
  configuracao: ConfiguracaoCotacaoFreteInterna & {
    cepOrigemFornecedorPorProvedor?: Readonly<Record<string, string | null>>;
  } = {},
): Promise<ResultadoCotacoesGruposLogisticos> {
  const preservarSolicitacaoOriginal =
    solicitacao.gruposLogisticos.length === 1;
  const cotacoes = await Promise.all(
    solicitacao.gruposLogisticos.map(async (grupo) => {
      const cepOrigem =
        grupo.origemExpedicao === "loja"
          ? (configuracao.frenet?.cepOrigem ?? "")
          : (configuracao.cepOrigemFornecedorPorProvedor?.[
              grupo.fornecedorProvedor ?? ""
            ] ?? "");
      let solicitacaoGrupo = criarSolicitacaoDoGrupo(
        solicitacao,
        grupo,
        preservarSolicitacaoOriginal,
      );

      // O identificador da seleção do fornecedor carrega a origem utilizada.
      // Assim, trocar o CEP configurado força uma nova seleção na revalidação.
      if (grupo.origemExpedicao === "fornecedor" && cepOrigem) {
        solicitacaoGrupo = {
          ...solicitacaoGrupo,
          identificador: `${solicitacaoGrupo.identificador}:origem:${cepOrigem}`,
        };
      }

      let resultado: ResultadoCotacaoFrete;

      if (
        grupo.origemExpedicao === "fornecedor" &&
        !/^\d{8}$/u.test(cepOrigem)
      ) {
        resultado = {
          sucesso: false,
          solicitacao: solicitacaoGrupo,
          opcoes: [],
          erros: [
            {
              codigo: "cep-origem-fornecedor-nao-configurado",
              mensagem:
                "CEP de origem da logística do fornecedor não configurado.",
            },
          ],
        };
      } else {
        try {
          const configuracaoGrupo =
            grupo.origemExpedicao === "fornecedor" && configuracao.frenet
              ? {
                  ...configuracao,
                  frenet: { ...configuracao.frenet, cepOrigem },
                }
              : configuracao;
          resultado = await cotarFreteInterno(
            solicitacaoGrupo,
            obterDependenciasDoGrupo(grupo, dependencias),
            configuracaoGrupo,
          );
        } catch {
          resultado = criarFalhaInesperada(solicitacaoGrupo);
        }
      }

      return {
        chaveGrupo: grupo.chave,
        cepOrigem,
        origemExpedicao: grupo.origemExpedicao,
        fornecedorProvedor: grupo.fornecedorProvedor,
        necessitaEtiquetaFornecedor: grupo.necessitaEtiquetaFornecedor,
        itens: [...grupo.itens],
        solicitacao: solicitacaoGrupo,
        resultado,
      } satisfies CotacaoGrupoLogistico;
    }),
  );

  return {
    identificadorCotacaoOriginal: solicitacao.identificador,
    cotacoes,
  };
}
