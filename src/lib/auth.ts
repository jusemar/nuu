import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db/connection";
import * as schema from "@/db/schema";
import { enviarEmailRedefinicaoSenhaAdmin } from "@/features/autenticacao/lib/emails/enviar-email-redefinicao-senha-admin";
import { emailPossuiPermissaoAdmin } from "@/features/autenticacao/lib/permissoes-admin";

function lerVariavelAmbienteObrigatoria(nome: string) {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`${nome} não configurada.`);
  }

  return valor;
}

const urlBaseAutenticacao = lerVariavelAmbienteObrigatoria("BETTER_AUTH_URL");

export const auth = betterAuth({
  baseURL: urlBaseAutenticacao,
  trustedOrigins: [urlBaseAutenticacao],
  logger: {
    log(nivel, mensagem) {
      // Argumentos extras do Better Auth podem conter email, token ou sessão.
      const contexto = `[better-auth:${nivel}]`;

      if (nivel === "error") console.error(contexto, mensagem);
      else if (nivel === "warn") console.warn(contexto, mensagem);
      else console.info(contexto, mensagem);
    },
  },
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Mantém a resposta neutra do Better Auth, mas envia somente para admins.
      if (!emailPossuiPermissaoAdmin(user.email)) return;

      await enviarEmailRedefinicaoSenhaAdmin({
        destinatario: user.email,
        urlRedefinicao: url,
      });
    },
  },
  rateLimit: {
    enabled: true,
    customRules: {
      "/request-password-reset": {
        window: 15 * 60,
        max: 3,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: lerVariavelAmbienteObrigatoria("GOOGLE_CLIENT_ID"),
      clientSecret: lerVariavelAmbienteObrigatoria("GOOGLE_CLIENT_SECRET"),
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  user: {
    modelName: "userTable",
  },
  session: {
    modelName: "sessionTable",
  },
  account: {
    modelName: "accountTable",
  },
  verification: {
    modelName: "verificationTable",
  },
});
