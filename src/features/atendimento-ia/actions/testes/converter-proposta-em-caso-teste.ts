"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
  atendimentoIaPropostasMelhoriaTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { converterPropostaCasoTesteSchema } from "../../schemas/admin/caso-teste.schema";
import {
  chaveCaso,
  mapearVersaoCasoTeste,
  prepararConteudoCaso,
} from "./auxiliares";

/** Converte somente a intenção explícita; nunca copia conversa ou evidência integral. */
export async function converterPropostaEmCasoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = converterPropostaCasoTesteSchema.parse(entrada);
  const conteudo = {
    entradaControlada: {
      perguntaCliente: dados.perguntaFicticia,
      historicoFicticio: [],
    },
    contextoSimulado: {},
    expectativas: {
      assuntoEsperado: dados.categoria,
      comportamentoEsperado: dados.criterios.join("; "),
      necessitaFonte: false,
      necessitaFerramenta: false,
      ferramentaEsperada: null,
      necessitaTransferencia: false,
      respostaExataObrigatoria: false as const,
    },
    ferramentasPermitidas: [],
    ferramentasProibidas: [],
    efeitosEsperados: "nenhum" as const,
    criterios: dados.criterios,
    dadosOrigem: "ficticio" as const,
    justificativaSnapshot: null,
    autorizacaoSnapshotConfirmada: false,
  };
  const preparado = prepararConteudoCaso(conteudo);
  const id = await dbTransacional.transaction(async (tx) => {
    const [proposta] = await tx
      .select({ id: atendimentoIaPropostasMelhoriaTable.id })
      .from(atendimentoIaPropostasMelhoriaTable)
      .where(eq(atendimentoIaPropostasMelhoriaTable.id, dados.propostaId))
      .limit(1);
    if (!proposta) throw new Error("PROPOSTA_NAO_ENCONTRADA");
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
    await tx.insert(atendimentoIaCasoTesteVersoesTable).values({
      casoTesteId: caso!.id,
      numeroVersao: 1,
      estado: "rascunho",
      ...mapearVersaoCasoTeste(
        preparado.normalizado,
        preparado.hash,
        ator.usuarioId,
      ),
    });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "converter_proposta_em_caso_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_proposta_convertida_caso_teste",
      metadados: {
        propostaId: proposta.id,
        casoTesteId: caso!.id,
        copiaConversaIntegral: false,
      },
      resultado: "sucesso_comprovado",
    });
    return caso!.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { id, estado: "rascunho" as const, sucesso: true as const };
}
