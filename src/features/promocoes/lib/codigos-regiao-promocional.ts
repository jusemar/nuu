export type EntradaCodigosRegiaoPromocional = {
  cep?: string | null;
  estado?: string | null;
  cidade?: string | null;
  regioesEntregaIds?: Array<number | string | null | undefined>;
};

const macrorregioesPorUf: Record<string, string> = {
  AC: "norte",
  AL: "nordeste",
  AM: "norte",
  AP: "norte",
  BA: "nordeste",
  CE: "nordeste",
  DF: "centro-oeste",
  ES: "sudeste",
  GO: "centro-oeste",
  MA: "nordeste",
  MG: "sudeste",
  MS: "centro-oeste",
  MT: "centro-oeste",
  PA: "norte",
  PB: "nordeste",
  PE: "nordeste",
  PI: "nordeste",
  PR: "sul",
  RJ: "sudeste",
  RN: "nordeste",
  RO: "norte",
  RR: "norte",
  RS: "sul",
  SC: "sul",
  SE: "nordeste",
  SP: "sudeste",
  TO: "norte",
};

export function normalizarCepPromocional(cep?: string | null) {
  const cepLimpo = cep?.replace(/\D/g, "") ?? "";
  return cepLimpo.length === 8 ? cepLimpo : null;
}

export function normalizarTextoCodigoRegiaoPromocional(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function montarCodigosRegiaoPromocional({
  estado,
  cidade,
  regioesEntregaIds = [],
}: EntradaCodigosRegiaoPromocional) {
  const codigos = new Set<string>(["brasil"]);
  const uf = estado?.trim().toUpperCase();

  if (uf && uf.length === 2) {
    codigos.add(`uf:${uf}`);

    const macrorregiao = macrorregioesPorUf[uf];
    if (macrorregiao) codigos.add(`macrorregiao:${macrorregiao}`);
  }

  if (uf && cidade?.trim()) {
    codigos.add(
      `cidade:${uf}:${normalizarTextoCodigoRegiaoPromocional(cidade)}`,
    );
  }

  for (const regiaoId of regioesEntregaIds) {
    if (regiaoId !== null && regiaoId !== undefined && String(regiaoId)) {
      codigos.add(`regiao_entrega:${regiaoId}`);
    }
  }

  return Array.from(codigos);
}

export function obterMacrorregioesPromocionais() {
  return [
    { codigo: "macrorregiao:norte", nome: "Norte" },
    { codigo: "macrorregiao:nordeste", nome: "Nordeste" },
    { codigo: "macrorregiao:centro-oeste", nome: "Centro-Oeste" },
    { codigo: "macrorregiao:sudeste", nome: "Sudeste" },
    { codigo: "macrorregiao:sul", nome: "Sul" },
  ];
}
