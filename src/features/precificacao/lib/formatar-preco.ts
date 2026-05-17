export function formatarPrecoEmReais(valorEmCentavos: number) {
  return (valorEmCentavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
