import { z } from "zod";

const quantidade = z
  .number({ error: "Informe um valor numérico válido." })
  .finite("Informe um valor numérico válido.")
  .max(9_007_199_254_740_991, "Valor acima do limite permitido.")
  .multipleOf(0.0001, "Use no máximo quatro casas decimais.");

export const salvarProgramaFidelidadeSchema = z.object({
  configuracao: z.object({
    ativo: z.boolean(),
    nomePublico: z
      .string()
      .trim()
      .min(1, "Informe o nome público do programa.")
      .max(80, "O nome público deve ter no máximo 80 caracteres."),
    pontosPorReal: quantidade
      .positive("Os pontos por real devem ser maiores que zero.")
      .max(99_999_999, "Taxa de pontos acima do limite permitido."),
    pontosConversao: quantidade.positive(
      "A conversão deve ser maior que zero.",
    ),
    valorCredito: z
      .number()
      .finite()
      .positive("O crédito deve ser maior que zero.")
      .max(21_474_836.47, "Crédito acima do limite permitido.")
      .multipleOf(0.01, "O crédito deve ter no máximo duas casas decimais."),
    minimoResgate: quantidade.nonnegative(
      "O mínimo para resgate não pode ser negativo.",
    ),
    mesesValidade: z.union([
      z.literal(0),
      z.literal(3),
      z.literal(6),
      z.literal(12),
      z.literal(24),
    ]),
  }),
  regras: z
    .array(
      z
        .object({
          categoriaId: z.uuid("Categoria inválida."),
          personalizada: z.boolean(),
          pontosPorReal: quantidade
            .nonnegative()
            .max(99_999_999, "Taxa de pontos acima do limite permitido."),
          ativa: z.boolean(),
        })
        .superRefine((regra, contexto) => {
          if (regra.personalizada && regra.pontosPorReal <= 0) {
            contexto.addIssue({
              code: "custom",
              path: ["pontosPorReal"],
              message: "A taxa personalizada deve ser maior que zero.",
            });
          }
        }),
    )
    .max(10_000, "Quantidade de categorias acima do limite permitido.")
    .superRefine((regras, contexto) => {
      const ids = new Set<string>();
      regras.forEach((regra, indice) => {
        if (ids.has(regra.categoriaId)) {
          contexto.addIssue({
            code: "custom",
            path: [indice, "categoriaId"],
            message: "Uma categoria foi enviada mais de uma vez.",
          });
        }
        ids.add(regra.categoriaId);
      });
    }),
  versao: z.number().int().positive(),
});
