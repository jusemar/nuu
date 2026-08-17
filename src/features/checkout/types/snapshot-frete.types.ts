import type {
  ItemLogistico,
  PacoteEnvio,
} from "@/features/logistica/types/contratos-frete";
import type { OrigemExpedicao } from "@/features/logistica/types/grupos-logisticos";

/** Formato histórico, mantido para leitura dos pedidos anteriores à cotação por grupo. */
export type SnapshotItemFreteCheckoutVersao1 = {
  itemCarrinhoId: string;
  produtoId: string;
  varianteId: string | null;
  provedor: string;
  servico: string;
  modalidade: string;
  valorEmCentavos: number;
  prazo: string | null;
  itensLogisticos: ItemLogistico[];
  pacotes: PacoteEnvio[];
  metadataResumida: Record<string, unknown> | null;
  fallbackAcionado: boolean;
};

export type SnapshotFreteCheckoutVersao1 = {
  versao: "1";
  cep: string;
  valorTotalEmCentavos: number;
  fallbackAcionado: boolean;
  promessaEntregaProgramada?: Record<string, unknown> | null;
  itens: SnapshotItemFreteCheckoutVersao1[];
};

export type SnapshotItemGrupoEntrega = {
  itemCarrinhoId: string;
  produtoId: string;
  varianteId: string | null;
  quantidade: number;
  valorUnitarioEmCentavos: number;
};

export type SnapshotGrupoEntrega = {
  chaveGrupo: string;
  /** Ausente apenas em snapshots v2 históricos criados antes da origem por grupo. */
  cepOrigem?: string;
  origemExpedicao: OrigemExpedicao;
  fornecedorProvedor: string | null;
  necessitaEtiquetaFornecedor: boolean;
  itens: SnapshotItemGrupoEntrega[];
  entrega: {
    identificadorOpcao: string;
    tipo: "entrega" | "retirada";
    provedor: string;
    servicoId: string;
    servicoNome: string;
    transportadora: string | null;
    valorEmCentavos: number;
    prazo: string | null;
    metadadosRelevantes: Record<string, unknown> | null;
  };
};

/** Snapshot definitivo da entrega agrupada, criado exclusivamente após recotação. */
export type SnapshotFreteCheckoutVersao2 = {
  versao: "2";
  cep: string;
  valorTotalEmCentavos: number;
  grupos: SnapshotGrupoEntrega[];
};

export type SnapshotFreteCheckout =
  | SnapshotFreteCheckoutVersao1
  | SnapshotFreteCheckoutVersao2;
