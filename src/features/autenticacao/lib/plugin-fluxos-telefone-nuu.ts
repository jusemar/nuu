import "server-only";

import { randomUUID } from "node:crypto";

import {
  APIError,
  createAuthEndpoint,
  getSessionFromCtx,
} from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db/connection";
import { accountTable, sessionTable, userTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { comunicacaoWhatsapp } from "@/features/comunicacao/whatsapp";

import {
  codigoOtpSchema,
  concluirCadastroTelefoneSchema,
  confirmarTelefoneSchema,
  loginTelefoneSchema,
  reautenticarSenhaSchema,
  redefinirSenhaTelefoneSchema,
  telefoneSchema,
} from "../schemas/fluxos-telefone.schema";
import type { FinalidadeOtpTelefone } from "../types/otp-telefone.types";
import { criarEmailTecnicoTelefone } from "./email-tecnico-telefone";
import { criarHashIdentificador } from "./otp-telefone/criptografia-otp-telefone";
import { obterIpRequisicaoOtp } from "./otp-telefone/ip-requisicao-otp";
import { repositorioOtpTelefoneDrizzle } from "./otp-telefone/repositorio-otp-telefone-drizzle";
import { criarServicoOtpTelefone } from "./otp-telefone/servico-otp-telefone";
import { autenticarTelefoneSenha } from "./telefone/autenticar-telefone-senha";
import { telefoneDisponivelParaVinculo } from "./telefone/avaliar-vinculo-telefone";
import { usuarioElegivelRecuperacaoTelefone } from "./telefone/usuario-elegivel-recuperacao-telefone";

const mensagemNeutra =
  "Se os dados forem elegíveis, a operação será processada.";
const mensagemCredenciaisInvalidas = "Telefone ou senha inválidos.";

function obterServico() {
  const segredo = process.env.BETTER_AUTH_SECRET?.trim();
  if (!segredo) throw new Error("BETTER_AUTH_SECRET não configurada.");

  return criarServicoOtpTelefone({
    repositorio: repositorioOtpTelefoneDrizzle,
    segredo,
    enviar: async (entrada) => {
      await comunicacaoWhatsapp.enviarOtp(entrada);
    },
  });
}

async function buscarUsuarioVerificado(phoneNumber: string) {
  return db.query.userTable.findFirst({
    where: and(
      eq(userTable.phoneNumber, phoneNumber),
      eq(userTable.phoneNumberVerified, true),
    ),
  });
}

async function buscarUsuarioPorTelefone(phoneNumber: string) {
  return db.query.userTable.findFirst({
    where: eq(userTable.phoneNumber, phoneNumber),
  });
}

function normalizarOuErro(phoneNumber: string) {
  try {
    return comunicacaoWhatsapp.normalizarNumero(phoneNumber);
  } catch {
    throw new APIError("BAD_REQUEST", { message: mensagemNeutra });
  }
}

async function solicitarOtp(
  phoneNumber: string,
  finalidade: FinalidadeOtpTelefone,
  requisicao?: Request,
) {
  await obterServico().emitir({
    telefone: phoneNumber,
    finalidade,
    ip: obterIpRequisicaoOtp(requisicao),
  });
}

async function renovarSessao(
  contexto: Parameters<typeof getSessionFromCtx>[0],
  sessao: NonNullable<Awaited<ReturnType<typeof getSessionFromCtx>>>,
) {
  const novaSessao = await contexto.context.internalAdapter.createSession(
    sessao.user.id,
    contexto,
    false,
  );
  if (!novaSessao) throw new APIError("INTERNAL_SERVER_ERROR");
  await setSessionCookie(contexto, { session: novaSessao, user: sessao.user });
  await contexto.context.internalAdapter.deleteSession(sessao.session.token);
}

export function pluginFluxosTelefoneNuu() {
  return {
    id: "fluxos-telefone-nuu",
    endpoints: {
      solicitarCadastroTelefoneNuu: createAuthEndpoint(
        "/telefone/cadastro/solicitar",
        { method: "POST", body: telefoneSchema },
        async (contexto) => {
          const phoneNumber = normalizarOuErro(contexto.body.phoneNumber);
          const existente = await db.query.userTable.findFirst({
            where: eq(userTable.phoneNumber, phoneNumber),
          });
          if (!existente)
            await solicitarOtp(phoneNumber, "cadastro", contexto.request);
          return contexto.json({ mensagem: mensagemNeutra });
        },
      ),

      concluirCadastroTelefoneNuu: createAuthEndpoint(
        "/telefone/cadastro/concluir",
        { method: "POST", body: concluirCadastroTelefoneSchema },
        async (contexto) => {
          const phoneNumber = normalizarOuErro(contexto.body.phoneNumber);
          const existente = await db.query.userTable.findFirst({
            where: eq(userTable.phoneNumber, phoneNumber),
          });
          if (existente)
            throw new APIError("BAD_REQUEST", { message: mensagemNeutra });

          const resultado = await obterServico().confirmar({
            telefone: phoneNumber,
            codigo: contexto.body.code,
            finalidade: "cadastro",
            ip: obterIpRequisicaoOtp(contexto.request),
          });
          if (resultado !== "VALIDO")
            throw new APIError("BAD_REQUEST", { message: mensagemNeutra });

          const segredo = process.env.BETTER_AUTH_SECRET!;
          const userId = randomUUID();
          const agora = new Date();
          const email = criarEmailTecnicoTelefone(phoneNumber, segredo);
          const senhaHash = await contexto.context.password.hash(
            contexto.body.password,
          );

          try {
            await dbTransacional.transaction(async (tx) => {
              await tx.insert(userTable).values({
                id: userId,
                name: contexto.body.name.trim(),
                email,
                emailVerified: false,
                phoneNumber,
                phoneNumberVerified: true,
                createdAt: agora,
                updatedAt: agora,
              });
              await tx.insert(accountTable).values({
                id: randomUUID(),
                accountId: userId,
                providerId: "credential",
                userId,
                password: senhaHash,
                createdAt: agora,
                updatedAt: agora,
              });
            });
          } catch {
            throw new APIError("BAD_REQUEST", { message: mensagemNeutra });
          }

          const usuario = await db.query.userTable.findFirst({
            where: eq(userTable.id, userId),
          });
          if (!usuario) throw new APIError("INTERNAL_SERVER_ERROR");
          const sessao = await contexto.context.internalAdapter.createSession(
            userId,
            contexto,
            false,
          );
          if (!sessao) throw new APIError("INTERNAL_SERVER_ERROR");
          await setSessionCookie(contexto, { session: sessao, user: usuario });
          return contexto.json({ sucesso: true });
        },
      ),

      entrarComTelefoneNuu: createAuthEndpoint(
        "/telefone/entrar",
        { method: "POST", body: loginTelefoneSchema },
        async (contexto) => {
          const phoneNumber = normalizarOuErro(contexto.body.phoneNumber);
          const usuario = await buscarUsuarioVerificado(phoneNumber);
          const contas = usuario
            ? await contexto.context.internalAdapter.findAccountByUserId(
                usuario.id,
              )
            : [];
          const conta = contas.find((item) => item.providerId === "credential");

          const usuarioId = await autenticarTelefoneSenha({
            usuario: usuario
              ? {
                  id: usuario.id,
                  phoneNumberVerified: usuario.phoneNumberVerified,
                  senhaHash: conta?.password ?? null,
                }
              : null,
            senha: contexto.body.password,
            verificarSenha: (senha, hash) =>
              contexto.context.password.verify({ hash, password: senha }),
            executarCustoNeutro: async (senha) => {
              await contexto.context.password.hash(senha);
            },
          });
          if (!usuario || !usuarioId)
            throw new APIError("UNAUTHORIZED", {
              message: mensagemCredenciaisInvalidas,
            });

          const sessao = await contexto.context.internalAdapter.createSession(
            usuario.id,
            contexto,
            contexto.body.rememberMe === false,
          );
          if (!sessao) throw new APIError("INTERNAL_SERVER_ERROR");
          await setSessionCookie(contexto, { session: sessao, user: usuario });
          return contexto.json({ sucesso: true });
        },
      ),

      solicitarVinculoTelefoneNuu: createAuthEndpoint(
        "/telefone/vinculo/solicitar",
        { method: "POST", body: telefoneSchema },
        async (contexto) => {
          const sessao = await getSessionFromCtx(contexto);
          if (!sessao) throw new APIError("UNAUTHORIZED");
          const phoneNumber = normalizarOuErro(contexto.body.phoneNumber);
          const proprietario = await db.query.userTable.findFirst({
            where: eq(userTable.phoneNumber, phoneNumber),
          });
          if (
            telefoneDisponivelParaVinculo({
              usuarioId: sessao.user.id,
              proprietario,
            })
          )
            await solicitarOtp(
              phoneNumber,
              "alteracao_numero",
              contexto.request,
            );
          return contexto.json({ mensagem: mensagemNeutra });
        },
      ),

      reautenticarSenhaVinculoTelefoneNuu: createAuthEndpoint(
        "/telefone/vinculo/reautenticar-senha",
        { method: "POST", body: reautenticarSenhaSchema },
        async (contexto) => {
          const sessao = await getSessionFromCtx(contexto);
          if (!sessao) throw new APIError("UNAUTHORIZED");
          const conta = await db.query.accountTable.findFirst({
            where: and(
              eq(accountTable.userId, sessao.user.id),
              eq(accountTable.providerId, "credential"),
            ),
          });
          const senhaValida = conta?.password
            ? await contexto.context.password.verify({
                hash: conta.password,
                password: contexto.body.password,
              })
            : false;
          if (!senhaValida) {
            // Mantém custo de hash para reduzir diferenças observáveis.
            if (!conta?.password)
              await contexto.context.password.hash(contexto.body.password);
            throw new APIError("UNAUTHORIZED", {
              message: "REAUTENTICACAO_INVALIDA",
            });
          }

          await renovarSessao(contexto, sessao);
          return contexto.json({ sucesso: true });
        },
      ),

      solicitarReautenticacaoWhatsappCliente: createAuthEndpoint(
        "/cliente/reautenticar-whatsapp/solicitar",
        { method: "POST" },
        async (contexto) => {
          const sessao = await getSessionFromCtx(contexto);
          if (!sessao) throw new APIError("UNAUTHORIZED");
          const usuario = await db.query.userTable.findFirst({
            where: and(
              eq(userTable.id, sessao.user.id),
              eq(userTable.phoneNumberVerified, true),
            ),
          });
          if (!usuario?.phoneNumber)
            throw new APIError("BAD_REQUEST", {
              message: "METODO_INDISPONIVEL",
            });
          await solicitarOtp(
            usuario.phoneNumber,
            "verificacao",
            contexto.request,
          );
          return contexto.json({ sucesso: true });
        },
      ),

      confirmarReautenticacaoWhatsappCliente: createAuthEndpoint(
        "/cliente/reautenticar-whatsapp/confirmar",
        { method: "POST", body: codigoOtpSchema },
        async (contexto) => {
          const sessao = await getSessionFromCtx(contexto);
          if (!sessao) throw new APIError("UNAUTHORIZED");
          const usuario = await db.query.userTable.findFirst({
            where: and(
              eq(userTable.id, sessao.user.id),
              eq(userTable.phoneNumberVerified, true),
            ),
          });
          if (!usuario?.phoneNumber)
            throw new APIError("BAD_REQUEST", {
              message: "METODO_INDISPONIVEL",
            });
          const resultado = await obterServico().confirmar({
            telefone: usuario.phoneNumber,
            codigo: contexto.body.code,
            finalidade: "verificacao",
            ip: obterIpRequisicaoOtp(contexto.request),
          });
          if (resultado !== "VALIDO")
            throw new APIError("BAD_REQUEST", {
              message: "REAUTENTICACAO_INVALIDA",
            });
          await renovarSessao(contexto, sessao);
          return contexto.json({ sucesso: true });
        },
      ),

      confirmarVinculoTelefoneNuu: createAuthEndpoint(
        "/telefone/vinculo/confirmar",
        { method: "POST", body: confirmarTelefoneSchema },
        async (contexto) => {
          const sessao = await getSessionFromCtx(contexto);
          if (!sessao) throw new APIError("UNAUTHORIZED");
          // Reautenticação recente: sessão criada nos últimos 15 minutos.
          if (Date.now() - sessao.session.createdAt.getTime() > 15 * 60 * 1_000)
            throw new APIError("FORBIDDEN", {
              message: "REAUTENTICACAO_NECESSARIA",
            });
          const phoneNumber = normalizarOuErro(contexto.body.phoneNumber);
          const resultado = await obterServico().confirmar({
            telefone: phoneNumber,
            codigo: contexto.body.code,
            finalidade: "alteracao_numero",
            ip: obterIpRequisicaoOtp(contexto.request),
          });
          if (resultado !== "VALIDO")
            throw new APIError("BAD_REQUEST", { message: mensagemNeutra });

          try {
            await db
              .update(userTable)
              .set({
                phoneNumber,
                phoneNumberVerified: true,
                updatedAt: new Date(),
              })
              .where(eq(userTable.id, sessao.user.id));
          } catch {
            throw new APIError("BAD_REQUEST", { message: mensagemNeutra });
          }
          await repositorioOtpTelefoneDrizzle.invalidar(
            criarHashIdentificador(
              phoneNumber,
              process.env.BETTER_AUTH_SECRET!,
            ),
            "alteracao_numero",
          );
          // Auditoria deliberadamente não contém telefone, OTP ou sessão.
          console.info("[autenticacao:cliente:whatsapp-alterado]", {
            usuarioId: sessao.user.id,
          });
          await db
            .delete(sessionTable)
            .where(
              and(
                eq(sessionTable.userId, sessao.user.id),
                ne(sessionTable.id, sessao.session.id),
              ),
            );
          return contexto.json({ sucesso: true });
        },
      ),

      solicitarRecuperacaoTelefoneNuu: createAuthEndpoint(
        "/telefone/recuperacao/solicitar",
        { method: "POST", body: telefoneSchema },
        async (contexto) => {
          const phoneNumber = normalizarOuErro(contexto.body.phoneNumber);
          const usuario = await buscarUsuarioPorTelefone(phoneNumber);
          if (usuarioElegivelRecuperacaoTelefone(usuario))
            await solicitarOtp(phoneNumber, "recuperacao", contexto.request);
          return contexto.json({ mensagem: mensagemNeutra });
        },
      ),

      redefinirSenhaTelefoneNuu: createAuthEndpoint(
        "/telefone/recuperacao/redefinir",
        { method: "POST", body: redefinirSenhaTelefoneSchema },
        async (contexto) => {
          const phoneNumber = normalizarOuErro(contexto.body.phoneNumber);
          const resultado = await obterServico().confirmar({
            telefone: phoneNumber,
            codigo: contexto.body.code,
            finalidade: "recuperacao",
            ip: obterIpRequisicaoOtp(contexto.request),
          });
          if (resultado === "INVALIDO")
            throw new APIError("BAD_REQUEST", {
              message: "CODIGO_INCORRETO",
            });
          if (resultado === "EXPIRADO")
            throw new APIError("BAD_REQUEST", {
              message: "CODIGO_EXPIRADO",
            });
          if (resultado === "BLOQUEADO")
            throw new APIError("TOO_MANY_REQUESTS", {
              message: "TENTATIVAS_ESGOTADAS",
            });
          const usuario =
            resultado === "VALIDO"
              ? await buscarUsuarioPorTelefone(phoneNumber)
              : null;
          if (!usuario)
            throw new APIError("BAD_REQUEST", { message: mensagemNeutra });
          const hashSenha = await contexto.context.password.hash(
            contexto.body.newPassword,
          );
          const conta = await db.query.accountTable.findFirst({
            where: and(
              eq(accountTable.userId, usuario.id),
              eq(accountTable.providerId, "credential"),
            ),
          });
          if (!conta)
            throw new APIError("BAD_REQUEST", { message: mensagemNeutra });
          await contexto.context.internalAdapter.updatePassword(
            usuario.id,
            hashSenha,
            contexto,
          );
          await db
            .update(userTable)
            .set({ phoneNumberVerified: true, updatedAt: new Date() })
            .where(
              and(
                eq(userTable.id, usuario.id),
                eq(userTable.phoneNumber, phoneNumber),
              ),
            );
          await contexto.context.internalAdapter.deleteSessions(usuario.id);
          await repositorioOtpTelefoneDrizzle.invalidar(
            criarHashIdentificador(
              phoneNumber,
              process.env.BETTER_AUTH_SECRET!,
            ),
            "recuperacao",
          );
          return contexto.json({ sucesso: true });
        },
      ),
    },
  };
}
