import type { OpcaoFrete } from "@/features/logistica/types/contratos-frete";

type TransportadoraCatalogoFrenet = {
  identificador: string;
  nome: string;
};

type ServicoCatalogoFrenet = {
  identificador: string;
  nome: string;
  transportadoraIdentificador: string;
};

function criarIdentificador(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function mapearCatalogoFrenet(opcoes: OpcaoFrete[]) {
  const transportadorasPorIdentificador = new Map<
    string,
    TransportadoraCatalogoFrenet
  >();
  const servicosPorIdentificador = new Map<string, ServicoCatalogoFrenet>();

  for (const opcao of opcoes) {
    const transportadora =
      typeof opcao.metadados?.transportadora === "string"
        ? opcao.metadados.transportadora.trim()
        : "";

    if (!transportadora || !opcao.servico.trim()) continue;

    const transportadoraIdentificador = criarIdentificador(transportadora);
    const servicoIdentificador = criarIdentificador(opcao.servico);
    if (!transportadoraIdentificador || !servicoIdentificador) continue;

    transportadorasPorIdentificador.set(transportadoraIdentificador, {
      identificador: transportadoraIdentificador,
      nome: transportadora,
    });
    servicosPorIdentificador.set(servicoIdentificador, {
      identificador: servicoIdentificador,
      nome: opcao.nome,
      transportadoraIdentificador,
    });
  }

  return {
    transportadoras: [...transportadorasPorIdentificador.values()],
    servicos: [...servicosPorIdentificador.values()],
  };
}
