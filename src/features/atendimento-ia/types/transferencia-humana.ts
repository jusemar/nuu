import type { ResumoTransferencia } from "../schemas/transferencia-humana.schema";
import type { IdentidadeEntradaAtendimento } from "./entrada-mensagem";

export type MotivoTransferenciaHumana = ResumoTransferencia["motivo"];
export type EstadoTransferenciaWhatsapp =
  | "oferecido" | "recusado" | "resumo_preparado" | "aguardando_confirmacao"
  | "confirmado" | "cancelado" | "link_gerado" | "whatsapp_aberto"
  | "falha_ao_gerar_link" | "expirado";

export type TransferenciaWhatsapp = {
  confirmadoEm: Date | null;
  conversaId: string;
  execucaoId: string | null;
  expiraEm: Date | null;
  hashResumo: string | null;
  id: string;
  motivo: MotivoTransferenciaHumana;
  ofertaConfirmadaEm: Date | null;
  referenciaDestinatarioHash: string | null;
  referenciaConfirmacaoId: string | null;
  referenciaSessaoHash: string;
  resumo: ResumoTransferencia | null;
  status: EstadoTransferenciaWhatsapp;
  usuarioId: string | null;
};

export interface RepositorioTransferenciaHumana {
  buscar(id: string, identidade: IdentidadeEntradaAtendimento): Promise<TransferenciaWhatsapp | null>;
  criarOferta(dados: {
    chaveIdempotencia: string;
    conversaId: string;
    execucaoId: string;
    identidade: IdentidadeEntradaAtendimento;
    mensagemId: string | null;
    motivo: MotivoTransferenciaHumana;
    referenciaSessaoHash: string;
  }): Promise<TransferenciaWhatsapp>;
  prepararResumo(dados: { expiraEm: Date; hashResumo: string; id: string; resumo: ResumoTransferencia }): Promise<boolean>;
  registrarAceiteOferta(dados: { id: string; instante: Date }): Promise<boolean>;
  transicionar(dados: { de: EstadoTransferenciaWhatsapp[]; id: string; para: EstadoTransferenciaWhatsapp; instante?: Date }): Promise<boolean>;
  atualizarDestinatario(dados: { id: string; referenciaDestinatarioHash: string }): Promise<boolean>;
  registrarReferenciaConfirmacao(dados: { id: string; referenciaConfirmacaoId: string }): Promise<boolean>;
  registrarConfirmacao(dados: { confirmadoEm: Date; id: string; referenciaConfirmacaoId: string }): Promise<boolean>;
  auditar(evento: string, dados: Record<string, unknown>): Promise<void>;
}
