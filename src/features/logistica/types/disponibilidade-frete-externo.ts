import type { ModoDisponibilidadeFreteExterno } from "@/db/table/logistics/frete-externo/modo-disponibilidade-frete-externo";

import type {
  OrigemModoHerdado,
  ResultadoModoHerdado,
} from "../lib/disponibilidade/resolver-modo-herdado";

export type { ModoDisponibilidadeFreteExterno };

/** Categoria da cadeia, da mais específica (índice 0) para a raiz. */
export type CategoriaCadeiaFreteExterno = {
  id: string;
  nome: string;
  modo: ModoDisponibilidadeFreteExterno;
};

/** De onde veio o valor efetivo do Frete Externo. */
export type OrigemDisponibilidadeFreteExterno = OrigemModoHerdado;

export type DisponibilidadeFreteExterno = ResultadoModoHerdado;
