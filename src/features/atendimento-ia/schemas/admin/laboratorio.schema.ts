import { z } from "zod";

import {
  FORMAS_EXECUCAO_LABORATORIO_ADMIN,
  MODOS_TESTE_ADMIN,
  PORTES_EXECUCAO_LABORATORIO_ADMIN,
} from "../../constants/admin/estados";

export const candidatoLaboratorioAdminSchema = z
  .object({
    identificador: z.string().uuid(),
    tipo: z.enum(["conhecimento", "comportamento", "lote"]),
    versao: z.number().int().positive(),
  })
  .strict();

const fonteDadosLaboratorioSchema = z.discriminatedUnion("tipo", [
  z
    .object({
      dados: z.record(z.string(), z.unknown()),
      tipo: z.literal("ficticios"),
    })
    .strict(),
  z
    .object({
      autorizado: z.literal(true),
      dados: z.record(z.string(), z.unknown()),
      justificativa: z.string().trim().min(20).max(1_000),
      metodoAnonimizacao: z.string().trim().min(10).max(500),
      tipo: z.literal("snapshot_irreversivelmente_anonimizado"),
    })
    .strict(),
]);

export const execucaoLaboratorioAdminSchema = z
  .object({
    candidatos: z.array(candidatoLaboratorioAdminSchema).min(1).max(3),
    efeitosReais: z.literal("proibidos"),
    fonteDados: fonteDadosLaboratorioSchema,
    formaExecucao: z.enum(FORMAS_EXECUCAO_LABORATORIO_ADMIN),
    modoTeste: z.enum(MODOS_TESTE_ADMIN),
    porte: z.enum(PORTES_EXECUCAO_LABORATORIO_ADMIN),
  })
  .strict()
  .superRefine((dados, contexto) => {
    const chaves = dados.candidatos.map(
      (candidato) =>
        `${candidato.tipo}:${candidato.identificador}:${candidato.versao}`,
    );
    if (new Set(chaves).size !== chaves.length) {
      contexto.addIssue({
        code: "custom",
        message: "Candidatos duplicados não são permitidos.",
        path: ["candidatos"],
      });
    }
    if (dados.modoTeste === "individual" && dados.candidatos.length !== 1) {
      contexto.addIssue({
        code: "custom",
        message: "O teste individual exige exatamente um candidato.",
        path: ["candidatos"],
      });
    }
    if (dados.modoTeste === "combinado" && dados.candidatos.length < 2) {
      contexto.addIssue({
        code: "custom",
        message: "O teste combinado exige ao menos dois candidatos.",
        path: ["candidatos"],
      });
    }
    const sincronaPermitida =
      dados.porte === "individual" || dados.porte === "pequeno";
    if (dados.formaExecucao === "sincrona" && !sincronaPermitida) {
      contexto.addIssue({
        code: "custom",
        message: "Conjuntos maiores e regressões devem ser assíncronos.",
        path: ["formaExecucao"],
      });
    }
    if (dados.formaExecucao === "assincrona" && sincronaPermitida) {
      contexto.addIssue({
        code: "custom",
        message: "Testes individuais e pequenos usam execução síncrona.",
        path: ["formaExecucao"],
      });
    }
  });

export const TIPOS_COMPARACAO_LABORATORIO = [
  "conhecimento",
  "comportamento",
  "combinado",
  "lote",
] as const;
export const executarLaboratorioSchema = z
  .object({
    chaveIdempotencia: z.string().uuid(),
    tipoComparacao: z.enum(TIPOS_COMPARACAO_LABORATORIO),
    casoTesteVersaoId: z.string().uuid().optional(),
    conjuntoTesteId: z.string().uuid().optional(),
    versaoCandidataConhecimentoId: z.string().uuid().optional(),
    versaoCandidataComportamentoId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((d, c) => {
    if (Boolean(d.casoTesteVersaoId) === Boolean(d.conjuntoTesteId))
      c.addIssue({
        code: "custom",
        path: ["casoTesteVersaoId"],
        message: "Selecione exatamente um caso ou conjunto.",
      });
    if (
      ["conhecimento", "combinado", "lote"].includes(d.tipoComparacao) &&
      !d.versaoCandidataConhecimentoId
    )
      c.addIssue({
        code: "custom",
        path: ["versaoCandidataConhecimentoId"],
        message: "Conhecimento candidato obrigatório.",
      });
    if (
      ["comportamento", "combinado", "lote"].includes(d.tipoComparacao) &&
      !d.versaoCandidataComportamentoId
    )
      c.addIssue({
        code: "custom",
        path: ["versaoCandidataComportamentoId"],
        message: "Comportamento candidato obrigatório.",
      });
  });
export const cancelarRegressaoSchema = z
  .object({ execucaoId: z.string().uuid() })
  .strict();
export const retomarRegressaoSchema = z
  .object({
    execucaoId: z.string().uuid(),
    chaveIdempotencia: z.string().uuid(),
  })
  .strict();
export const avaliarResultadoLaboratorioSchema = z
  .object({
    resultadoId: z.string().uuid(),
    decisao: z.enum(["aprovado", "reprovado", "inconclusivo", "bloqueado"]),
    comentario: z.string().trim().max(2_000).nullable().default(null),
    atualizadoEmEsperado: z.coerce.date(),
  })
  .strict();
