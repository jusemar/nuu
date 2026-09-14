import type { ModoDisponibilidadeFreteExterno } from "@/db/table/logistics/frete-externo/modo-disponibilidade-frete-externo";

/**
 * Padrão da loja quando nem o Produto nem nenhuma Categoria da cadeia define a
 * disponibilidade do Frete Externo. Mantém o comportamento histórico: ativado.
 */
export const PADRAO_LOJA_FRETE_EXTERNO = "ativado" as const;

/**
 * Provedores que NÃO são Frete Externo: modalidades próprias da loja,
 * independentes do gate (continuam com suas próprias configurações).
 */
export const PROVEDORES_FORA_DO_FRETE_EXTERNO: ReadonlySet<string> = new Set([
  "entrega-propria",
  "retirada",
]);

/** Rótulos em PT-BR usados pelo Admin (Produto e Categoria). */
export const ROTULOS_MODO_FRETE_EXTERNO: Record<
  ModoDisponibilidadeFreteExterno,
  string
> = {
  herdar: "Herdar",
  ativado: "Ativado",
  desativado: "Desativado",
};

export const MODOS_DISPONIBILIDADE_FRETE_EXTERNO = [
  "herdar",
  "ativado",
  "desativado",
] as const satisfies readonly ModoDisponibilidadeFreteExterno[];
