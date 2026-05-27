import { PaginaServicosEntregaLogistica } from "@/features/admin/logistica/components/operacao/paginas-logistica-operacional";
import { listarServicosFrete } from "@/features/admin/logistica/queries/frete";
import { listarRegrasCategoriasFrete } from "@/features/admin/logistica/queries/regras-categorias";
import { listarRegrasProdutosFrete } from "@/features/admin/logistica/queries/regras-produtos";
import { listarRegrasTiposLogisticosFrete } from "@/features/admin/logistica/queries/tipos-logisticos";

type ParametrosPagina = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valorTexto(parametro: string | string[] | undefined, padrao = "") {
  if (Array.isArray(parametro)) return parametro[0] ?? padrao;
  return parametro ?? padrao;
}

function formatarPeso(valor: number | null) {
  if (valor === null) return "Sem limite configurado";
  return valor >= 1000 ? `até ${valor / 1000} kg` : `até ${valor} g`;
}

function formatarDimensoes(
  altura: number | null,
  largura: number | null,
  comprimento: number | null,
) {
  if (altura === null && largura === null && comprimento === null) {
    return "Sem limite configurado";
  }
  return `${comprimento ?? "-"} x ${largura ?? "-"} x ${altura ?? "-"} cm`;
}

function identificarOrigem(identificador: string, nomeProvedor: string) {
  const normalizado = identificador.toLowerCase().replaceAll("_", "-");
  if (normalizado.includes("entrega-propria")) {
    return { origem: "entrega-propria" as const, nome: "Entrega Própria" };
  }
  if (normalizado.includes("retirada")) {
    return { origem: "retirada" as const, nome: "Retirada" };
  }
  return { origem: "externo" as const, nome: nomeProvedor };
}

export default async function ServicosEntregaLogisticaPage({ searchParams }: ParametrosPagina) {
  const parametros = (await searchParams) ?? {};
  const [servicos, regrasCategorias, regrasProdutos, regrasTipos] = await Promise.all([
    listarServicosFrete(),
    listarRegrasCategoriasFrete(),
    listarRegrasProdutosFrete(),
    listarRegrasTiposLogisticosFrete(),
  ]);
  const regras = [...regrasCategorias, ...regrasProdutos, ...regrasTipos];

  function regraAlcancaServico(
    regra: {
      ativo: boolean;
      provedorFreteId: string | null;
      transportadoraFreteId: string | null;
      servicoFreteId: string | null;
    },
    servico: (typeof servicos)[number],
  ) {
    return (
      regra.ativo &&
      (!regra.provedorFreteId || regra.provedorFreteId === servico.provedorFreteId) &&
      (!regra.transportadoraFreteId ||
        regra.transportadoraFreteId === servico.transportadoraFreteId) &&
      (!regra.servicoFreteId || regra.servicoFreteId === servico.id)
    );
  }

  return (
    <PaginaServicosEntregaLogistica
      servicos={servicos.map((servico) => {
        const origem = identificarOrigem(servico.provedorIdentificador, servico.provedorNome);
        const permissoesTipos = regrasTipos.filter(
          (regra) => regra.efeito === "permitir" && regraAlcancaServico(regra, servico),
        );

        return {
          id: servico.id,
          nome: servico.nome,
          ativo: servico.ativo,
          transportadoraNome: servico.transportadoraNome ?? origem.nome,
          origemNome: origem.nome,
          origem: origem.origem,
          limitePeso: formatarPeso(servico.pesoMaximoEmGramas),
          limiteDimensoes: formatarDimensoes(
            servico.alturaMaximaEmCm,
            servico.larguraMaximaEmCm,
            servico.comprimentoMaximoEmCm,
          ),
          tiposLogisticosCompativeis: permissoesTipos.map((regra) => regra.tipoLogisticoNome),
          quantidadeRegrasAplicadas: regras.filter((regra) =>
            regraAlcancaServico(regra, servico),
          ).length,
        };
      })}
      filtros={{
        busca: valorTexto(parametros.busca),
        origem:
          valorTexto(parametros.origem) === "externo" ||
          valorTexto(parametros.origem) === "entrega-propria" ||
          valorTexto(parametros.origem) === "retirada"
            ? valorTexto(parametros.origem) as "externo" | "entrega-propria" | "retirada"
            : "todas",
        status:
          valorTexto(parametros.status) === "ativos" || valorTexto(parametros.status) === "inativos"
            ? valorTexto(parametros.status) as "ativos" | "inativos"
            : "todos",
      }}
    />
  );
}
