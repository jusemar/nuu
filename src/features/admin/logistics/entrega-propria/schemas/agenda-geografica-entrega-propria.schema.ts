import { z } from "zod";

/** Aceita somente datas reais no formato AAAA-MM-DD (ex.: rejeita 2026-02-30). */
export function dataIsoValida(texto: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const data = new Date(`${texto}T00:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(texto);
}

/** Identifica um destino da Agenda Geográfica (Cidade/Região/Bairro/CEP). */
export const destinoAgendaGeograficaEntregaPropriaSchema = z.object({
  tipoDestino: z.enum(["cidade", "regiao", "bairro", "cep"]),
  destinoId: z.coerce.number().int().positive(),
});

/** Agenda define QUANDO: dias atendidos, corte e datas bloqueadas. */
export const agendaGeograficaEntregaPropriaSchema =
  destinoAgendaGeograficaEntregaPropriaSchema.extend({
    diasAtendidos: z
      .array(z.coerce.number().int().min(0).max(6))
      .min(1, "Selecione ao menos um dia de atendimento."),
    horarioCorte: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Informe um horário de corte válido.",
      ),
    datasBloqueadas: z
      .array(
        z
          .string()
          .refine(
            dataIsoValida,
            "Informe datas bloqueadas válidas (AAAA-MM-DD).",
          ),
      )
      .default([]),
  });

export type AgendaGeograficaEntregaPropriaInput = z.infer<
  typeof agendaGeograficaEntregaPropriaSchema
>;

/** Converte "2026-12-25, 2027-01-01" em lista de datas ISO. */
export function separarDatasBloqueadas(texto: string) {
  return texto
    .split(/[\s,;]+/)
    .map((data) => data.trim())
    .filter(Boolean);
}

/**
 * Formulário da Agenda Geográfica (client). As datas bloqueadas são digitadas
 * como texto; a action revalida tudo com `agendaGeograficaEntregaPropriaSchema`.
 */
export const formularioAgendaGeograficaEntregaPropriaSchema = z.object({
  diasAtendidos: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Selecione ao menos um dia de atendimento."),
  horarioCorte: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
  bloqueiosTexto: z
    .string()
    .refine(
      (texto) => separarDatasBloqueadas(texto).every(dataIsoValida),
      "Use o formato AAAA-MM-DD, separando as datas por vírgula.",
    ),
});

export type FormularioAgendaGeograficaEntregaPropria = z.infer<
  typeof formularioAgendaGeograficaEntregaPropriaSchema
>;
