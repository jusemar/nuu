import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { phoneNumber } from "better-auth/plugins";

import { db } from "@/db/connection";
import * as schema from "@/db/schema";
import { classificarRecuperacaoEmail } from "@/features/autenticacao/lib/classificar-recuperacao-email";
import { emailEhTecnicoTelefone } from "@/features/autenticacao/lib/email-tecnico-telefone";
import { enviarEmailRedefinicaoSenhaAdmin } from "@/features/autenticacao/lib/emails/enviar-email-redefinicao-senha-admin";
import { enviarEmailRedefinicaoSenhaCliente } from "@/features/autenticacao/lib/emails/enviar-email-redefinicao-senha-cliente";
import { emailPossuiPermissaoAdmin } from "@/features/autenticacao/lib/permissoes-admin";
import { pluginConfirmacaoEmailCliente } from "@/features/autenticacao/lib/plugin-confirmacao-email-cliente";
import { pluginFluxosTelefoneNuu } from "@/features/autenticacao/lib/plugin-fluxos-telefone-nuu";
import { pluginLoginIdentificadorAdmin } from "@/features/autenticacao/lib/plugin-login-identificador-admin";
import { comunicacaoWhatsapp } from "@/features/comunicacao/whatsapp";

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
  hooks: {
    before: async (contexto) => {
      const caminho = contexto.request
        ? new URL(contexto.request.url).pathname
        : "";
      const corpo = contexto.body as { email?: unknown } | undefined;
      if (
        caminho.endsWith("/sign-in/email") &&
        typeof corpo?.email === "string" &&
        emailEhTecnicoTelefone(corpo.email)
      ) {
        throw new APIError("UNAUTHORIZED", {
          message: "E-mail, WhatsApp ou senha inválidos.",
        });
      }
    },
  },
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
      const administrador = emailPossuiPermissaoAdmin(user.email);
      const publico = classificarRecuperacaoEmail({
        urlRedefinicao: url,
        origemPermitida: urlBaseAutenticacao,
        administrador,
        emailTecnico: emailEhTecnicoTelefone(user.email),
      });

      // Cada público recebe somente seu próprio template e rota de retorno.
      if (publico === "admin") {
        await enviarEmailRedefinicaoSenhaAdmin({
          destinatario: user.email,
          urlRedefinicao: url,
        });
        return;
      }
      if (publico === "cliente") {
        await enviarEmailRedefinicaoSenhaCliente({
          destinatario: user.email,
          urlRedefinicao: url,
        });
      }
    },
  },
  rateLimit: {
    enabled: true,
    customRules: {
      "/login/admin/identificador": {
        window: 15 * 60,
        max: 5,
      },
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
    additionalFields: {
      whatsapp: {
        type: "string",
        required: false,
        input: false,
        unique: true,
      },
    },
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
  // Os endpoints OTP nativos de 1.3.34 persistem código recuperável em
  // verification.value. Permanecem bloqueados; os fluxos Nuu usam HMAC e
  // consumo transacional nas rotas /telefone/*.
  disabledPaths: [
    "/sign-in/phone-number",
    "/phone-number/send-otp",
    "/phone-number/verify",
    "/phone-number/forget-password",
    "/phone-number/request-password-reset",
    "/phone-number/reset-password",
  ],
  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 3,
      requireVerification: true,
      phoneNumberValidator: (numero) => {
        try {
          comunicacaoWhatsapp.normalizarNumero(numero);
          return true;
        } catch {
          return false;
        }
      },
      sendOTP: async ({ phoneNumber: numero, code: codigo }) => {
        await comunicacaoWhatsapp.enviarOtp({
          numero,
          codigo,
          finalidade: "verificacao",
          identificadorOperacao: crypto.randomUUID(),
        });
      },
      sendPasswordResetOTP: async ({ phoneNumber: numero, code: codigo }) => {
        await comunicacaoWhatsapp.enviarOtp({
          numero,
          codigo,
          finalidade: "recuperacao",
          identificadorOperacao: crypto.randomUUID(),
        });
      },
    }),
    pluginFluxosTelefoneNuu(),
    pluginConfirmacaoEmailCliente(),
    pluginLoginIdentificadorAdmin(),
  ],
});
