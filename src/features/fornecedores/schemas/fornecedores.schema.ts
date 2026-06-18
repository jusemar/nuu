import { z } from "zod";

export const tiposIntegracaoFornecedor = ["arquivo_excel", "api"] as const;
export const statusFornecedor = ["ativo", "inativo", "pendente"] as const;
export const tiposArquivoImportacaoFornecedor = [
  "arquivo_excel",
  "api",
] as const;
export const statusImportacaoFornecedor = [
  "pendente",
  "em_staging",
  "em_homologacao",
  "aprovada",
  "rejeitada",
  "erro",
] as const;
export const statusFornecedorProdutoStaging = [
  "aguardando_analise",
  "localizado",
  "nao_localizado",
  "erro",
  "rejeitado",
  "aprovado",
] as const;
export const tiposVinculoProdutoFornecedor = ["manual", "automatico"] as const;
export const statusVinculoProdutoFornecedor = ["ativo", "inativo"] as const;
export const tiposAjustePrecoFornecedor = ["percentual", "valor_fixo"] as const;
export const escoposAjustePrecoFornecedor = [
  "global",
  "categoria",
  "produto",
] as const;
export const statusAjustePrecoFornecedor = ["ativo", "inativo"] as const;
export const origensAjustePrecoFornecedor = [
  "global",
  "categoria",
  "produto",
  "nenhum",
] as const;
export const situacoesPreviewSincronizacaoFornecedor = [
  "pronto_para_sincronizar",
  "pendente_vinculacao",
  "bloqueado",
] as const;
export const camposProblemaRevisaoFornecedor = [
  "codigoFornecedor",
  "categoriaFornecedor",
  "nomeProduto",
  "marcaFornecedor",
  "precoFornecedor",
] as const;
export const camposMapeamentoColunasFornecedor = [
  "codigo_fornecedor",
  "nome_produto",
  "categoria_fornecedor",
  "marca_fornecedor",
  "preco_fornecedor",
  "estoque_fornecedor",
] as const;

export const fornecedorSchema = z.object({
  id: z.uuid().optional(),
  nome: z.string().trim().min(2).max(160),
  tipoIntegracao: z.enum(tiposIntegracaoFornecedor),
  status: z.enum(statusFornecedor).default("pendente"),
});

export const importacaoFornecedorSchema = z.object({
  id: z.uuid().optional(),
  fornecedorId: z.uuid(),
  tipoArquivo: z.enum(tiposArquivoImportacaoFornecedor),
  status: z.enum(statusImportacaoFornecedor).default("pendente"),
  nomeArquivo: z.string().trim().max(255).nullable().optional(),
  totalLinhas: z.number().int().nonnegative().default(0),
  totalProcessadas: z.number().int().nonnegative().default(0),
  totalErros: z.number().int().nonnegative().default(0),
});

export const fornecedorProdutoStagingSchema = z.object({
  id: z.uuid().optional(),
  importacaoId: z.uuid(),
  codigoFornecedor: z.string().trim().max(120).nullable().optional(),
  nomeProduto: z.string().trim().max(255),
  categoriaFornecedor: z.string().trim().max(180).nullable().optional(),
  marcaFornecedor: z.string().trim().max(180).nullable().optional(),
  produtoLocalizadoId: z.uuid().nullable().optional(),
  criterioLocalizacao: z.string().trim().max(80).nullable().optional(),
  precoOriginal: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  precoCalculado: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  origemAjuste: z.enum(origensAjustePrecoFornecedor).default("nenhum"),
  precoFornecedor: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  estoqueFornecedor: z.number().int().nonnegative().nullable().optional(),
  errosValidacao: z
    .array(
      z.object({
        codigo: z.string(),
        mensagem: z.string(),
        campo: z.string().optional(),
      }),
    )
    .default([]),
  status: z.enum(statusFornecedorProdutoStaging).default("aguardando_analise"),
});

export const arquivoImportacaoFornecedorSchema = z.object({
  nome: z.string().trim().min(1).max(255),
  tamanho: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  extensao: z.enum(["xlsx", "xls", "csv"]),
});

export const analiseImportacaoFornecedorSchema = z.object({
  importacaoId: z.uuid(),
});

export const problemaRevisaoImportacaoFornecedorSchema = z.object({
  codigo: z.enum([
    "sem_codigo",
    "sem_categoria",
    "sem_nome",
    "sem_marca",
    "preco_invalido",
  ]),
  mensagem: z.string().min(1).max(255),
  campo: z.enum(camposProblemaRevisaoFornecedor),
});

export const itemRevisaoImportacaoFornecedorSchema = z.object({
  stagingId: z.uuid(),
  codigoFornecedor: z.string().nullable(),
  sku: z.string().nullable(),
  nomeProduto: z.string().nullable(),
  categoriaFornecedor: z.string().nullable(),
  marcaFornecedor: z.string().nullable(),
  precoFornecedor: z.string().nullable(),
  problemas: z.array(problemaRevisaoImportacaoFornecedorSchema),
  status: z.literal("com_problema"),
});

export const resumoRevisaoImportacaoFornecedorSchema = z.object({
  totalImportado: z.number().int().nonnegative(),
  totalSemCodigo: z.number().int().nonnegative(),
  totalSemCategoria: z.number().int().nonnegative(),
  totalSemNome: z.number().int().nonnegative(),
  totalSemMarca: z.number().int().nonnegative(),
  totalPrecoInvalido: z.number().int().nonnegative(),
  totalProdutosOK: z.number().int().nonnegative(),
  totalComProblema: z.number().int().nonnegative(),
});

export const analiseRevisaoImportacaoFornecedorSchema = z.object({
  importacaoId: z.uuid(),
});

export const correcaoRevisaoImportacaoFornecedorSchema = z
  .object({
    importacaoId: z.uuid(),
    stagingIds: z.array(z.uuid()).min(1),
    escopo: z.enum(["categoria", "marca", "nome"]),
    categoriaId: z.uuid().optional(),
    marcaId: z.uuid().optional(),
    nomeProduto: z.string().trim().min(1).max(255).optional(),
  })
  .superRefine((dados, contexto) => {
    if (dados.escopo === "categoria" && !dados.categoriaId) {
      contexto.addIssue({
        code: "custom",
        path: ["categoriaId"],
        message: "Categoria é obrigatória.",
      });
    }

    if (dados.escopo === "marca" && !dados.marcaId) {
      contexto.addIssue({
        code: "custom",
        path: ["marcaId"],
        message: "Marca é obrigatória.",
      });
    }

    if (dados.escopo === "nome" && !dados.nomeProduto) {
      contexto.addIssue({
        code: "custom",
        path: ["nomeProduto"],
        message: "Nome do produto é obrigatório.",
      });
    }
  });

export const vinculoProdutoFornecedorSchema = z.object({
  id: z.uuid().optional(),
  fornecedorId: z.uuid(),
  codigoFornecedor: z.string().trim().max(120).nullable().optional(),
  produtoId: z.uuid(),
  tipoVinculo: z.enum(tiposVinculoProdutoFornecedor).default("manual"),
  status: z.enum(statusVinculoProdutoFornecedor).default("ativo"),
});

export const salvarVinculoProdutoFornecedorManualSchema = z.object({
  id: z.uuid().optional(),
  fornecedorId: z.uuid(),
  produtoId: z.uuid(),
  codigoFornecedor: z.string().trim().max(120).nullable().optional(),
  status: z.enum(statusVinculoProdutoFornecedor).default("ativo"),
});

export const alterarStatusVinculoProdutoFornecedorSchema = z.object({
  id: z.uuid(),
  fornecedorId: z.uuid(),
  status: z.enum(statusVinculoProdutoFornecedor),
});

export const vincularProdutoFornecedorSchema = z.object({
  stagingId: z.uuid(),
  produtoId: z.uuid(),
});

export const tratarProdutosFornecedorComoNovosSchema = z.object({
  importacaoId: z.uuid(),
  stagingIds: z.array(z.uuid()).min(1),
});

export const buscaProdutoVinculoFornecedorSchema = z.object({
  busca: z.string().trim().min(1).max(120).optional().default(""),
  limite: z.number().int().positive().max(50).optional().default(20),
});

export const ajustePrecoImportacaoFornecedorSchema = z
  .object({
    id: z.uuid().optional(),
    importacaoId: z.uuid(),
    tipoAjuste: z.enum(tiposAjustePrecoFornecedor),
    escopoAjuste: z.enum(escoposAjustePrecoFornecedor),
    valorAjuste: z
      .string()
      .trim()
      .regex(/^-?\d+([,.]\d{1,4})?$/),
    categoriaFornecedor: z.string().trim().max(180).nullable().optional(),
    produtoStagingId: z.uuid().nullable().optional(),
    status: z.enum(statusAjustePrecoFornecedor).default("ativo"),
  })
  .superRefine((dados, contexto) => {
    if (dados.escopoAjuste === "categoria" && !dados.categoriaFornecedor) {
      contexto.addIssue({
        code: "custom",
        path: ["categoriaFornecedor"],
        message: "Categoria do fornecedor é obrigatória.",
      });
    }

    if (dados.escopoAjuste === "produto" && !dados.produtoStagingId) {
      contexto.addIssue({
        code: "custom",
        path: ["produtoStagingId"],
        message: "Produto importado é obrigatório.",
      });
    }
  });

export const calcularAjustesImportacaoFornecedorSchema = z.object({
  importacaoId: z.uuid(),
});

export const previewSincronizacaoFornecedorSchema = z.object({
  importacaoId: z.uuid(),
});

export const itemPreviewSincronizacaoFornecedorSchema = z.object({
  stagingId: z.uuid(),
  codigoFornecedor: z.string().nullable(),
  nomeProdutoFornecedor: z.string(),
  produtoVinculadoId: z.uuid().nullable(),
  produtoVinculadoNome: z.string().nullable(),
  sku: z.string().nullable(),
  precoFornecedor: z.string().nullable(),
  precoCalculado: z.string().nullable(),
  precoAtualLoja: z.string().nullable(),
  diferencaPreco: z.string().nullable(),
  estoqueFornecedor: z.number().int().nullable(),
  situacao: z.enum(situacoesPreviewSincronizacaoFornecedor),
  erro: z.string().nullable(),
});

export const mapeamentoColunaFornecedorSchema = z.object({
  nomeColunaOrigem: z.string().trim().min(1).max(255),
  campoDestino: z.enum(camposMapeamentoColunasFornecedor),
});

export const mapeamentoColunasFornecedorSchema = z.object({
  fornecedorId: z.uuid(),
  mapeamentos: z
    .array(mapeamentoColunaFornecedorSchema)
    .max(camposMapeamentoColunasFornecedor.length)
    .superRefine((mapeamentos, contexto) => {
      const campos = new Set<string>();

      mapeamentos.forEach((mapeamento, indice) => {
        if (campos.has(mapeamento.campoDestino)) {
          contexto.addIssue({
            code: "custom",
            path: [indice, "campoDestino"],
            message: "Campo de destino duplicado.",
          });
        }

        campos.add(mapeamento.campoDestino);
      });
    }),
});

export const aplicarMapeamentoImportacaoFornecedorSchema =
  mapeamentoColunasFornecedorSchema.omit({ fornecedorId: true }).extend({
    importacaoId: z.uuid(),
    salvarParaFornecedor: z.boolean().optional().default(false),
  });

export type FornecedorValidado = z.infer<typeof fornecedorSchema>;
export type ImportacaoFornecedorValidada = z.infer<
  typeof importacaoFornecedorSchema
>;
export type FornecedorProdutoStagingValidado = z.infer<
  typeof fornecedorProdutoStagingSchema
>;
export type ArquivoImportacaoFornecedorValidado = z.infer<
  typeof arquivoImportacaoFornecedorSchema
>;
export type AnaliseImportacaoFornecedorValidada = z.infer<
  typeof analiseImportacaoFornecedorSchema
>;
export type ProblemaRevisaoImportacaoFornecedorValidado = z.infer<
  typeof problemaRevisaoImportacaoFornecedorSchema
>;
export type ItemRevisaoImportacaoFornecedorValidado = z.infer<
  typeof itemRevisaoImportacaoFornecedorSchema
>;
export type ResumoRevisaoImportacaoFornecedorValidado = z.infer<
  typeof resumoRevisaoImportacaoFornecedorSchema
>;
export type AnaliseRevisaoImportacaoFornecedorValidada = z.infer<
  typeof analiseRevisaoImportacaoFornecedorSchema
>;
export type CorrecaoRevisaoImportacaoFornecedorValidada = z.infer<
  typeof correcaoRevisaoImportacaoFornecedorSchema
>;
export type VinculoProdutoFornecedorValidado = z.infer<
  typeof vinculoProdutoFornecedorSchema
>;
export type VincularProdutoFornecedorValidado = z.infer<
  typeof vincularProdutoFornecedorSchema
>;
export type BuscaProdutoVinculoFornecedorValidada = z.infer<
  typeof buscaProdutoVinculoFornecedorSchema
>;
export type AjustePrecoImportacaoFornecedorValidado = z.infer<
  typeof ajustePrecoImportacaoFornecedorSchema
>;
export type CalcularAjustesImportacaoFornecedorValidado = z.infer<
  typeof calcularAjustesImportacaoFornecedorSchema
>;
export type PreviewSincronizacaoFornecedorValidado = z.infer<
  typeof previewSincronizacaoFornecedorSchema
>;
export type ItemPreviewSincronizacaoFornecedorValidado = z.infer<
  typeof itemPreviewSincronizacaoFornecedorSchema
>;
export type MapeamentoColunaFornecedorValidado = z.infer<
  typeof mapeamentoColunaFornecedorSchema
>;
export type MapeamentoColunasFornecedorValidado = z.infer<
  typeof mapeamentoColunasFornecedorSchema
>;
export type AplicarMapeamentoImportacaoFornecedorValidado = z.infer<
  typeof aplicarMapeamentoImportacaoFornecedorSchema
>;
