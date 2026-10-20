import type { ConfirmacaoRecompensa } from "@/features/programa-fidelidade/schemas/confirmacao-recompensa.schema";

/** Chaves centralizadas para invalidar cotação e prévia após alterações da entrega. */
export const chavesConsultaRecompensa = {
  cotacao: (produtoId: string, varianteId: string, cep: string) =>
    ["recompensa", "cotacao", produtoId, varianteId, cep] as const,
  previa: (produtoId: string, varianteId: string, cep: string, cidade: string,
    estado: string, selecoes: ConfirmacaoRecompensa["selecoesEntregaPorGrupo"]) =>
    ["recompensa", "previa", produtoId, varianteId, cep, cidade, estado,
      selecoes.map((selecao) => [selecao.chaveGrupo, selecao.identificador, selecao.valorEmCentavos])] as const,
};
