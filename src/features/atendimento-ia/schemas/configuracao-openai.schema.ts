import { z } from "zod";

const inteiroConfiguravel = (padrao: number, minimo: number, maximo: number) =>
  z.preprocess(
    (valor) => (valor === undefined || valor === "" ? padrao : valor),
    z.coerce.number().int().min(minimo).max(maximo),
  );

export const configuracaoOpenAiSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1),
  OPENAI_ATENDENTE_MAX_OUTPUT_TOKENS: inteiroConfiguravel(1200, 100, 4000),
  OPENAI_ATENDENTE_MAX_TENTATIVAS: inteiroConfiguravel(2, 1, 3),
  OPENAI_ATENDENTE_TIMEOUT_MS: inteiroConfiguravel(20_000, 1_000, 60_000),
});
