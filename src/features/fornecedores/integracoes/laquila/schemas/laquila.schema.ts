import { z } from "zod";

export const ambientesIntegracaoLaquila = ["producao"] as const;

const cnpjNumericoSchema = z
  .string()
  .trim()
  .min(14, "Informe um CNPJ válido.")
  .max(18, "Informe um CNPJ válido.")
  .refine(
    (valor) => valor.replace(/\D/g, "").length === 14,
    "Informe um CNPJ válido.",
  );

const tokenClienteSchema = z
  .string()
  .trim()
  .max(500, "Token muito longo.")
  .optional()
  .transform((valor) => (valor ? valor : undefined));

const urlBaseSchema = z
  .string()
  .trim()
  .max(1000, "URL base muito longa.")
  .optional()
  .transform((valor) => (valor ? valor : undefined))
  .refine(
    (valor) => !valor || /^https?:\/\/.+/i.test(valor),
    "Informe uma URL base válida.",
  );

export const configuracaoLaquilaSchema = z.object({
  id: z.uuid().optional(),
  fornecedorId: z.uuid().optional(),
  ambiente: z.enum(ambientesIntegracaoLaquila),
  urlBase: urlBaseSchema,
  cnpjEmpresa: cnpjNumericoSchema,
  tokenCliente: tokenClienteSchema,
  ativo: z.boolean(),
});

export const testarConexaoLaquilaSchema = z.object({
  integracaoId: z.uuid(),
});

export const consultarProdutosLaquilaSchema = z.object({
  integracaoId: z.uuid(),
  pagina: z.coerce.number().int().positive().default(1),
  itensPorPagina: z.coerce.number().int().min(1).max(100).default(100),
});

export const salvarProdutosSelecionadosStagingLaquilaSchema = z.object({
  produtos: z
    .array(z.unknown())
    .min(1, "Selecione pelo menos um produto.")
    .max(500, "Selecione no máximo 500 produtos por vez."),
});

export type ConfiguracaoLaquilaSchema = z.input<
  typeof configuracaoLaquilaSchema
>;

export type TestarConexaoLaquilaSchema = z.infer<
  typeof testarConexaoLaquilaSchema
>;

export type ConsultarProdutosLaquilaSchema = z.infer<
  typeof consultarProdutosLaquilaSchema
>;
export type SalvarProdutosSelecionadosStagingLaquilaSchema = z.infer<
  typeof salvarProdutosSelecionadosStagingLaquilaSchema
>;

export function normalizarFormularioConfiguracaoLaquila(dados: FormData) {
  const id = String(dados.get("id") ?? "");

  return {
    id: id || undefined,
    fornecedorId: dados.get("fornecedorId") || undefined,
    ambiente: dados.get("ambiente") || "producao",
    urlBase: dados.get("urlBase"),
    cnpjEmpresa: dados.get("cnpjEmpresa"),
    tokenCliente: dados.get("tokenCliente"),
    ativo: dados.get("ativo") === "on",
  };
}
