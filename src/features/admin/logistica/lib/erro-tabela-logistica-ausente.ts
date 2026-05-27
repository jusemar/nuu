const tabelasLogistica = [
  "provedores_frete",
  "transportadoras_frete",
  "servicos_frete",
  "regras_categorias_frete",
  "regras_produtos_frete",
  "tipos_logisticos",
  "produtos_tipos_logisticos",
  "regras_tipos_logisticos_frete",
];

export function erroTabelaLogisticaAusente(erro: unknown) {
  const mensagemErro = erro instanceof Error ? erro.message.toLowerCase() : "";
  const semRelacao = mensagemErro.includes("does not exist") || mensagemErro.includes("doesn't exist");
  if (!semRelacao) return false;
  return tabelasLogistica.some((tabela) => mensagemErro.includes(tabela));
}
