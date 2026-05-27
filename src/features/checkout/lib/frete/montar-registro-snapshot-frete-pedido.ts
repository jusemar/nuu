import type { SnapshotFreteCheckout } from "./revalidar-frete-checkout";

function resumirValorUnico(valores: string[]) {
  const valoresUnicos = [...new Set(valores.filter(Boolean))];

  if (valoresUnicos.length === 0) {
    return null;
  }

  return valoresUnicos.length === 1 ? valoresUnicos[0] : "multiplos";
}

function resumirPrazo(snapshot: SnapshotFreteCheckout) {
  const prazos = snapshot.itens
    .map((item) => item.prazo?.trim())
    .filter((prazo): prazo is string => Boolean(prazo));

  return resumirValorUnico(prazos);
}

export function montarRegistroSnapshotFretePedido({
  pedidoId,
  snapshot,
}: {
  pedidoId: string;
  snapshot: SnapshotFreteCheckout;
}) {
  return {
    pedidoId,
    provedorFrete: resumirValorUnico(
      snapshot.itens.map((item) => item.provedor),
    ),
    modalidadeFrete: resumirValorUnico(
      snapshot.itens.map((item) => item.modalidade),
    ),
    valorFreteEmCentavos: snapshot.valorTotalEmCentavos,
    prazoFrete: resumirPrazo(snapshot),
    cepFrete: snapshot.cep,
    fallbackFreteUtilizado: snapshot.fallbackAcionado,
    snapshotFrete: snapshot,
    metadata: {
      origem: "checkout",
      snapshotFreteVersao: snapshot.versao,
    },
  };
}
