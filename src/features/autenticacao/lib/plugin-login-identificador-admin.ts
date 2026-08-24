import "server-only";

import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/connection";
import { userTable } from "@/db/schema";
import { buscarVinculoAdministrativoBasico } from "@/features/autenticacao/queries/autorizacao-admin/buscar-vinculo-administrativo-basico";

import { normalizarWhatsappAdmin } from "./normalizar-whatsapp-admin";

const mensagemCredenciaisInvalidas = "Identificador ou senha inválidos.";

const entradaLoginAdminSchema = z.object({
  identificador: z.string().trim().min(1),
  senha: z.string().min(1),
});

function normalizarEmail(valor: string) {
  const email = valor.trim().toLowerCase();
  return z.email().safeParse(email).success ? email : null;
}

function erroCredenciaisInvalidas() {
  return new APIError("UNAUTHORIZED", {
    message: mensagemCredenciaisInvalidas,
  });
}

export function pluginLoginIdentificadorAdmin() {
  return {
    id: "login-identificador-admin",
    endpoints: {
      entrarAdminComIdentificador: createAuthEndpoint(
        "/login/admin/identificador",
        {
          method: "POST",
          body: entradaLoginAdminSchema,
        },
        async (contexto) => {
          const email = normalizarEmail(contexto.body.identificador);
          const whatsapp = email
            ? null
            : normalizarWhatsappAdmin(contexto.body.identificador);

          const usuario = email
            ? await db.query.userTable.findFirst({
                where: eq(userTable.email, email),
              })
            : whatsapp
              ? await db.query.userTable.findFirst({
                  where: eq(userTable.whatsapp, whatsapp),
                })
              : null;

          const vinculo = usuario
            ? await buscarVinculoAdministrativoBasico(usuario.id)
            : null;
          if (!usuario || vinculo?.status !== "ativo") {
            // Mantém custo semelhante ao caminho válido e reduz enumeração por tempo.
            await contexto.context.password.hash(contexto.body.senha);
            throw erroCredenciaisInvalidas();
          }

          const contas =
            await contexto.context.internalAdapter.findAccountByUserId(
              usuario.id,
            );
          const contaCredencial = contas.find(
            (conta) => conta.providerId === "credential",
          );

          if (!contaCredencial?.password) throw erroCredenciaisInvalidas();

          const senhaValida = await contexto.context.password.verify({
            hash: contaCredencial.password,
            password: contexto.body.senha,
          });

          if (!senhaValida) throw erroCredenciaisInvalidas();

          const sessao = await contexto.context.internalAdapter.createSession(
            usuario.id,
            contexto,
            false,
          );

          if (!sessao) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Não foi possível criar a sessão.",
            });
          }

          await setSessionCookie(contexto, { session: sessao, user: usuario });

          // A resposta não devolve email, telefone, token ou outro dado da conta.
          return contexto.json({ sucesso: true });
        },
      ),
    },
  };
}
