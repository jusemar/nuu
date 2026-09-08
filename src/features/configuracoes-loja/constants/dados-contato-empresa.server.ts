import "server-only";

/** Contatos operacionais acessíveis apenas por código executado no servidor. */
export const DADOS_CONTATO_EMPRESA = {
  telefone: {
    exibicao: "(31) 98842-1694",
    e164: "+5531988421694",
    whatsappOperacional: "5531988421694",
  },
  emailAtendimento: "contato@nooo.com.br",
} as const;
