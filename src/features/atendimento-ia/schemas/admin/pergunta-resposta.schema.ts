import { z } from "zod";

const textoPrincipalSchema = z.string().trim().min(1).max(4_000);
const variacaoSchema = z.string().trim().min(3).max(300);

export const condicaoPerguntaRespostaAdminSchema = z
  .object({
    campo: z.enum([
      "canal",
      "categoria_produto",
      "tipo_cliente",
      "necessita_dado_real",
    ]),
    operador: z.enum(["igual", "diferente", "contem"]),
    valor: z.union([z.string().trim().min(1).max(120), z.boolean()]),
  })
  .strict();

export const perguntaRespostaAdminSchema = z
  .object({
    condicoes: z.array(condicaoPerguntaRespostaAdminSchema).max(20).default([]),
    consultasDadosReais: z
      .array(
        z.enum([
          "produto",
          "preco",
          "estoque",
          "promocao",
          "entrega",
          "pedido",
        ]),
      )
      .max(6)
      .default([]),
    observacoesInternas: z.string().trim().max(2_000).optional(),
    palavrasChave: z
      .array(z.string().trim().min(2).max(80))
      .max(30)
      .default([]),
    perguntaPrincipal: z.string().trim().min(3).max(500),
    respostaPrincipal: textoPrincipalSchema,
    respostaSeguraSemConfirmacao: z
      .string()
      .trim()
      .min(10)
      .max(2_000)
      .default(
        "Não consigo confirmar esse dado sem consultar a fonte real da loja.",
      ),
    variacoes: z.array(variacaoSchema).max(20).default([]),
  })
  .strict()
  .superRefine((dados, contexto) => {
    const normalizadas = dados.variacoes.map(normalizarPergunta);
    if (new Set(normalizadas).size !== normalizadas.length) {
      contexto.addIssue({
        code: "custom",
        message: "As variações da pergunta não podem se repetir.",
        path: ["variacoes"],
      });
    }
    if (normalizadas.includes(normalizarPergunta(dados.perguntaPrincipal))) {
      contexto.addIssue({
        code: "custom",
        message: "Uma variação não pode repetir a pergunta principal.",
        path: ["variacoes"],
      });
    }
  });

function normalizarPergunta(valor: string) {
  return valor
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Produz somente o contrato informativo permitido para a IA. Observações
 * internas são deliberadamente excluídas desta projeção.
 */
export function criarConteudoCanonicoPerguntaRespostaAdmin(
  entrada: z.input<typeof perguntaRespostaAdminSchema>,
) {
  const dados = perguntaRespostaAdminSchema.parse(entrada);
  return {
    condicoes: dados.condicoes,
    consultasDadosReais: dados.consultasDadosReais,
    palavrasChave: dados.palavrasChave,
    perguntaPrincipal: dados.perguntaPrincipal,
    respostaPrincipal: dados.respostaPrincipal,
    respostaSeguraSemConfirmacao: dados.respostaSeguraSemConfirmacao,
    variacoes: dados.variacoes,
  };
}
