"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  configuracoesBarraAvisosTable,
  mensagensBarraAvisosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { barraAvisosSchema } from "../schemas/barra-avisos.schema";

const ID_CONFIGURACAO_GLOBAL = "global";

export async function salvarBarraAvisos(data: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOJA_CONFIGURACOES.ADMINISTRAR);
  const dados = barraAvisosSchema.parse(data);
  const agora = new Date();

  await dbTransacional.transaction(async (transacao) => {
    await transacao
      .insert(configuracoesBarraAvisosTable)
      .values({
        id: ID_CONFIGURACAO_GLOBAL,
        ativo: dados.ativo,
        corFundo: dados.corFundo.toLowerCase(),
        corTexto: dados.corTexto.toLowerCase(),
        velocidadeSegundos: dados.velocidadeSegundos,
        pausarHover: dados.pausarHover,
        createdAt: agora,
        updatedAt: agora,
      })
      .onConflictDoUpdate({
        target: configuracoesBarraAvisosTable.id,
        set: {
          ativo: dados.ativo,
          corFundo: dados.corFundo.toLowerCase(),
          corTexto: dados.corTexto.toLowerCase(),
          velocidadeSegundos: dados.velocidadeSegundos,
          pausarHover: dados.pausarHover,
          updatedAt: agora,
        },
      });

    await transacao
      .delete(mensagensBarraAvisosTable)
      .where(
        eq(mensagensBarraAvisosTable.configuracaoId, ID_CONFIGURACAO_GLOBAL),
      );

    if (dados.mensagens.length) {
      await transacao.insert(mensagensBarraAvisosTable).values(
        dados.mensagens.map((mensagem, ordem) => ({
          id: mensagem.id,
          configuracaoId: ID_CONFIGURACAO_GLOBAL,
          texto: mensagem.texto.trim(),
          icone: mensagem.icone?.trim() || null,
          ativo: mensagem.ativo,
          ordem,
          createdAt: agora,
          updatedAt: agora,
        })),
      );
    }
  });

  revalidatePath("/admin/configuracoes/loja");
  revalidatePath("/", "page");
  revalidatePath("/[slug]", "page");

  return { success: true as const, message: "Barra de avisos salva." };
}
