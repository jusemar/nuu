import { createHash } from "node:crypto";
export function calcularHashComportamento(configuracao: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(configuracao))
    .digest("hex");
}
