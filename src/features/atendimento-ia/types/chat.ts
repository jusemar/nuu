import type { ResumoTransferencia } from "../schemas/transferencia-humana.schema";
import type { EstadoTransferenciaWhatsapp } from "./transferencia-humana";

export type MensagemChatAtendimento = {
  autor: "cliente" | "assistente_ia";
  conteudo: string;
  id: string;
};

export type TransferenciaChatAtendimento = {
  explicacao: string;
  id: string;
  link: string | null;
  resumo: ResumoTransferencia | null;
  status: EstadoTransferenciaWhatsapp;
};

export type RespostaChatAtendimento = {
  conversaId: string;
  mensagemClienteId: string;
  mensagem: MensagemChatAtendimento;
  transferencia: TransferenciaChatAtendimento | null;
};

export type HistoricoChatAtendimento = {
  conversaId: string;
  mensagens: MensagemChatAtendimento[];
};
