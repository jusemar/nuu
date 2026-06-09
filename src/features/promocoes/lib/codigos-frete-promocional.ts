import type { ItemCarrinho } from "@/features/carrinho";
import type { SnapshotFreteCheckout } from "@/features/checkout/lib/frete/revalidar-frete-checkout";

function normalizarParteCodigoFrete(valor?: string | null) {
  return (
    valor
      ?.trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || null
  );
}

export function montarCodigoTransportadoraPromocional({
  provedor,
  transportadora,
}: {
  provedor?: string | null;
  transportadora?: string | null;
}) {
  const provedorNormalizado = normalizarParteCodigoFrete(provedor);
  const transportadoraNormalizada = normalizarParteCodigoFrete(transportadora);

  if (!provedorNormalizado || !transportadoraNormalizada) return null;

  return `transportadora:${provedorNormalizado}:${transportadoraNormalizada}`;
}

export function montarCodigoServicoPromocional({
  provedor,
  servico,
}: {
  provedor?: string | null;
  servico?: string | null;
}) {
  const provedorNormalizado = normalizarParteCodigoFrete(provedor);
  const servicoNormalizado = normalizarParteCodigoFrete(servico);

  if (!provedorNormalizado || !servicoNormalizado) return null;

  return `servico:${provedorNormalizado}:${servicoNormalizado}`;
}

export function extrairCodigosFretePromocionalDeItens(itens: ItemCarrinho[]) {
  const codigos = new Set<string>();

  for (const item of itens) {
    const codigoTransportadora = montarCodigoTransportadoraPromocional({
      provedor: item.freteEscolhido?.id,
      transportadora: item.freteEscolhido?.transportadora,
    });
    const codigoServico = montarCodigoServicoPromocional({
      provedor: item.freteEscolhido?.id,
      servico: item.freteEscolhido?.servico,
    });

    if (codigoTransportadora) codigos.add(codigoTransportadora);
    if (codigoServico) codigos.add(codigoServico);
  }

  return Array.from(codigos);
}

export function extrairCodigosFretePromocionalDeSnapshot(
  snapshot?: SnapshotFreteCheckout | null,
) {
  const codigos = new Set<string>();

  for (const item of snapshot?.itens ?? []) {
    const transportadora =
      typeof item.metadataResumida?.transportadora === "string"
        ? item.metadataResumida.transportadora
        : null;
    const codigoTransportadora = montarCodigoTransportadoraPromocional({
      provedor: item.provedor,
      transportadora,
    });
    const codigoServico = montarCodigoServicoPromocional({
      provedor: item.provedor,
      servico: item.servico,
    });

    if (codigoTransportadora) codigos.add(codigoTransportadora);
    if (codigoServico) codigos.add(codigoServico);
  }

  return Array.from(codigos);
}
