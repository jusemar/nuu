"use server";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  administradoresTable,
  auditoriasAdministrativasTable,
  checkoutItemComissaoEventosTable,
  checkoutItemComissaoQuitacoesTable,
  checkoutItemComissoesTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { exigirGestorRepresentantes } from "@/features/fornecedores/queries/representantes/exigir-gestor-representantes";

import { derivarSituacaoComissao } from "../../lib/painel-comissoes/situacao-comissao";
import { quitarComissaoSchema } from "../../schemas/painel-comissoes/painel.schema";
/** Registra quitação integral já feita externamente. Não chama banco, gateway ou motor de cálculo. */
export async function registrarQuitacaoComissao(entrada: unknown) {
  try {
    const ator = await exigirGestorRepresentantes(),
      dados = quitarComissaoSchema.parse(entrada);
    const hoje = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    if (dados.data > hoje) throw new Error("Data futura não permitida.");
    const resultado = await dbTransacional.transaction(async (tx) => {
      const [ref] = await tx
        .select({ pedidoId: checkoutItemComissoesTable.pedidoId })
        .from(checkoutItemComissoesTable)
        .where(eq(checkoutItemComissoesTable.id, dados.comissaoId));
      if (!ref) throw new Error("Comissão indisponível.");
      // Mesmo lock da confirmação/cancelamento; não quita durante uma invalidação concorrente.
      const [pedido] = await tx
        .select()
        .from(checkoutPedidosTable)
        .where(eq(checkoutPedidosTable.id, ref.pedidoId))
        .for("update");
      const [admin] = await tx
        .select()
        .from(administradoresTable)
        .where(eq(administradoresTable.id, ator.administradorId))
        .for("share");
      if (
        !admin?.administradorPrincipal ||
        admin.status !== "ativo" ||
        admin.usuarioId !== ator.userId
      )
        throw new Error("Gestão indisponível.");
      const [c] = await tx
        .select()
        .from(checkoutItemComissoesTable)
        .where(eq(checkoutItemComissoesTable.id, dados.comissaoId))
        .for("share");
      if (!pedido || !c) throw new Error("Comissão indisponível.");
      const eventos = await tx
        .select({ tipo: checkoutItemComissaoEventosTable.tipo })
        .from(checkoutItemComissaoEventosTable)
        .where(eq(checkoutItemComissaoEventosTable.comissaoId, c.id))
        .for("share");
      const [existente] = await tx
        .select()
        .from(checkoutItemComissaoQuitacoesTable)
        .where(eq(checkoutItemComissaoQuitacoesTable.comissaoId, c.id))
        .for("update");
      const estado = derivarSituacaoComissao({
        confirmada: eventos.some((e) => e.tipo === "confirmada"),
        cancelada: eventos.some((e) => e.tipo === "cancelada"),
        estornada: eventos.some((e) => e.tipo === "estornada"),
        pedidoCancelado: pedido.status === "canceled",
        pedidoReembolsado: pedido.status === "refunded",
        quitada: !!existente,
      });
      if (
        estado === "cancelada" ||
        estado === "estornada" ||
        estado === "aguardando_confirmacao" ||
        pedido.pagamentoStatus !== "paid" ||
        !["paid", "processing", "shipped", "delivered"].includes(pedido.status)
      )
        throw new Error("Comissão não está válida para quitação.");
      if (existente) return { id: existente.id, jaExistia: true };
      const dataMinima = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
      }).format(c.createdAt);
      if (dados.data < dataMinima) throw new Error("Data anterior à venda.");
      const valor = c.snapshot.comissaoCentavos;
      if (!Number.isSafeInteger(valor) || valor < 0)
        throw new Error("Valor histórico inválido.");
      const [registro] = await tx
        .insert(checkoutItemComissaoQuitacoesTable)
        .values({
          comissaoId: c.id,
          responsavelAdministradorId: ator.administradorId,
          dataQuitacao: sql`${dados.data}::timestamp at time zone 'America/Sao_Paulo'`,
          valorEmCentavos: valor,
          referencia: dados.referencia || null,
          observacao: dados.observacao || null,
        })
        .returning({ id: checkoutItemComissaoQuitacoesTable.id });
      await tx.insert(auditoriasAdministrativasTable).values({
        atorAdministradorId: ator.administradorId,
        acao: "representantes.comissao_quitacao_manual",
        recursoTipo: "comissao",
        recursoId: c.id,
        resultado: "sucesso",
        metadados: { quitacaoId: registro.id, valorEmCentavos: valor },
      });
      return { ...registro, jaExistia: false };
    });
    try {
      revalidatePath("/admin/comissoes-representantes");
    } catch {
      /* Cache não desfaz um commit. */
    }
    return { sucesso: true as const, dados: resultado };
  } catch {
    return {
      sucesso: false as const,
      mensagem:
        "Não foi possível registrar. Confira a data, sua autorização e se a comissão permanece confirmada e válida.",
    };
  }
}
