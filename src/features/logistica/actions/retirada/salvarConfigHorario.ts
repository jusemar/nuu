"use server";

// Action: salva configuração única de horário da loja
// Se não existe, cria. Se existe, atualiza.
// Validação dupla: Zod no server + retorno padronizado

import { db } from "@/db/connection";
import { configHorarioTable } from "@/db/table/retirada/config-horario";
import { configHorarioSchema } from "@/features/logistica/schemas/retiradaLocal.schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function salvarConfigHorario(dados: unknown) {
  // 1. Validação server-side com Zod
  const parse = configHorarioSchema.safeParse(dados);
  if (!parse.success) {
    return {
      success: false,
      error: "Dados inválidos: " + parse.error.issues.map(e => e.message).join(", "),
    };
  }

  const config = parse.data;

  try {
    // 2. Verifica se já existe config
    const [existente] = await db
      .select()
      .from(configHorarioTable)
      .limit(1);

    if (existente) {
      // Atualiza
      await db
        .update(configHorarioTable)
        .set({
          horaAbertura: config.horaAbertura,
          horaFechamento: config.horaFechamento,
          usaIntervaloAlmoco: config.usaIntervaloAlmoco,
          horaAlmocoInicio: config.horaAlmocoInicio,
          horaAlmocoFim: config.horaAlmocoFim,
          diasFuncionamento: JSON.stringify(config.diasFuncionamento),
          updatedAt: new Date(),
        })
        .where(eq(configHorarioTable.id, existente.id));
    } else {
      // Cria
      await db.insert(configHorarioTable).values({
        horaAbertura: config.horaAbertura,
        horaFechamento: config.horaFechamento,
        usaIntervaloAlmoco: config.usaIntervaloAlmoco,
        horaAlmocoInicio: config.horaAlmocoInicio,
        horaAlmocoFim: config.horaAlmocoFim,
        diasFuncionamento: JSON.stringify(config.diasFuncionamento),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Revalida cache da página admin
    revalidatePath("/admin/logistica/retirada-local");

    return { success: true, data: null };
  } catch (err) {
    console.error("[salvarConfigHorario]", err);
    return { success: false, error: "Erro ao salvar configuração de horário" };
  }
}