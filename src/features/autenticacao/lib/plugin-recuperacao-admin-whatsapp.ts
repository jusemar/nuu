import "server-only";

import { APIError, createAuthEndpoint } from "better-auth/api";
import { and, eq, isNull, ne, or } from "drizzle-orm";

import { db } from "@/db/connection";
import { accountTable, sessionTable, userTable } from "@/db/schema";
import { administradoresTable } from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";
import { comunicacaoWhatsapp } from "@/features/comunicacao/whatsapp";

import {
  redefinirSenhaAdminWhatsappSchema,
  solicitarRecuperacaoAdminWhatsappSchema,
} from "../schemas/recuperacao-admin-whatsapp.schema";
import { criarHashIdentificador } from "./otp-telefone/criptografia-otp-telefone";
import { obterIpRequisicaoOtp } from "./otp-telefone/ip-requisicao-otp";
import { repositorioOtpTelefoneDrizzle } from "./otp-telefone/repositorio-otp-telefone-drizzle";
import { criarServicoOtpTelefone } from "./otp-telefone/servico-otp-telefone";
import { candidatoElegivelRecuperacaoAdmin } from "./recuperacao-admin/elegibilidade-recuperacao-admin";

const FINALIDADE_ADMIN = "admin_recuperacao" as const;
const MENSAGEM_NEUTRA =
  "Se os dados informados forem elegíveis, você receberá um código pelo WhatsApp.";

function obterSegredo() {
  const segredo = process.env.BETTER_AUTH_SECRET?.trim();
  if (!segredo) throw new Error("BETTER_AUTH_SECRET não configurada.");
  return segredo;
}

function normalizarTelefone(valor: string) {
  try {
    return comunicacaoWhatsapp.normalizarNumero(valor);
  } catch {
    return null;
  }
}

function identificadorSanitizado(valor: string) {
  return criarHashIdentificador(valor, obterSegredo()).slice(0, 12);
}

type OrigemTelefoneRecuperacao = "PHONE_NUMBER" | "WHATSAPP_LEGADO" | "NAO_LOCALIZADO";

type MotivoEventoRecuperacao =
  | "NAO_ELEGIVEL"
  | "CONFLITO_TELEFONE"
  | "RATE_LIMIT"
  | "FALHA_TRANSPORTE";

function registrarEvento(
  evento:
    | "LOCALIZADO"
    | "CONFLITO_TELEFONE"
    | "ELEGIVEL"
    | "EMISSAO_BLOQUEADA"
    | "OTP_EMITIDO"
    | "FALHA_ENVIO"
    | "OTP_CONFIRMADO"
    | "REDEFINICAO_CONCLUIDA",
  identificador: string,
  dados?: {
    origem?: OrigemTelefoneRecuperacao;
    motivo?: MotivoEventoRecuperacao;
  },
) {
  console.info("[autenticacao:admin:recuperacao-whatsapp]", {
    evento,
    finalidade: FINALIDADE_ADMIN,
    identificador,
    ...(dados?.origem ? { origem: dados.origem } : {}),
    ...(dados?.motivo ? { motivo: dados.motivo } : {}),
  });
}

function obterServicoOtp() {
  return criarServicoOtpTelefone({
    repositorio: repositorioOtpTelefoneDrizzle,
    segredo: obterSegredo(),
    enviar: async (entrada) => {
      await comunicacaoWhatsapp.enviarOtp(entrada);
    },
  });
}

async function buscarCandidato(phoneNumber: string) {
  const usuarioPorPhoneNumber = await db.query.userTable.findFirst({
    where: eq(userTable.phoneNumber, phoneNumber),
  });

  // `whatsapp` é um caminho de migração exclusivo desta recuperação. O login
  // administrativo nunca o consulta; após o OTP, a identidade passa a ser o
  // `phone_number` canônico do Better Auth.
  const usuarioPorWhatsappLegado = usuarioPorPhoneNumber
    ? null
    : await db.query.userTable.findFirst({
        where: and(
          eq(userTable.whatsapp, phoneNumber.slice(1)),
          isNull(userTable.phoneNumber),
        ),
      });
  const usuario = usuarioPorPhoneNumber ?? usuarioPorWhatsappLegado;
  const origem: OrigemTelefoneRecuperacao = usuarioPorPhoneNumber
    ? "PHONE_NUMBER"
    : usuarioPorWhatsappLegado
      ? "WHATSAPP_LEGADO"
      : "NAO_LOCALIZADO";

  if (!usuario) {
    return {
      usuario: null,
      administrador: null,
      contaCredencial: null,
      conflitoTelefone: false,
      origem,
    };
  }

  const [administrador, contaCredencial, outroUsuarioComTelefone] = await Promise.all([
    db.query.administradoresTable.findFirst({
      columns: { status: true },
      where: eq(administradoresTable.usuarioId, usuario.id),
    }),
    db.query.accountTable.findFirst({
      columns: { id: true, password: true },
      where: and(
        eq(accountTable.userId, usuario.id),
        eq(accountTable.providerId, "credential"),
      ),
    }),
    origem === "WHATSAPP_LEGADO"
      ? db.query.userTable.findFirst({
          columns: { id: true },
          where: and(
            eq(userTable.phoneNumber, phoneNumber),
            ne(userTable.id, usuario.id),
          ),
        })
      : Promise.resolve(null),
  ]);

  return {
    usuario,
    administrador: administrador ?? null,
    contaCredencial: contaCredencial ?? null,
    conflitoTelefone: Boolean(outroUsuarioComTelefone),
    origem,
  };
}

export function pluginRecuperacaoAdminWhatsapp() {
  return {
    id: "recuperacao-admin-whatsapp",
    endpoints: {
      solicitarRecuperacaoAdminWhatsapp: createAuthEndpoint(
        "/admin/telefone/recuperacao/solicitar",
        { method: "POST", body: solicitarRecuperacaoAdminWhatsappSchema },
        async (contexto) => {
          const phoneNumber = normalizarTelefone(contexto.body.phoneNumber);
          if (!phoneNumber) return contexto.json({ mensagem: MENSAGEM_NEUTRA });

          const candidato = await buscarCandidato(phoneNumber);
          const identificador = identificadorSanitizado(phoneNumber);
          if (candidato.origem !== "NAO_LOCALIZADO") {
            registrarEvento("LOCALIZADO", identificador, {
              origem: candidato.origem,
            });
          }
          if (candidato.conflitoTelefone) {
            registrarEvento("CONFLITO_TELEFONE", identificador, {
              origem: candidato.origem,
              motivo: "CONFLITO_TELEFONE",
            });
          }
          if (!candidatoElegivelRecuperacaoAdmin(candidato)) {
            registrarEvento(
              "EMISSAO_BLOQUEADA",
              identificador,
              {
                origem: candidato.origem,
                motivo: candidato.conflitoTelefone
                  ? "CONFLITO_TELEFONE"
                  : "NAO_ELEGIVEL",
              },
            );
            return contexto.json({ mensagem: MENSAGEM_NEUTRA });
          }

          try {
            registrarEvento("ELEGIVEL", identificador, {
              origem: candidato.origem,
            });
            const emissao = await obterServicoOtp().emitir({
              telefone: phoneNumber,
              finalidade: FINALIDADE_ADMIN,
              ip: obterIpRequisicaoOtp(contexto.request),
            });
            if (emissao.permitido) {
              registrarEvento("OTP_EMITIDO", identificador, {
                origem: candidato.origem,
              });
            } else {
              registrarEvento("EMISSAO_BLOQUEADA", identificador, {
                origem: candidato.origem,
                motivo: "RATE_LIMIT",
              });
            }
          } catch {
            // A resposta externa permanece neutra inclusive em falha de transporte.
            registrarEvento("FALHA_ENVIO", identificador, {
              origem: candidato.origem,
              motivo: "FALHA_TRANSPORTE",
            });
          }
          return contexto.json({ mensagem: MENSAGEM_NEUTRA });
        },
      ),

      redefinirSenhaAdminWhatsapp: createAuthEndpoint(
        "/admin/telefone/recuperacao/redefinir",
        { method: "POST", body: redefinirSenhaAdminWhatsappSchema },
        async (contexto) => {
          const phoneNumber = normalizarTelefone(contexto.body.phoneNumber);
          if (!phoneNumber) {
            throw new APIError("BAD_REQUEST", { message: "CODIGO_INVALIDO" });
          }
          const candidato = await buscarCandidato(phoneNumber);
          if (!candidatoElegivelRecuperacaoAdmin(candidato)) {
            throw new APIError("BAD_REQUEST", { message: "CODIGO_INVALIDO" });
          }

          const resultado = await obterServicoOtp().confirmar({
            telefone: phoneNumber,
            codigo: contexto.body.code,
            finalidade: FINALIDADE_ADMIN,
            ip: obterIpRequisicaoOtp(contexto.request),
          });
          if (resultado !== "VALIDO") {
            throw new APIError("BAD_REQUEST", { message: "CODIGO_INVALIDO" });
          }

          const identificador = identificadorSanitizado(candidato.usuario.id);
          registrarEvento("OTP_CONFIRMADO", identificador);
          const senhaHash = await contexto.context.password.hash(
            contexto.body.newPassword,
          );

          await dbTransacional.transaction(async (tx) => {
            const [administradorAtivo] = await tx
              .select({ id: administradoresTable.id })
              .from(administradoresTable)
              .where(
                and(
                  eq(administradoresTable.usuarioId, candidato.usuario.id),
                  eq(administradoresTable.status, "ativo"),
                ),
              )
              .for("update")
              .limit(1);
            if (!administradorAtivo) throw new Error("ADMIN_INATIVO");

            // Revalida a propriedade enquanto a promoção está bloqueada. Assim,
            // um telefone legado só é promovido se ainda for do próprio admin e
            // não tiver sido vinculado canonicamente a outra conta em paralelo.
            const [conflitoTelefone] = await tx
              .select({ id: userTable.id })
              .from(userTable)
              .where(
                and(
                  eq(userTable.phoneNumber, phoneNumber),
                  ne(userTable.id, candidato.usuario.id),
                ),
              )
              .for("update")
              .limit(1);
            if (conflitoTelefone) throw new Error("TELEFONE_EM_CONFLITO");

            const [contaAtualizada] = await tx
              .update(accountTable)
              .set({ password: senhaHash, updatedAt: new Date() })
              .where(
                and(
                  eq(accountTable.id, candidato.contaCredencial.id),
                  eq(accountTable.userId, candidato.usuario.id),
                  eq(accountTable.providerId, "credential"),
                ),
              )
              .returning({ id: accountTable.id });
            if (!contaAtualizada) throw new Error("CREDENTIAL_INDISPONIVEL");

            const [usuarioAtualizado] = await tx
              .update(userTable)
              .set({
                phoneNumber,
                phoneNumberVerified: true,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(userTable.id, candidato.usuario.id),
                  or(
                    eq(userTable.phoneNumber, phoneNumber),
                    and(
                      isNull(userTable.phoneNumber),
                      eq(userTable.whatsapp, phoneNumber.slice(1)),
                    ),
                  ),
                ),
              )
              .returning({ id: userTable.id });
            if (!usuarioAtualizado) throw new Error("TELEFONE_DIVERGENTE");

            await tx
              .delete(sessionTable)
              .where(eq(sessionTable.userId, candidato.usuario.id));
          });

          registrarEvento("REDEFINICAO_CONCLUIDA", identificador);
          return contexto.json({ sucesso: true });
        },
      ),
    },
  };
}
