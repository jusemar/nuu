import type { MensagemSanitizadaDto } from "../../../types/admin/consultas";
import { mascararDadosPessoaisAdmin } from "./mascarar-dados-pessoais-admin";

export function sanitizarMensagemAdmin(mensagem: {
  autor: string;
  conteudo: string;
  criadoEm: Date;
  id: string;
  status: string;
}): MensagemSanitizadaDto {
  return {
    autor: mensagem.autor,
    conteudo: mascararDadosPessoaisAdmin(mensagem.conteudo),
    criadoEm: mensagem.criadoEm.toISOString(),
    referencia: mensagem.id,
    status: mensagem.status,
  };
}
