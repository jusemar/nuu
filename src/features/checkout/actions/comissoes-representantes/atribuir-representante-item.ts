"use server";
/** Compatibilidade fail-closed: atribuição manual de pedido não existe mais. */
export async function atribuirRepresentanteItemPedidoGestor(_entrada:unknown){
 void _entrada;
 return {sucesso:false as const,mensagem:"Defina o representante comissionado no produto. Pedidos capturam a escolha automaticamente e não aceitam atribuição manual."};
}
