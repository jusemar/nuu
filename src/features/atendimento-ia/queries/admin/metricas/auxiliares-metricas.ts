import type {
  DistribuicaoMetrica,
  MetricaAdministrativa,
} from "../../../types/admin/metricas";

export function numero(valor: unknown) {
  return valor === null || valor === undefined ? 0 : Number(valor);
}

export function metrica(
  chave: string,
  valor: unknown,
  registros: unknown,
  fonte: string,
  unidade: MetricaAdministrativa["unidade"] = "quantidade",
  status?: MetricaAdministrativa["status"],
): MetricaAdministrativa {
  const quantidadeRegistros = numero(registros);
  return {
    chave,
    fonte,
    quantidadeRegistros,
    status: status ?? (quantidadeRegistros ? "real" : "real"),
    unidade,
    valor:
      quantidadeRegistros || chave.endsWith("total") ? numero(valor) : null,
  };
}

export function indisponivel(
  chave: string,
  fonte: string,
): MetricaAdministrativa {
  return {
    chave,
    fonte,
    quantidadeRegistros: 0,
    status: "indisponivel",
    unidade: "quantidade",
    valor: null,
  };
}

export function distribuicao(
  chave: string,
  fonte: string,
  linhas: Array<{ nome: string; total: unknown }>,
): DistribuicaoMetrica {
  const itens = linhas.map((linha) => ({
    nome: linha.nome,
    total: numero(linha.total),
  }));
  return {
    chave,
    fonte,
    itens,
    quantidadeRegistros: itens.reduce((soma, item) => soma + item.total, 0),
    status: "real",
  };
}
