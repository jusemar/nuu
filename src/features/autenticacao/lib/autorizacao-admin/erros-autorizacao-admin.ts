export const CODIGOS_ERRO_AUTORIZACAO_ADMIN = [
  "NAO_AUTENTICADO",
  "SESSAO_INDISPONIVEL",
  "SEM_VINCULO_ADMINISTRATIVO",
  "ADMINISTRADOR_DESATIVADO",
  "SEM_PERMISSAO",
] as const;

export type CodigoErroAutorizacaoAdmin =
  (typeof CODIGOS_ERRO_AUTORIZACAO_ADMIN)[number];

/** Erro seguro e reutilizável por Components, Actions e Route Handlers. */
export class ErroAutorizacaoAdmin extends Error {
  constructor(readonly codigo: CodigoErroAutorizacaoAdmin) {
    super(
      codigo === "NAO_AUTENTICADO"
        ? "Autenticação administrativa necessária."
        : codigo === "SESSAO_INDISPONIVEL"
          ? "Não foi possível validar a sessão administrativa."
          : "Acesso administrativo não autorizado.",
    );
    this.name = "ErroAutorizacaoAdmin";
  }
}
