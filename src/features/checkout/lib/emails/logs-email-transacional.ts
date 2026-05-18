import "server-only";

type ContextoLogEmailTransacional = {
  tipo: string;
  numeroPedido?: string;
  destinatario: string;
  remetente: string;
};

type ResultadoResendEmail = {
  data?: {
    id?: string | null;
  } | null;
  error?: {
    name?: string;
    message?: string;
    statusCode?: number;
  } | null;
};

function obterDominioEmail(email: string) {
  const emailLimpo = email.includes("<")
    ? email.match(/<([^>]+)>/)?.[1]
    : email;

  return emailLimpo?.split("@").at(-1)?.trim().toLowerCase() ?? "desconhecido";
}

export function montarContextoLogEmailTransacional(
  contexto: ContextoLogEmailTransacional,
) {
  return {
    tipo: contexto.tipo,
    numeroPedido: contexto.numeroPedido,
    destinatario: contexto.destinatario,
    dominioDestinatario: obterDominioEmail(contexto.destinatario),
    remetente: contexto.remetente,
    dominioRemetente: obterDominioEmail(contexto.remetente),
  };
}

export function extrairErroResendEmail(resultado: unknown) {
  const resposta = resultado as ResultadoResendEmail | null;

  return resposta?.error ?? null;
}

export function extrairMessageIdResendEmail(resultado: unknown) {
  const resposta = resultado as ResultadoResendEmail | null;

  return resposta?.data?.id ?? null;
}
