import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db/connection";
import * as schema from "@/db/schema";

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
  emailAndPassword: {
    enabled: false,
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
