export function formatarMoedaAdminPedido(valorEmCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

export function formatarDataAdminPedido(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function formatarDocumentoAdminPedido(documento: string) {
  const limpo = documento.replace(/\D/g, "");

  if (limpo.length === 11) {
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (limpo.length === 14) {
    return limpo.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }

  return documento;
}

export function formatarCepAdminPedido(cep: string) {
  const limpo = cep.replace(/\D/g, "");

  if (limpo.length !== 8) {
    return cep;
  }

  return limpo.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function resumirProviderResponseAdminPedido(providerResponse: unknown) {
  if (!providerResponse || typeof providerResponse !== "object") {
    return "Sem resposta do provedor.";
  }

  const chaves = Object.keys(providerResponse).slice(0, 6);

  if (chaves.length === 0) {
    return "Resposta vazia.";
  }

  return chaves.join(", ");
}

export function serializarProviderResponseAdminPedido(
  providerResponse: unknown,
) {
  if (!providerResponse) {
    return "null";
  }

  return JSON.stringify(providerResponse, null, 2);
}
