"use server";

import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { previaRecompensaSchema } from "@/features/programa-fidelidade/schemas/previa-recompensa.schema";

import { calcularPreviaRecompensaInterno } from "./calcular-previa-recompensa-interno";

/** Fronteira pública: nunca aceita a identidade do navegador. */
export async function calcularPreviaRecompensa(entrada: unknown) {
  const dados = previaRecompensaSchema.parse(entrada);
  const sessao = await buscarSessaoCliente();
  if (!sessao) throw new Error("CLIENTE_AUTENTICADO_NECESSARIO");
  return calcularPreviaRecompensaInterno({ entrada: dados, usuarioId: sessao.usuario.id });
}
