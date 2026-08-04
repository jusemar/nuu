import { createHash } from "node:crypto";

import type { EntradaElegibilidadePublicacao } from "../../../types/admin/publicacao";
function ordenar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === "object")
    return Object.fromEntries(
      Object.entries(valor)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([chave, item]) => [chave, ordenar(item)]),
    );
  return valor;
}
export function calcularIdentidadeCandidato(
  entrada: Pick<
    EntradaElegibilidadePublicacao,
    | "tipo"
    | "candidatoId"
    | "hashAtual"
    | "itensLote"
    | "comportamentoCandidato"
    | "conjuntoTesteId"
  >,
) {
  const itens = [...(entrada.itensLote ?? [])].sort(
    (a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id),
  );
  return createHash("sha256")
    .update(
      JSON.stringify(
        ordenar({
          tipo: entrada.tipo,
          candidatoId: entrada.candidatoId,
          hashAtual: entrada.hashAtual,
          itens,
          comportamento: entrada.comportamentoCandidato ?? null,
          conjuntoTesteId: entrada.conjuntoTesteId ?? null,
        }),
      ),
    )
    .digest("hex");
}
