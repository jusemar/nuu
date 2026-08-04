import type { BloqueioPublicacao } from "../../../types/admin/publicacao";
export function consolidarBloqueios(...grupos: BloqueioPublicacao[][]) {
  return [...new Set(grupos.flat())].sort();
}
