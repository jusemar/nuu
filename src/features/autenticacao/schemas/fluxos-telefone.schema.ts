import { z } from "zod";

export const loginTelefoneSchema = z.object({
  phoneNumber: z.string(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const telefoneSchema = z.object({ phoneNumber: z.string() });

export const codigoOtpSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/),
});

export const reautenticarSenhaSchema = z.object({
  password: z.string().min(1).max(128),
});

export const confirmarTelefoneSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().regex(/^[0-9]{6}$/),
});

export const redefinirSenhaTelefoneSchema = confirmarTelefoneSchema.extend({
  newPassword: z.string().min(8).max(128),
});

export const concluirCadastroTelefoneSchema = confirmarTelefoneSchema
  .extend({
    name: z.string().trim().min(2).max(120),
    password: z.string().min(8).max(128),
    passwordConfirmation: z.string().min(8).max(128),
  })
  .refine((dados) => dados.password === dados.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não coincidem.",
  });
