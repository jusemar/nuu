"use server";
import { revalidatePath } from "next/cache";

import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarCasoTesteSchema } from "../../schemas/admin/caso-teste.schema";
import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
  chaveCaso,
  mapearVersaoCasoTeste,
  prepararConteudoCaso,
} from "./auxiliares";
export async function criarCasoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = criarCasoTesteSchema.parse(entrada);
  const preparado = prepararConteudoCaso(dados.conteudo);
  const id = await dbTransacional.transaction(async (tx) => {
    const [caso] = await tx
      .insert(atendimentoIaCasosTesteTable)
      .values({
        chaveEstavel: chaveCaso(),
        nome: dados.nome,
        descricao: dados.descricao,
        categoria: dados.categoria,
        criticidade: dados.criticidade,
        criadoPorId: ator.usuarioId,
      })
      .returning({ id: atendimentoIaCasosTesteTable.id });
    if (!caso) throw new Error("FALHA_CRIAR_CASO_TESTE");
    await tx.insert(atendimentoIaCasoTesteVersoesTable).values({
      casoTesteId: caso.id,
      numeroVersao: 1,
      ...mapearVersaoCasoTeste(
        preparado.normalizado,
        preparado.hash,
        ator.usuarioId,
      ),
    });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "criar_caso_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_teste_criado",
      resultado: "sucesso_comprovado",
    });
    return caso.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { id, sucesso: true as const };
}
