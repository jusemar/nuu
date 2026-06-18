import { pgEnum } from "drizzle-orm/pg-core";

export const fornecedorTipoIntegracaoEnum = pgEnum(
  "fornecedor_tipo_integracao",
  ["arquivo_excel", "api"],
);

export const fornecedorStatusEnum = pgEnum("fornecedor_status", [
  "ativo",
  "inativo",
  "pendente",
]);

export const importacaoFornecedorTipoArquivoEnum = pgEnum(
  "importacao_fornecedor_tipo_arquivo",
  ["arquivo_excel", "api"],
);

export const importacaoFornecedorStatusEnum = pgEnum(
  "importacao_fornecedor_status",
  ["pendente", "em_staging", "em_homologacao", "aprovada", "rejeitada", "erro"],
);

export const fornecedorProdutoStagingStatusEnum = pgEnum(
  "fornecedor_produto_staging_status",
  [
    "aguardando_analise",
    "localizado",
    "nao_localizado",
    "erro",
    "rejeitado",
    "aprovado",
  ],
);

export const fornecedorProdutoVinculoTipoEnum = pgEnum(
  "fornecedor_produto_vinculo_tipo",
  ["manual", "automatico"],
);

export const fornecedorProdutoVinculoStatusEnum = pgEnum(
  "fornecedor_produto_vinculo_status",
  ["ativo", "inativo"],
);

export const importacaoFornecedorAjusteTipoEnum = pgEnum(
  "importacao_fornecedor_ajuste_tipo",
  ["percentual", "valor_fixo"],
);

export const importacaoFornecedorAjusteEscopoEnum = pgEnum(
  "importacao_fornecedor_ajuste_escopo",
  ["global", "categoria", "produto"],
);

export const importacaoFornecedorAjusteStatusEnum = pgEnum(
  "importacao_fornecedor_ajuste_status",
  ["ativo", "inativo"],
);

export const fornecedorPrecoOrigemAjusteEnum = pgEnum(
  "fornecedor_preco_origem_ajuste",
  ["global", "categoria", "produto", "nenhum"],
);

export const fornecedorMapeamentoColunaDestinoEnum = pgEnum(
  "fornecedor_mapeamento_coluna_destino",
  [
    "codigo_fornecedor",
    "nome_produto",
    "categoria_fornecedor",
    "marca_fornecedor",
    "preco_fornecedor",
    "estoque_fornecedor",
  ],
);

export const fornecedorIntegracaoApiProvedorEnum = pgEnum(
  "fornecedor_integracao_api_provedor",
  ["laquila"],
);

export const fornecedorIntegracaoApiAmbienteEnum = pgEnum(
  "fornecedor_integracao_api_ambiente",
  ["homologacao", "producao"],
);

export const fornecedorIntegracaoApiTesteStatusEnum = pgEnum(
  "fornecedor_integracao_api_teste_status",
  ["nao_testado", "sucesso", "erro"],
);

export const fornecedorIntegracaoLogStatusEnum = pgEnum(
  "fornecedor_integracao_log_status",
  ["sucesso", "erro"],
);

export const fornecedorProdutoApiStagingStatusEnum = pgEnum(
  "fornecedor_produto_api_staging_status",
  ["novo", "vinculado", "atencao", "ignorado"],
);
