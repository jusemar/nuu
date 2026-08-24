import type { GrupoNavegacao, GrupoPagina, PaginaDinamica } from "@/db/schema";

export type ResultadoOperacaoPaginasDinamicas<T = undefined> =
  | { sucesso: true; dados: T; mensagem?: string }
  | { sucesso: false; mensagem: string; campo?: "slug" | "identificador" };

export type ListagemPaginadaPaginasDinamicas = {
  itens: PaginaDinamica[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type GrupoNavegacaoComPaginas = GrupoNavegacao & {
  paginas: Array<GrupoPagina & { pagina: PaginaDinamica }>;
};
