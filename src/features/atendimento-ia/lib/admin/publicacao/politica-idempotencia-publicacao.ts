import { createHash } from "node:crypto";

export function calcularHashRequisicaoPublicacao(valor: unknown) {
  return createHash("sha256").update(JSON.stringify(valor)).digest("hex");
}

export function validarRepeticaoPublicacao(
  existente: { hashRequisicao: string; status: string },
  hash: string,
) {
  if (existente.hashRequisicao !== hash)
    throw new Error("CHAVE_IDEMPOTENCIA_REUTILIZADA");
  if (existente.status === "concluida") return "concluida" as const;
  throw new Error("PUBLICACAO_EM_PROCESSAMENTO");
}
