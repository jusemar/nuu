import { z } from "zod";

const esquemaIdentificador = z.string().trim().min(1);
const esquemaLimiteOpcional = z.number().int().positive().nullable().optional();

export const esquemaEfeitoRegraDisponibilidadeFrete = z.enum([
  "permitir",
  "bloquear",
]);

export const esquemaLimitesGlobaisFrete = z.object({
  pesoMaximoEmGramas: esquemaLimiteOpcional,
  alturaMaximaEmCm: esquemaLimiteOpcional,
  larguraMaximaEmCm: esquemaLimiteOpcional,
  comprimentoMaximoEmCm: esquemaLimiteOpcional,
});

export const esquemaProvedorDisponibilidadeFrete = z.object({
  identificador: esquemaIdentificador,
  ativo: z.boolean(),
});

export const esquemaTransportadoraDisponibilidadeFrete =
  esquemaLimitesGlobaisFrete.extend({
    identificador: esquemaIdentificador,
    nome: z.string().trim().min(1),
    provedorIdentificador: esquemaIdentificador,
    ativo: z.boolean(),
  });

export const esquemaServicoDisponibilidadeFrete =
  esquemaLimitesGlobaisFrete.extend({
    identificador: esquemaIdentificador,
    provedorIdentificador: esquemaIdentificador,
    transportadoraIdentificador: esquemaIdentificador.nullable().optional(),
    ativo: z.boolean(),
  });

export const esquemaRegraDisponibilidadeFrete = z.object({
  efeito: esquemaEfeitoRegraDisponibilidadeFrete,
  provedorIdentificador: esquemaIdentificador.nullable().optional(),
  transportadoraIdentificador: esquemaIdentificador.nullable().optional(),
  servicoIdentificador: esquemaIdentificador.nullable().optional(),
  ativo: z.boolean().optional(),
});

export const esquemaRegraCategoriaDisponibilidadeFrete =
  esquemaRegraDisponibilidadeFrete.extend({
    categoriaId: esquemaIdentificador,
  });

export const esquemaRegraProdutoDisponibilidadeFrete =
  esquemaRegraDisponibilidadeFrete.extend({
    produtoId: esquemaIdentificador,
  });

export const esquemaRegraTipoLogisticoDisponibilidadeFrete =
  esquemaRegraDisponibilidadeFrete.extend({
    tipoLogisticoIdentificador: esquemaIdentificador,
  });
