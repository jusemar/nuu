import { z } from "zod";

const dinheiro = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
/** Percentuais são inteiros em pontos-base: 10000 = 100%, 125 = 1,25%. */
export const valorRegraComissaoSchema = z.discriminatedUnion("tipo", [
  z
    .object({
      tipo: z.literal("percentual"),
      valor: z.number().int().min(0).max(10000),
    })
    .strict(),
  z
    .object({
      tipo: z.literal("fixa"),
      valor: z.number().int().min(0).max(2147483647),
    })
    .strict(),
]);
export const configurarComissaoRepresentanteSchema = z
  .object({
    autorizacaoId: z.uuid(),
    produtoId: z.uuid(),
    tipo: z.enum(["percentual", "fixa"]).nullable(),
    valor: z.number().int().min(0).max(2147483647).nullable(),
    ativa: z.boolean().default(false),
    visivel: z.boolean(),
  })
  .strict()
  .refine(
    (d) =>
      d.tipo === null
        ? d.valor === null && !d.visivel && !d.ativa
        : valorRegraComissaoSchema.safeParse({ tipo: d.tipo, valor: d.valor })
            .success,
    "Configuração de comissão inválida.",
  );

/** Uma relação explicitamente escolhida pelo chamador, nunca uma lista de autorizados. */
export const atribuicaoComissaoSchema = z
  .object({
    representanteId: z.string().trim().min(1).max(200),
    representanteFornecedorId: z.uuid(),
    fornecedorId: z.uuid(),
    produtoId: z.uuid(),
    autorizacaoId: z.uuid(),
  })
  .strict();
export const regraComissaoAtribuidaSchema = z
  .object({
    atribuicao: atribuicaoComissaoSchema,
    versao: z.iso.datetime(),
    ativa: z.boolean(),
    regra: valorRegraComissaoSchema,
  })
  .strict();
/** Total líquido é do ITEM inteiro, após descontos rateados a ele. Não aceita frete/taxa. */
export const itemVendidoComissaoSchema = z
  .object({
    quantidade: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
    precoUnitarioVendidoCentavos: dinheiro,
    descontoItemCentavos: dinheiro.default(0),
    valorLiquidoItemCentavos: dinheiro,
  })
  .strict()
  .refine(
    (d) =>
      BigInt(d.precoUnitarioVendidoCentavos) * BigInt(d.quantidade) -
        BigInt(d.descontoItemCentavos) ===
      BigInt(d.valorLiquidoItemCentavos),
    "Valor líquido deve corresponder ao preço vendido × quantidade menos o desconto do item.",
  );
export const calcularComissaoRepresentanteSchema = z
  .object({
    atribuicao: atribuicaoComissaoSchema,
    regra: regraComissaoAtribuidaSchema,
    item: itemVendidoComissaoSchema,
  })
  .strict();
