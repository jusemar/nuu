import "server-only";

import { filtrosAdminSchema } from "../../../schemas/admin/filtros.schema";

export function validarPaginacaoAdmin(entrada: unknown) {
  const filtros = filtrosAdminSchema.parse(entrada);
  return { ...filtros, deslocamento: (filtros.pagina - 1) * filtros.limite };
}

export function criarPaginaAdmin<T>(
  itens: T[],
  total: number,
  pagina: number,
  limite: number,
) {
  return {
    itens,
    limite,
    pagina,
    total,
    totalPaginas: Math.ceil(total / limite),
  };
}
