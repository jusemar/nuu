export type VersaoConhecimentoSnapshot = {
  id: string;
  estado: string;
  hash: string;
  conteudo: string;
};
export function montarSnapshotPublicado(
  versao: VersaoConhecimentoSnapshot | null,
  comportamento: { id: string; hash: string; instrucoes: string } | null,
) {
  if (versao && versao.estado !== "publicado")
    throw new Error("SNAPSHOT_PUBLICADO_EXIGE_VERSAO_PUBLICADA");
  return Object.freeze({
    conhecimento: versao ? Object.freeze({ ...versao }) : null,
    comportamento: comportamento ? Object.freeze({ ...comportamento }) : null,
  });
}
