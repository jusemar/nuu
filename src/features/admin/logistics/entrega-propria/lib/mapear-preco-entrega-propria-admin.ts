import type { EntregaPropriaPrecoProduto } from "../queries/admin-entrega-propria.queries";

/** Linha de preço (Produto ou Categoria) já carregada com as relações. */
type PrecoComRelacoes = {
  id: number;
  destinationType: EntregaPropriaPrecoProduto["destinationType"];
  regionId: number | null;
  bairroId: number | null;
  cepEspecificoId: number | null;
  cityId: number | null;
  shippingPrice: number;
  rapidDeliveryActive: boolean;
  deliveryDeadline: string | null;
  scheduledDeliveryActive: boolean;
  scheduledDeliveryMinDays: number | null;
  scheduledDeliveryPrice: number | null;
  isActive: boolean;
  region: { name: string; city: string; state: string } | null;
  bairro: { nome: string; cidade: { name: string; stateUf: string } } | null;
  cepEspecifico: {
    cep: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null;
  cidade: { name: string; stateUf: string } | null;
};

/**
 * Converte uma linha persistida no item exibido no Admin (rótulo do destino,
 * cidade/UF). Usado pelos preços do Produto e da Categoria.
 */
export function mapearPrecoEntregaPropriaAdmin(
  preco: PrecoComRelacoes,
): EntregaPropriaPrecoProduto {
  const tipo = preco.destinationType;
  const cep = preco.cepEspecifico;
  const destinationId =
    tipo === "region"
      ? preco.regionId
      : tipo === "bairro"
        ? preco.bairroId
        : tipo === "cidade"
          ? preco.cityId
          : preco.cepEspecificoId;
  const destinationLabel =
    tipo === "region"
      ? preco.region?.name
      : tipo === "bairro"
        ? preco.bairro?.nome
        : tipo === "cidade"
          ? preco.cidade?.name
          : cep
            ? `${cep.cep.slice(0, 5)}-${cep.cep.slice(5)} - ${cep.neighborhood}`
            : undefined;
  const localidade =
    tipo === "region"
      ? preco.region && { city: preco.region.city, state: preco.region.state }
      : tipo === "bairro"
        ? preco.bairro && {
            city: preco.bairro.cidade.name,
            state: preco.bairro.cidade.stateUf,
          }
        : tipo === "cidade"
          ? preco.cidade && {
              city: preco.cidade.name,
              state: preco.cidade.stateUf,
            }
          : cep && { city: cep.city, state: cep.state };

  return {
    id: preco.id,
    destinationType: tipo,
    destinationId: destinationId ?? 0,
    destinationLabel: destinationLabel || "Destino removido",
    city: localidade?.city ?? "",
    state: localidade?.state ?? "",
    shippingPrice: preco.shippingPrice,
    rapidDeliveryActive: preco.rapidDeliveryActive,
    deliveryDeadline: preco.deliveryDeadline,
    scheduledDeliveryActive: preco.scheduledDeliveryActive,
    scheduledDeliveryMinDays: preco.scheduledDeliveryMinDays,
    scheduledDeliveryPrice: preco.scheduledDeliveryPrice,
    isActive: preco.isActive,
  };
}
