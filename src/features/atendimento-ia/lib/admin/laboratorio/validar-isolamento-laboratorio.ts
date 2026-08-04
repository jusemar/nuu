const PADROES_PROIBIDOS =
  /(executar-orquestrador|repositorio-orquestrador|ferramentas-protegidas|criar_pedido|alterar_estoque|enviar_whatsapp|confirmacao_ferramenta)/i;
export function validarIsolamentoLaboratorio(configuracao: unknown) {
  const texto = JSON.stringify(configuracao);
  if (PADROES_PROIBIDOS.test(texto))
    throw new Error("ISOLAMENTO_LABORATORIO_VIOLADO");
  return true;
}
