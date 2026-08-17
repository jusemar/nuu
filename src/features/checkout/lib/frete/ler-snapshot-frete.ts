import type { SnapshotFreteCheckout } from "../../types/snapshot-frete.types";

export type EntregaLidaDoSnapshot = {
  itemCarrinhoId: string;
  produtoId: string;
  varianteId: string | null;
  provedor: string;
  servico: string;
  modalidade: string;
  valorEmCentavos: number;
  prazo: string | null;
  transportadora: string | null;
};

export function listarEntregasDoSnapshot(
  snapshot: SnapshotFreteCheckout,
): EntregaLidaDoSnapshot[] {
  if (snapshot.versao === "1") {
    return snapshot.itens.map((item) => ({
      itemCarrinhoId: item.itemCarrinhoId,
      produtoId: item.produtoId,
      varianteId: item.varianteId,
      provedor: item.provedor,
      servico: item.servico,
      modalidade: item.modalidade,
      valorEmCentavos: item.valorEmCentavos,
      prazo: item.prazo,
      transportadora:
        typeof item.metadataResumida?.transportadora === "string"
          ? item.metadataResumida.transportadora
          : null,
    }));
  }

  return snapshot.grupos.flatMap((grupo) =>
    grupo.itens.map((item) => ({
      itemCarrinhoId: item.itemCarrinhoId,
      produtoId: item.produtoId,
      varianteId: item.varianteId,
      provedor: grupo.entrega.provedor,
      servico: grupo.entrega.servicoId,
      modalidade: grupo.entrega.tipo,
      valorEmCentavos: grupo.entrega.valorEmCentavos,
      prazo: grupo.entrega.prazo,
      transportadora: grupo.entrega.transportadora,
    })),
  );
}

export function listarEntregasAgrupadasDoSnapshot(
  snapshot: SnapshotFreteCheckout,
) {
  if (snapshot.versao === "1") return listarEntregasDoSnapshot(snapshot);

  return snapshot.grupos.map((grupo) => ({
    itemCarrinhoId: grupo.itens[0]?.itemCarrinhoId ?? "",
    produtoId: grupo.itens[0]?.produtoId ?? "",
    varianteId: grupo.itens[0]?.varianteId ?? null,
    provedor: grupo.entrega.provedor,
    servico: grupo.entrega.servicoId,
    modalidade: grupo.entrega.tipo,
    valorEmCentavos: grupo.entrega.valorEmCentavos,
    prazo: grupo.entrega.prazo,
    transportadora: grupo.entrega.transportadora,
  }));
}
