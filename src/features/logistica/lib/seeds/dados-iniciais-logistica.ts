type RegistroBase = {
  identificador: string;
  nome: string;
  ativo: boolean;
};

export type RegistroProvedorSeed = RegistroBase;

export type RegistroTipoLogisticoSeed = RegistroBase & {
  descricao: string | null;
};

export type RegistroTransportadoraSeed = RegistroBase & {
  provedorIdentificador: string;
};

export type RegistroServicoSeed = RegistroBase & {
  provedorIdentificador: string;
  transportadoraIdentificador: string | null;
};

export const provedoresFreteIniciais: RegistroProvedorSeed[] = [
  { identificador: "entrega-propria", nome: "Entrega Própria", ativo: true },
  { identificador: "retirada", nome: "Retirada", ativo: true },
  { identificador: "frenet", nome: "Frenet", ativo: true },
];

export const tiposLogisticosIniciais: RegistroTipoLogisticoSeed[] = [
  {
    identificador: "produto-fragil",
    nome: "Produto Frágil",
    descricao: "Itens com necessidade de transporte cuidadoso",
    ativo: true,
  },
  {
    identificador: "produto-pesado",
    nome: "Produto Pesado",
    descricao: "Itens com peso elevado para transporte",
    ativo: true,
  },
  {
    identificador: "grande-volume",
    nome: "Grande Volume",
    descricao: "Itens volumosos que exigem capacidade de carga",
    ativo: true,
  },
  {
    identificador: "restricao-correios",
    nome: "Restrição Correios",
    descricao: "Itens com restrição de envio por Correios",
    ativo: true,
  },
  {
    identificador: "somente-transportadora",
    nome: "Somente Transportadora",
    descricao: "Itens enviados apenas por transportadora específica",
    ativo: true,
  },
];

export const transportadorasFreteIniciais: RegistroTransportadoraSeed[] = [
  {
    identificador: "correios",
    nome: "Correios",
    provedorIdentificador: "frenet",
    ativo: true,
  },
  {
    identificador: "jadlog",
    nome: "Jadlog",
    provedorIdentificador: "frenet",
    ativo: true,
  },
];

export const servicosFreteIniciais: RegistroServicoSeed[] = [
  {
    identificador: "correios-pac",
    nome: "Correios PAC",
    provedorIdentificador: "frenet",
    transportadoraIdentificador: "correios",
    ativo: true,
  },
  {
    identificador: "correios-sedex",
    nome: "Correios SEDEX",
    provedorIdentificador: "frenet",
    transportadoraIdentificador: "correios",
    ativo: true,
  },
  {
    identificador: "jadlog",
    nome: "Jadlog",
    provedorIdentificador: "frenet",
    transportadoraIdentificador: "jadlog",
    ativo: true,
  },
];

type EntradaPlanejamento = {
  provedoresExistentes: Array<{ identificador: string }>;
  tiposExistentes: Array<{ identificador: string }>;
  transportadorasExistentes: Array<{ identificador: string; provedorIdentificador: string }>;
  servicosExistentes: Array<{ identificador: string; provedorIdentificador: string }>;
};

export function planejarSeedDadosIniciaisLogistica({
  provedoresExistentes,
  tiposExistentes,
  transportadorasExistentes,
  servicosExistentes,
}: EntradaPlanejamento) {
  const chaveProvedor = (identificador: string) => identificador.trim().toLowerCase();
  const chaveTransportadora = (identificador: string, provedorIdentificador: string) =>
    `${provedorIdentificador.trim().toLowerCase()}::${identificador.trim().toLowerCase()}`;
  const chaveServico = (identificador: string, provedorIdentificador: string) =>
    `${provedorIdentificador.trim().toLowerCase()}::${identificador.trim().toLowerCase()}`;

  const provedoresSet = new Set(provedoresExistentes.map((item) => chaveProvedor(item.identificador)));
  const tiposSet = new Set(tiposExistentes.map((item) => chaveProvedor(item.identificador)));
  const transportadorasSet = new Set(
    transportadorasExistentes.map((item) =>
      chaveTransportadora(item.identificador, item.provedorIdentificador),
    ),
  );
  const servicosSet = new Set(
    servicosExistentes.map((item) => chaveServico(item.identificador, item.provedorIdentificador)),
  );

  return {
    provedoresCriar: provedoresFreteIniciais.filter(
      (item) => !provedoresSet.has(chaveProvedor(item.identificador)),
    ),
    tiposCriar: tiposLogisticosIniciais.filter(
      (item) => !tiposSet.has(chaveProvedor(item.identificador)),
    ),
    transportadorasCriar: transportadorasFreteIniciais.filter(
      (item) =>
        !transportadorasSet.has(
          chaveTransportadora(item.identificador, item.provedorIdentificador),
        ),
    ),
    servicosCriar: servicosFreteIniciais.filter(
      (item) => !servicosSet.has(chaveServico(item.identificador, item.provedorIdentificador)),
    ),
  };
}

