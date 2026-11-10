/** O formulário atual envia os tipos dentro de `entrega`; chamadas antigas usam a raiz. */
export function resolverTiposEntregaCadastro(entrada: {
  entrega?: { tiposEntregaPermitidos?: string[] };
  allowedDeliveryTypes?: string[];
}): string[] {
  return (
    entrada.entrega?.tiposEntregaPermitidos ??
    entrada.allowedDeliveryTypes ?? ["own"]
  );
}
