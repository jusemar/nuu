export const FERRAMENTAS_LABORATORIO = [
  "buscar_produto_ficticio",
  "consultar_preco_ficticio",
  "consultar_estoque_ficticio",
  "consultar_promocao_ficticia",
  "consultar_logistica_ficticia",
  "consultar_pedido_anonimizado",
  "simular_transferencia",
] as const;
export type FerramentaLaboratorio = (typeof FERRAMENTAS_LABORATORIO)[number];
export function ferramentaLaboratorioPermitida(
  nome: string,
): nome is FerramentaLaboratorio {
  return (FERRAMENTAS_LABORATORIO as readonly string[]).includes(nome);
}
