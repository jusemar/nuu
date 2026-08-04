import type { EntradaElegibilidadePublicacao } from "../../../types/admin/publicacao";
import { avaliarElegibilidadePublicacao } from "./avaliar-elegibilidade-publicacao";

export function validarPublicacaoNoServidor(
  evidencias: EntradaElegibilidadePublicacao,
  justificativa?: string,
) {
  const resultado = avaliarElegibilidadePublicacao(evidencias);
  if (!resultado.elegivel || resultado.bloqueios.length)
    throw new Error("PUBLICACAO_NAO_ELEGIVEL");
  if (
    resultado.alertas.length &&
    (!justificativa || justificativa.trim().length < 20)
  )
    throw new Error("JUSTIFICATIVA_ALERTAS_OBRIGATORIA");
  return resultado;
}
