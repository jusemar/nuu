import { listarEntregasAgrupadasDoSnapshot } from "./ler-snapshot-frete";
import type { SnapshotFreteCheckout } from "./revalidar-frete-checkout";

function resumirValorUnico(valores: string[]) {
  const valoresUnicos = [...new Set(valores.filter(Boolean))];

  if (valoresUnicos.length === 0) {
    return null;
  }

  return valoresUnicos.length === 1 ? valoresUnicos[0] : "multiplos";
}

function resumirPrazo(snapshot: SnapshotFreteCheckout) {
  const prazos = listarEntregasAgrupadasDoSnapshot(snapshot)
    .map((item) => item.prazo?.trim())
    .filter((prazo): prazo is string => Boolean(prazo));

  return resumirValorUnico(prazos);
}

export function montarRegistroSnapshotFretePedido<
  TSnapshot extends SnapshotFreteCheckout,
>({
  pedidoId,
  snapshot,
}: {
  pedidoId: string;
  snapshot: TSnapshot;
}) {
  const entregas = listarEntregasAgrupadasDoSnapshot(snapshot);

  return {
    pedidoId,
    provedorFrete: resumirValorUnico(
      entregas.map((item) => item.provedor),
    ),
    modalidadeFrete: resumirValorUnico(
      entregas.map((item) => item.modalidade),
    ),
    valorFreteEmCentavos: snapshot.valorTotalEmCentavos,
    prazoFrete: resumirPrazo(snapshot),
    cepFrete: snapshot.cep,
    fallbackFreteUtilizado:
      snapshot.versao === "1" ? snapshot.fallbackAcionado : false,
    snapshotFrete: snapshot,
    metadata: {
      origem: "checkout",
      snapshotFreteVersao: snapshot.versao,
    },
  };
}
