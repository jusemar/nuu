import { createHash } from "node:crypto";

export function calcularIdentidadeRestauracao(entrada: {
  atorId: string;
  chaveIdempotencia: string;
  justificativaNormalizada: string;
  recursoId: string;
  tipo: "conhecimento" | "comportamento";
  versaoOrigemId: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        atorId: entrada.atorId,
        chaveIdempotencia: entrada.chaveIdempotencia,
        justificativaNormalizada: entrada.justificativaNormalizada,
        recursoId: entrada.recursoId,
        tipo: entrada.tipo,
        versaoOrigemId: entrada.versaoOrigemId,
      }),
    )
    .digest("hex");
}
