import type { PaginaDinamica } from "@/db/schema";

export function paginaPodeSerAssociada(status: PaginaDinamica["status"]) {
  return status !== "arquivada";
}

export function filtrarPaginasAssociaveis(
  paginas: PaginaDinamica[],
  idsJaAssociados: Iterable<string>,
) {
  const associados = new Set(idsJaAssociados);
  return paginas.filter(
    (pagina) =>
      paginaPodeSerAssociada(pagina.status) && !associados.has(pagina.id),
  );
}
