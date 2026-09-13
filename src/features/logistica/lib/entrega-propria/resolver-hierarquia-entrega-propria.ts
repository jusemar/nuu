export type NivelGeograficoEntregaPropria =
  | "cep"
  | "bairro"
  | "regiao"
  | "cidade";

export type IdentificadoresGeograficosEntregaPropria = {
  cepId?: number | null;
  bairroId?: number | null;
  regiaoId?: number | null;
  cidadeId: number;
};

type RegistroHierarquico = {
  tipoDestino: NivelGeograficoEntregaPropria;
  cidadeId?: number | null;
  regiaoId?: number | null;
  bairroId?: number | null;
  cepEspecificoId?: number | null;
};

const PRECEDENCIA: NivelGeograficoEntregaPropria[] = [
  "cep",
  "bairro",
  "regiao",
  "cidade",
];

function correspondeAoDestino(
  registro: RegistroHierarquico,
  nivel: NivelGeograficoEntregaPropria,
  ids: IdentificadoresGeograficosEntregaPropria,
) {
  if (registro.tipoDestino !== nivel) return false;
  if (nivel === "cep") return registro.cepEspecificoId === ids.cepId;
  if (nivel === "bairro") return registro.bairroId === ids.bairroId;
  if (nivel === "regiao") return registro.regiaoId === ids.regiaoId;
  return registro.cidadeId === ids.cidadeId;
}

/** Resolve a precedência oficial sem acoplar a regra a banco ou interface. */
export function resolverRegistroGeograficoEntregaPropria<
  T extends RegistroHierarquico,
>(registros: readonly T[], ids: IdentificadoresGeograficosEntregaPropria) {
  for (const nivel of PRECEDENCIA) {
    const registro = registros.find((item) =>
      correspondeAoDestino(item, nivel, ids),
    );
    if (registro) return { registro, nivel };
  }

  return null;
}
