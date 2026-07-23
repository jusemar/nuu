"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { sessionTable, userTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { normalizarWhatsappAdmin } from "../lib/normalizar-whatsapp-admin";
import { emailPossuiPermissaoAdmin } from "../lib/permissoes-admin";
import { buscarSessaoAdmin } from "../queries/sessao/buscar-sessao-admin";
import { dadosMinhaContaAdminSchema } from "../schemas/dados-minha-conta-admin.schema";

type ErroBanco = Error & {
  code?: string;
  constraint?: string;
  cause?: { code?: string; constraint?: string };
};

export async function atualizarDadosMinhaContaAdmin(entrada: unknown) {
  const acesso = await buscarSessaoAdmin();
  const usuarioId = acesso.autorizado ? acesso.sessao?.user.id : null;

  if (!usuarioId || !acesso.sessao?.user) {
    return {
      sucesso: false as const,
      mensagem: "Sua sessão administrativa não está disponível.",
    };
  }

  const validacao = dadosMinhaContaAdminSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      mensagem:
        validacao.error.issues[0]?.message ?? "Revise os dados informados.",
    };
  }

  const nome = validacao.data.nome;
  const email = validacao.data.email.toLowerCase();
  const whatsapp = validacao.data.whatsapp
    ? normalizarWhatsappAdmin(validacao.data.whatsapp)
    : null;
  const emailAnterior = acesso.sessao.user.email.toLowerCase();
  const emailFoiAlterado = email !== emailAnterior;

  if (emailFoiAlterado && !emailPossuiPermissaoAdmin(email)) {
    return {
      sucesso: false as const,
      mensagem:
        "O novo e-mail precisa estar autorizado em ADMIN_EMAILS antes da alteração.",
    };
  }

  try {
    await dbTransacional.transaction(async (tx) => {
      const outroUsuarioComMesmoEmail = await tx.query.userTable.findFirst({
        columns: { id: true },
        where: and(eq(userTable.email, email), ne(userTable.id, usuarioId)),
      });

      if (outroUsuarioComMesmoEmail) {
        throw new Error("EMAIL_DUPLICADO");
      }

      if (whatsapp) {
        const outroUsuarioComMesmoWhatsapp = await tx.query.userTable.findFirst(
          {
            columns: { id: true },
            where: and(
              eq(userTable.whatsapp, whatsapp),
              ne(userTable.id, usuarioId),
            ),
          },
        );

        if (outroUsuarioComMesmoWhatsapp) {
          throw new Error("WHATSAPP_DUPLICADO");
        }
      }

      await tx
        .update(userTable)
        .set({ name: nome, email, whatsapp, updatedAt: new Date() })
        .where(eq(userTable.id, usuarioId));

      if (emailFoiAlterado) {
        await tx.delete(sessionTable).where(eq(sessionTable.userId, usuarioId));
      }
    });

    revalidatePath("/admin/minha-conta");

    return {
      sucesso: true as const,
      mensagem: emailFoiAlterado
        ? "Dados atualizados. Entre novamente com o novo e-mail."
        : "Dados da conta atualizados.",
      reautenticar: emailFoiAlterado,
    };
  } catch (erro) {
    const erroBanco = erro as ErroBanco;
    const codigo = erroBanco.code ?? erroBanco.cause?.code;
    const restricao = erroBanco.constraint ?? erroBanco.cause?.constraint;
    const mensagemInterna = erro instanceof Error ? erro.message : "";

    if (mensagemInterna === "EMAIL_DUPLICADO") {
      return {
        sucesso: false as const,
        mensagem: "Este e-mail já está vinculado a outra conta.",
      };
    }

    if (restricao === "user_whatsapp_unique") {
      return {
        sucesso: false as const,
        mensagem: "Este WhatsApp já está vinculado a outra conta.",
      };
    }

    if (codigo === "23505") {
      return {
        sucesso: false as const,
        mensagem: "Já existe uma conta com este e-mail ou WhatsApp.",
      };
    }

    if (mensagemInterna === "WHATSAPP_DUPLICADO") {
      return {
        sucesso: false as const,
        mensagem: "Este WhatsApp já está vinculado a outra conta.",
      };
    }

    console.error("[autenticacao:minha-conta:atualizar-dados]", {
      tipo: erro instanceof Error ? erro.name : "Erro desconhecido",
      codigo: codigo ?? "sem_codigo",
    });

    return {
      sucesso: false as const,
      mensagem: "Não foi possível atualizar os dados da conta agora.",
    };
  }
}
