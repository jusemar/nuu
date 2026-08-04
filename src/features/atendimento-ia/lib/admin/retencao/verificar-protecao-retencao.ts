export function verificarProtecaoRetencao(registro: {
  auditoriaPermanente?: boolean;
  identidadePublicacao?: string | null;
  publicado?: boolean;
  usadoEmExecucaoPublica?: boolean;
  usadoEmPublicacao?: boolean;
}) {
  const motivos = [
    registro.publicado && "versao_publicada",
    registro.usadoEmPublicacao && "usado_em_publicacao",
    registro.usadoEmExecucaoPublica && "usado_em_execucao_publica",
    registro.auditoriaPermanente && "auditoria_permanente",
    registro.identidadePublicacao && "identidade_publicacao",
  ].filter(Boolean) as string[];
  return { motivos, protegido: motivos.length > 0 };
}
