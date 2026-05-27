import { z } from "zod";

const esquemaNumeroCotacaoFrenet = z.union([z.number(), z.string()]);

export const esquemaServicoCotacaoFrenet = z
  .object({
    ServiceCode: z.string().trim().optional().nullable(),
    ServiceDescription: z.string().trim().optional().nullable(),
    Carrier: z.string().trim().optional().nullable(),
    ShippingPrice: esquemaNumeroCotacaoFrenet.optional().nullable(),
    OriginalShippingPrice: esquemaNumeroCotacaoFrenet.optional().nullable(),
    DeliveryTime: esquemaNumeroCotacaoFrenet.optional().nullable(),
    OriginalDeliveryTime: esquemaNumeroCotacaoFrenet.optional().nullable(),
    Error: z.union([z.boolean(), z.string(), z.number()]).optional().nullable(),
    Msg: z.string().trim().optional().nullable(),
  })
  .passthrough();

export const esquemaResultadoCotacaoFrenet = z
  .object({
    ShippingSevicesArray: z.array(esquemaServicoCotacaoFrenet).optional(),
    ShippingServicesArray: z.array(esquemaServicoCotacaoFrenet).optional(),
  })
  .passthrough();

export type ServicoCotacaoFrenet = z.infer<typeof esquemaServicoCotacaoFrenet>;
