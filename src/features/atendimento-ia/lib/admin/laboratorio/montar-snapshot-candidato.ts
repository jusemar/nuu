export function montarSnapshotCandidato(
  conhecimento: { id: string; hash: string; conteudo: string } | null,
  comportamento: { id: string; hash: string; instrucoes: string } | null,
) {
  if (!conhecimento && !comportamento) throw new Error("CANDIDATO_AUSENTE");
  return Object.freeze({
    conhecimento: conhecimento ? Object.freeze({ ...conhecimento }) : null,
    comportamento: comportamento ? Object.freeze({ ...comportamento }) : null,
    isoladoDoChatPublico: true as const,
  });
}
