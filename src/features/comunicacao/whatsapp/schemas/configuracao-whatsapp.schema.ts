import { z } from "zod";

export const configuracaoWhatsappMetaSchema = z.object({
  tokenAcesso: z.string().min(1),
  phoneNumberId: z.string().regex(/^[0-9]+$/),
  versaoGraphApi: z.string().regex(/^v[0-9]+\.[0-9]+$/),
  nomeTemplateOtp: z.string().regex(/^[a-z0-9_]+$/),
  idiomaTemplateOtp: z.string().regex(/^[a-z]{2}(?:_[A-Z]{2})?$/),
});
