import { createHash } from "node:crypto";
function ordenar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === "object")
    return Object.fromEntries(
      Object.entries(valor)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, ordenar(v)]),
    );
  return valor;
}
export function calcularHashCasoTeste(valor: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(ordenar(valor)))
    .digest("hex");
}
