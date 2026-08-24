import "server-only";

import {
  APIError,
  createAuthEndpoint,
  getSessionFromCtx,
} from "better-auth/api";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db/connection";
import { userTable } from "@/db/schema";

import {
  confirmarEmailClienteSchema,
  solicitarConfirmacaoEmailSchema,
} from "../schemas/confirmacao-email-cliente.schema";
import {
  confirmarDesafioEmail,
  criarDesafioConfirmacaoEmail,
  invalidarDesafioConfirmacaoEmail,
} from "./confirmacao-email/servico-confirmacao-email";
import { enviarEmailConfirmacaoCliente } from "./emails/enviar-email-confirmacao-cliente";
import { obterIpRequisicaoOtp } from "./otp-telefone/ip-requisicao-otp";

const LIMITE_SESSAO_RECENTE = 15 * 60 * 1_000;

function exigirSessaoRecente(criadoEm: Date) {
  if (Date.now() - criadoEm.getTime() > LIMITE_SESSAO_RECENTE)
    throw new APIError("FORBIDDEN", {
      message: "REAUTENTICACAO_NECESSARIA",
    });
}

export function pluginConfirmacaoEmailCliente() {
  return {
    id: "confirmacao-email-cliente-nuu",
    endpoints: {
      solicitarConfirmacaoEmailCliente: createAuthEndpoint(
        "/cliente/email/solicitar-confirmacao",
        { method: "POST", body: solicitarConfirmacaoEmailSchema },
        async (contexto) => {
          const sessao = await getSessionFromCtx(contexto);
          if (!sessao) throw new APIError("UNAUTHORIZED");
          exigirSessaoRecente(sessao.session.createdAt);
          const novoEmail = contexto.body.email;
          const conflito = await db.query.userTable.findFirst({
            where: and(
              eq(userTable.email, novoEmail),
              ne(userTable.id, sessao.user.id),
            ),
          });
          if (conflito || sessao.user.email.toLowerCase() === novoEmail)
            throw new APIError("BAD_REQUEST", {
              message: "EMAIL_INDISPONIVEL",
            });

          const resultado = await criarDesafioConfirmacaoEmail({
            usuarioId: sessao.user.id,
            novoEmail,
            ip: obterIpRequisicaoOtp(contexto.request),
          });
          if (resultado.status === "REENVIO")
            throw new APIError("TOO_MANY_REQUESTS", {
              message: "AGUARDE_REENVIO",
            });
          if (resultado.status === "LIMITE")
            throw new APIError("TOO_MANY_REQUESTS", {
              message: "LIMITE_SOLICITACOES",
            });
          if (resultado.status !== "ENVIAR")
            throw new APIError("INTERNAL_SERVER_ERROR");

          const urlBase = process.env.BETTER_AUTH_URL?.trim();
          if (!urlBase) throw new APIError("INTERNAL_SERVER_ERROR");
          const url = new URL("/minha-conta/confirmar-email", urlBase);
          url.searchParams.set("token", resultado.token);
          try {
            await enviarEmailConfirmacaoCliente({
              destinatario: novoEmail,
              urlConfirmacao: url.toString(),
            });
          } catch {
            await invalidarDesafioConfirmacaoEmail(resultado.desafioId);
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "FALHA_TEMPORARIA",
            });
          }
          return contexto.json({ sucesso: true });
        },
      ),

      confirmarEmailCliente: createAuthEndpoint(
        "/cliente/email/confirmar",
        { method: "POST", body: confirmarEmailClienteSchema },
        async (contexto) => {
          const sessao = await getSessionFromCtx(contexto);
          if (!sessao) throw new APIError("UNAUTHORIZED");
          exigirSessaoRecente(sessao.session.createdAt);
          let resultado;
          try {
            resultado = await confirmarDesafioEmail({
              usuarioId: sessao.user.id,
              sessaoId: sessao.session.id,
              token: contexto.body.token,
              ip: obterIpRequisicaoOtp(contexto.request),
            });
          } catch {
            throw new APIError("BAD_REQUEST", {
              message: "EMAIL_INDISPONIVEL",
            });
          }
          if (resultado === "VALIDO") return contexto.json({ sucesso: true });
          if (resultado === "EXPIRADO")
            throw new APIError("BAD_REQUEST", { message: "TOKEN_EXPIRADO" });
          if (resultado === "REUTILIZADO")
            throw new APIError("BAD_REQUEST", { message: "TOKEN_REUTILIZADO" });
          if (resultado === "LIMITE" || resultado === "BLOQUEADO")
            throw new APIError("TOO_MANY_REQUESTS", {
              message: "LIMITE_CONFIRMACOES",
            });
          if (resultado === "CONFLITO")
            throw new APIError("BAD_REQUEST", {
              message: "EMAIL_INDISPONIVEL",
            });
          throw new APIError("BAD_REQUEST", { message: "TOKEN_INVALIDO" });
        },
      ),
    },
  };
}
