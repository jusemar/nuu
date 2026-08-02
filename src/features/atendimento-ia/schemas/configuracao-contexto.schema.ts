import { z } from "zod";

const inteiro = (padrao: number, minimo: number, maximo: number) =>
  z.preprocess(
    (valor) => (valor === undefined || valor === "" ? padrao : valor),
    z.coerce.number().int().min(minimo).max(maximo),
  );

export const configuracaoContextoSchema = z
  .object({
    ATENDENTE_IA_CONTEXTO_MAX_TOKENS: inteiro(8_000, 1_000, 32_000),
    ATENDENTE_IA_RESUMO_INICIAL_TOKENS: inteiro(6_000, 500, 31_000),
    ATENDENTE_IA_RESUMO_ATUALIZACAO_TOKENS: inteiro(4_000, 500, 31_000),
    ATENDENTE_IA_CONTEXTO_VISITANTE_DIAS: inteiro(7, 1, 90),
    ATENDENTE_IA_CONTEXTO_AUTENTICADO_DIAS: inteiro(30, 1, 365),
    ATENDENTE_IA_MEMORIA_DIAS: inteiro(30, 1, 365),
  })
  .superRefine((valor, contexto) => {
    if (
      valor.ATENDENTE_IA_RESUMO_INICIAL_TOKENS >=
      valor.ATENDENTE_IA_CONTEXTO_MAX_TOKENS
    ) {
      contexto.addIssue({
        code: "custom",
        message: "O limiar do resumo deve ser menor que o orçamento.",
        path: ["ATENDENTE_IA_RESUMO_INICIAL_TOKENS"],
      });
    }
  });
