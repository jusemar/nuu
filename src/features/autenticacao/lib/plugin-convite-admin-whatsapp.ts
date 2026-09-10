import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { createAuthEndpoint, getSessionFromCtx } from "better-auth/api";
import { and, eq } from "drizzle-orm";

import { accountTable, userTable } from "@/db/schema";
import { convitesAdministrativosTable, provasPosseConvitesAdministrativosTable } from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";
import { aceitarConviteWhatsapp } from "@/features/administradores/lib/aceitar-convite-whatsapp";
import { calcularHashTokenConvite } from "@/features/administradores/lib/token-convite-administrativo";
import { comunicacaoWhatsapp } from "@/features/comunicacao/whatsapp";

import { aceitarConviteAdminSchema, cadastrarUsuarioConviteAdminSchema, confirmarOtpConviteAdminSchema, identificarUsuarioConviteAdminSchema, solicitarOtpConviteAdminSchema } from "../schemas/convite-admin-whatsapp.schema";
import { criarHashIdentificador } from "./otp-telefone/criptografia-otp-telefone";
import { obterIpRequisicaoOtp } from "./otp-telefone/ip-requisicao-otp";
import { repositorioOtpTelefoneDrizzle } from "./otp-telefone/repositorio-otp-telefone-drizzle";
import { criarServicoOtpTelefone } from "./otp-telefone/servico-otp-telefone";

const FINALIDADE = "admin_convite" as const;
const MENSAGEM_NEUTRA = "Se o convite for elegível, você receberá um código pelo WhatsApp.";

function segredo() {
  const valor = process.env.BETTER_AUTH_SECRET?.trim();
  if (!valor) throw new Error("BETTER_AUTH_SECRET não configurada.");
  return valor;
}

function contextoSeguro(requisicao: Request) {
  const valor = `${obterIpRequisicaoOtp(requisicao)}:${requisicao.headers.get("user-agent") ?? ""}`;
  return createHash("sha256").update(valor).digest("hex");
}

function mascararTelefone(telefone: string) {
  return `•••• ${telefone.slice(-4)}`;
}

export function pluginConviteAdminWhatsapp() {
  return {
    id: "convite-admin-whatsapp",
    endpoints: {
      solicitarOtpConviteAdminWhatsapp: createAuthEndpoint(
        "/admin/convite/whatsapp/otp/solicitar",
        { method: "POST", body: solicitarOtpConviteAdminSchema },
        async (contexto) => {
          if (!contexto.request)
            return contexto.json({ sucesso: true, mensagem: MENSAGEM_NEUTRA });
          const requisicao = contexto.request;
          const tokenHash = calcularHashTokenConvite(contexto.body.token);
          const sessao = await getSessionFromCtx(contexto);
          const prova = await dbTransacional.transaction(async (tx) => {
            const [convite] = await tx.select().from(convitesAdministrativosTable)
              .where(eq(convitesAdministrativosTable.tokenHash, tokenHash)).for("update").limit(1);
            if (!convite || convite.status !== "pendente" || convite.expiraEm <= new Date() || convite.tipoIdentificador !== "whatsapp" || !convite.identificadorNormalizado)
              return null;
            const usuario = await tx.query.userTable.findFirst({
              columns: { id: true }, where: eq(userTable.phoneNumber, convite.identificadorNormalizado),
            });
            if (sessao?.user && (!usuario || usuario.id !== sessao.user.id)) return null;
            const telefone = convite.identificadorNormalizado;
            const contextoHash = contextoSeguro(requisicao);
            await tx.insert(provasPosseConvitesAdministrativosTable).values({
              conviteId: convite.id, telefoneNormalizado: telefone, usuarioId: usuario?.id ?? null,
              contextoHash, expiraEm: convite.expiraEm, finalidade: FINALIDADE,
            }).onConflictDoUpdate({
              target: [provasPosseConvitesAdministrativosTable.conviteId, provasPosseConvitesAdministrativosTable.contextoHash],
              set: { telefoneNormalizado: telefone, usuarioId: usuario?.id ?? null, expiraEm: convite.expiraEm, confirmadoEm: null, consumidoEm: null },
            });
            return { telefone, mascarado: mascararTelefone(telefone) };
          });
          if (!prova) return contexto.json({ sucesso: true, mensagem: MENSAGEM_NEUTRA });
          try {
            await criarServicoOtpTelefone({ repositorio: repositorioOtpTelefoneDrizzle, segredo: segredo(), enviar: async (entrada) => {
              await comunicacaoWhatsapp.enviarOtp(entrada);
            } }).emitir({
              telefone: prova.telefone, finalidade: FINALIDADE, ip: obterIpRequisicaoOtp(requisicao),
            });
          } catch {
            console.warn("[autenticacao:admin:convite-whatsapp]", { evento: "FALHA_ENVIO", finalidade: FINALIDADE, identificador: criarHashIdentificador(prova.telefone, segredo()).slice(0, 12) });
          }
          return contexto.json({ sucesso: true, mensagem: MENSAGEM_NEUTRA, telefoneMascarado: prova.mascarado });
        },
      ),
      confirmarOtpConviteAdminWhatsapp: createAuthEndpoint(
        "/admin/convite/whatsapp/otp/confirmar",
        { method: "POST", body: confirmarOtpConviteAdminSchema },
        async (contexto) => {
          if (!contexto.request)
            return contexto.json({ confirmado: false, mensagem: MENSAGEM_NEUTRA });
          const requisicao = contexto.request;
          const sessao = await getSessionFromCtx(contexto);
          const tokenHash = calcularHashTokenConvite(contexto.body.token);
          const contextoHash = contextoSeguro(requisicao);
          console.info("[autenticacao:admin:convite-whatsapp]", { evento: "CONFIRMACAO_INICIADA", finalidade: FINALIDADE });
          const dados = await dbTransacional.transaction(async (tx) => {
            const [convite] = await tx.select().from(convitesAdministrativosTable)
              .where(eq(convitesAdministrativosTable.tokenHash, tokenHash)).for("update").limit(1);
            if (!convite || convite.status !== "pendente" || convite.expiraEm <= new Date() || convite.tipoIdentificador !== "whatsapp" || !convite.identificadorNormalizado) return null;
            const [prova] = await tx.select().from(provasPosseConvitesAdministrativosTable).where(and(
              eq(provasPosseConvitesAdministrativosTable.conviteId, convite.id),
              eq(provasPosseConvitesAdministrativosTable.telefoneNormalizado, convite.identificadorNormalizado),
              eq(provasPosseConvitesAdministrativosTable.finalidade, FINALIDADE),
              eq(provasPosseConvitesAdministrativosTable.contextoHash, contextoHash),
            )).for("update").limit(1);
            if (!prova || prova.consumidoEm || prova.confirmadoEm || prova.expiraEm <= new Date()) return null;
            const usuario = await tx.query.userTable.findFirst({ columns: { id: true, phoneNumber: true }, where: eq(userTable.phoneNumber, convite.identificadorNormalizado) });
            if ((prova.usuarioId ?? null) !== (usuario?.id ?? null) || (sessao?.user && sessao.user.id !== usuario?.id)) return null;
            return { conviteId: convite.id, provaId: prova.id, telefone: convite.identificadorNormalizado, mascarado: mascararTelefone(convite.identificadorNormalizado) };
          });
          if (!dados) return contexto.json({ confirmado: false, mensagem: MENSAGEM_NEUTRA });
          const resultado = await criarServicoOtpTelefone({ repositorio: repositorioOtpTelefoneDrizzle, segredo: segredo(), enviar: async (entrada) => { await comunicacaoWhatsapp.enviarOtp(entrada); } }).confirmar({
            telefone: dados.telefone, codigo: contexto.body.code, finalidade: FINALIDADE, ip: obterIpRequisicaoOtp(requisicao),
          });
          if (resultado !== "VALIDO") {
            console.info("[autenticacao:admin:convite-whatsapp]", { evento: "OTP_NAO_VALIDO", finalidade: FINALIDADE, motivo: resultado });
            return contexto.json({ confirmado: false, mensagem: MENSAGEM_NEUTRA });
          }
          const [confirmada] = await dbTransacional.update(provasPosseConvitesAdministrativosTable)
            .set({ confirmadoEm: new Date() })
            .where(and(eq(provasPosseConvitesAdministrativosTable.id, dados.provaId), eq(provasPosseConvitesAdministrativosTable.conviteId, dados.conviteId), eq(provasPosseConvitesAdministrativosTable.contextoHash, contextoHash)))
            .returning({ id: provasPosseConvitesAdministrativosTable.id });
          if (!confirmada) return contexto.json({ confirmado: false, mensagem: MENSAGEM_NEUTRA });
          console.info("[autenticacao:admin:convite-whatsapp]", { evento: "CONFIRMACAO_CONCLUIDA", finalidade: FINALIDADE });
          return contexto.json({ confirmado: true, telefoneMascarado: dados.mascarado, proximoPasso: "IDENTIFICACAO" });
        },
      ),
      identificarUsuarioConviteAdminWhatsapp: createAuthEndpoint(
        "/admin/convite/whatsapp/identificar-usuario",
        { method: "POST", body: identificarUsuarioConviteAdminSchema },
        async (contexto) => {
          if (!contexto.request)
            return contexto.json({ usuarioIdentificado: false, proximoPasso: "CADASTRO" });
          const sessao = await getSessionFromCtx(contexto);
          const contextoHash = contextoSeguro(contexto.request);
          const tokenHash = calcularHashTokenConvite(contexto.body.token);
          const resultado = await dbTransacional.transaction(async (tx) => {
            const [convite] = await tx.select().from(convitesAdministrativosTable)
              .where(eq(convitesAdministrativosTable.tokenHash, tokenHash)).for("update").limit(1);
            if (!convite || convite.status !== "pendente" || convite.expiraEm <= new Date() || convite.tipoIdentificador !== "whatsapp" || !convite.identificadorNormalizado) return null;
            const [prova] = await tx.select().from(provasPosseConvitesAdministrativosTable).where(and(
              eq(provasPosseConvitesAdministrativosTable.conviteId, convite.id),
              eq(provasPosseConvitesAdministrativosTable.telefoneNormalizado, convite.identificadorNormalizado),
              eq(provasPosseConvitesAdministrativosTable.finalidade, FINALIDADE),
              eq(provasPosseConvitesAdministrativosTable.contextoHash, contextoHash),
            )).for("update").limit(1);
            if (!prova || !prova.confirmadoEm || prova.consumidoEm || prova.expiraEm <= new Date()) return null;
            const usuarios = await tx.select({ id: userTable.id, phoneNumberVerified: userTable.phoneNumberVerified })
              .from(userTable).where(eq(userTable.phoneNumber, convite.identificadorNormalizado)).for("update");
            if (usuarios.length > 1) return null;
            const usuario = usuarios[0];
            if (!usuario) return { encontrado: false as const };
            if (sessao?.user && sessao.user.id !== usuario.id) return null;
            if (prova.usuarioId && prova.usuarioId !== usuario.id) return null;
            await tx.update(provasPosseConvitesAdministrativosTable).set({ usuarioId: usuario.id })
              .where(eq(provasPosseConvitesAdministrativosTable.id, prova.id));
            if (!usuario.phoneNumberVerified)
              await tx.update(userTable).set({ phoneNumberVerified: true, updatedAt: new Date() })
                .where(eq(userTable.id, usuario.id));
            return { encontrado: true as const };
          });
          if (!resultado) return contexto.json({ usuarioIdentificado: false, proximoPasso: "BLOQUEADO" });
          return contexto.json({ usuarioIdentificado: resultado.encontrado, proximoPasso: resultado.encontrado ? "ACEITAR_CONVITE" : "CADASTRO" });
        },
      ),
      cadastrarUsuarioConviteAdminWhatsapp: createAuthEndpoint(
        "/admin/convite/whatsapp/cadastrar-usuario",
        { method: "POST", body: cadastrarUsuarioConviteAdminSchema },
        async (contexto) => {
          if (!contexto.request) return contexto.json({ cadastroCriado: false });
          const sessao = await getSessionFromCtx(contexto);
          if (sessao?.user) return contexto.json({ cadastroCriado: false });
          const senhaHash = await contexto.context.password.hash(contexto.body.password);
          const tokenHash = calcularHashTokenConvite(contexto.body.token);
          const contextoHash = contextoSeguro(contexto.request);
          const criado = await dbTransacional.transaction(async (tx) => {
            const [convite] = await tx.select().from(convitesAdministrativosTable).where(eq(convitesAdministrativosTable.tokenHash, tokenHash)).for("update").limit(1);
            if (!convite || convite.status !== "pendente" || convite.expiraEm <= new Date() || convite.tipoIdentificador !== "whatsapp" || !convite.identificadorNormalizado) return null;
            const [prova] = await tx.select().from(provasPosseConvitesAdministrativosTable).where(and(eq(provasPosseConvitesAdministrativosTable.conviteId, convite.id), eq(provasPosseConvitesAdministrativosTable.telefoneNormalizado, convite.identificadorNormalizado), eq(provasPosseConvitesAdministrativosTable.contextoHash, contextoHash), eq(provasPosseConvitesAdministrativosTable.finalidade, FINALIDADE))).for("update").limit(1);
            if (!prova || !prova.confirmadoEm || prova.consumidoEm || prova.usuarioId || prova.expiraEm <= new Date()) return null;
            const [porTelefone, porEmail] = await Promise.all([tx.query.userTable.findFirst({ where: eq(userTable.phoneNumber, convite.identificadorNormalizado) }), tx.query.userTable.findFirst({ where: eq(userTable.email, contexto.body.email) })]);
            if (porTelefone || porEmail) return null;
            const agora = new Date(); const usuarioId = randomUUID();
            await tx.insert(userTable).values({ id: usuarioId, name: contexto.body.name, email: contexto.body.email, emailVerified: false, phoneNumber: convite.identificadorNormalizado, phoneNumberVerified: true, createdAt: agora, updatedAt: agora });
            await tx.insert(accountTable).values({ id: randomUUID(), accountId: usuarioId, providerId: "credential", userId: usuarioId, password: senhaHash, createdAt: agora, updatedAt: agora });
            await tx.update(provasPosseConvitesAdministrativosTable).set({ usuarioId }).where(eq(provasPosseConvitesAdministrativosTable.id, prova.id));
            return true;
          }).catch(() => null);
          return contexto.json({ cadastroCriado: Boolean(criado), proximoPasso: criado ? "ACEITAR_CONVITE" : "BLOQUEADO" });
        },
      ),
      aceitarConviteAdminWhatsapp: createAuthEndpoint(
        "/admin/convite/whatsapp/aceitar",
        { method: "POST", body: aceitarConviteAdminSchema },
        async (contexto) => {
          if (!contexto.request)
            return contexto.json({ aceito: false });

          const sessao = await getSessionFromCtx(contexto);
          const resultado = await aceitarConviteWhatsapp({
            contextoHash: contextoSeguro(contexto.request),
            token: contexto.body.token,
            usuarioSessaoId: sessao?.user.id ?? null,
          });

          if (!resultado) {
            console.info("[autenticacao:admin:convite-whatsapp]", {
              evento: "ACEITE_NAO_CONCLUIDO",
              finalidade: FINALIDADE,
            });
            return contexto.json({ aceito: false });
          }

          console.info("[autenticacao:admin:convite-whatsapp]", {
            evento: "ACEITE_CONCLUIDO",
            finalidade: FINALIDADE,
          });
          return contexto.json({
            aceito: true,
            acesso_admin: true,
            proximo_destino: "/admin",
          });
        },
      ),
    },
  };
}
