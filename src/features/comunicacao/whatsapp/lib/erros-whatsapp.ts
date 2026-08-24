export type CodigoErroWhatsapp =
  | "CONFIGURACAO_AUSENTE"
  | "ENTRADA_INVALIDA"
  | "RESPOSTA_INVALIDA"
  | "META_HTTP"
  | "TIMEOUT"
  | "TRANSPORTE";

/**
 * Erro público deliberadamente pequeno: não transporta token, OTP, telefone
 * completo, payload enviado nem resposta bruta da Meta.
 */
export class ErroComunicacaoWhatsapp extends Error {
  readonly codigo: CodigoErroWhatsapp;
  readonly statusHttp?: number;

  constructor(
    codigo: CodigoErroWhatsapp,
    mensagem: string,
    opcoes?: { statusHttp?: number; causa?: unknown },
  ) {
    super(mensagem, { cause: opcoes?.causa });
    this.name = "ErroComunicacaoWhatsapp";
    this.codigo = codigo;
    this.statusHttp = opcoes?.statusHttp;
  }
}
