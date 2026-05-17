import { z } from "zod";

export const configuracaoPagamentoSchema = z.object({
  pixAtivo: z.boolean(),
  cartaoAtivo: z.boolean(),
  boletoAtivo: z.boolean(),
  percentualAcrescimoCartaoBps: z.number().int().min(0).max(10000),
  parcelasSemJuros: z.number().int().min(1).max(24),
  taxaJurosMensalBps: z.number().int().min(0).max(10000),
  maximoParcelas: z.number().int().min(1).max(24),
  valorMinimoParcelaEmCentavos: z.number().int().min(100),
});

export type ConfiguracaoPagamentoSchema = z.infer<
  typeof configuracaoPagamentoSchema
>;
