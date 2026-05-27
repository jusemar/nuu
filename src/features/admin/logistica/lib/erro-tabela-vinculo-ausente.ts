export function erroTabelaVinculoAusente(erro: unknown) {
  const mensagemErro = erro instanceof Error ? erro.message.toLowerCase() : "";
  return (
    mensagemErro.includes("produtos_tipos_logisticos") ||
    mensagemErro.includes("does not exist") ||
    mensagemErro.includes("doesn't exist")
  );
}
