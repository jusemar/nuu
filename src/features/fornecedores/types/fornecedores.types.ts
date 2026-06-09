import type {
  Fornecedor,
  FornecedorProdutoStaging,
  FornecedorProdutoVinculo,
  ImportacaoFornecedor,
  ImportacaoFornecedorAjuste,
  NovaImportacaoFornecedor,
  NovaImportacaoFornecedorAjuste,
  NovoFornecedor,
  NovoFornecedorProdutoStaging,
  NovoFornecedorProdutoVinculo,
} from "@/db/schema";

export type TipoIntegracaoFornecedor = "arquivo_excel" | "api";

export type StatusFornecedor = "ativo" | "inativo" | "pendente";

export type TipoArquivoImportacaoFornecedor = "arquivo_excel" | "api";

export type StatusImportacaoFornecedor =
  | "pendente"
  | "em_staging"
  | "em_homologacao"
  | "aprovada"
  | "rejeitada"
  | "erro";

export type StatusFornecedorProdutoStaging =
  | "aguardando_analise"
  | "localizado"
  | "nao_localizado"
  | "erro"
  | "rejeitado"
  | "aprovado";

export type TipoVinculoProdutoFornecedor = "manual" | "automatico";

export type StatusVinculoProdutoFornecedor = "ativo" | "inativo";

export type TipoAjustePrecoFornecedor = "percentual" | "valor_fixo";

export type EscopoAjustePrecoFornecedor = "global" | "categoria" | "produto";

export type StatusAjustePrecoFornecedor = "ativo" | "inativo";

export type OrigemAjustePrecoFornecedor =
  | "global"
  | "categoria"
  | "produto"
  | "nenhum";

export type DadosFornecedor = Fornecedor;
export type NovoDadosFornecedor = NovoFornecedor;

export type DadosImportacaoFornecedor = ImportacaoFornecedor;
export type NovaDadosImportacaoFornecedor = NovaImportacaoFornecedor;

export type DadosFornecedorProdutoStaging = FornecedorProdutoStaging;
export type NovoDadosFornecedorProdutoStaging = NovoFornecedorProdutoStaging;

export type DadosFornecedorProdutoVinculo = FornecedorProdutoVinculo;
export type NovoDadosFornecedorProdutoVinculo = NovoFornecedorProdutoVinculo;

export type DadosImportacaoFornecedorAjuste = ImportacaoFornecedorAjuste;
export type NovaDadosImportacaoFornecedorAjuste =
  NovaImportacaoFornecedorAjuste;

export type FornecedorComResumoImportacoes = DadosFornecedor & {
  totalImportacoes: number;
  ultimaImportacaoEm: Date | null;
};

export type CampoLinhaImportacaoFornecedor =
  | "linha"
  | "codigoFornecedor"
  | "nomeProduto"
  | "precoFornecedor"
  | "estoqueFornecedor";

export type CodigoErroImportacaoFornecedor =
  | "linha_vazia"
  | "produto_sem_nome"
  | "produto_sem_codigo"
  | "preco_invalido"
  | "estoque_invalido";

export type ErroImportacaoFornecedor = {
  codigo: CodigoErroImportacaoFornecedor;
  mensagem: string;
  campo?: CampoLinhaImportacaoFornecedor;
};

export type LinhaPlanilhaFornecedor = {
  numeroLinha: number;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  precoFornecedorOriginal: string | null;
  estoqueFornecedorOriginal: string | null;
  linhaVazia: boolean;
};

export type LinhaStagingFornecedorPreparada = {
  numeroLinha: number;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  precoFornecedor: string | null;
  estoqueFornecedor: number | null;
  status: StatusFornecedorProdutoStaging;
  errosValidacao: ErroImportacaoFornecedor[];
};

export type ResultadoParserFornecedor = {
  nomeAba: string;
  linhas: LinhaPlanilhaFornecedor[];
};

export type ResultadoImportacaoFornecedor = {
  importacaoId: string;
  totalImportado: number;
  totalValido: number;
  totalErros: number;
  totalEncontrados?: number;
  totalNaoEncontrados?: number;
};

export type StagingFornecedorComImportacao = DadosFornecedorProdutoStaging & {
  nomeFornecedor: string;
};

export type CriterioLocalizacaoProdutoFornecedor =
  | "vinculo_fornecedor"
  | "codigo_fornecedor_sku"
  | "nao_localizado";

export type ProdutoLocalizadoFornecedor = {
  codigoFornecedor: string;
  produtoId: string;
  sku: string;
};

export type ResultadoLocalizacaoProdutosFornecedor = {
  encontradosPorCodigo: Map<string, ProdutoLocalizadoFornecedor>;
  codigosNaoLocalizados: string[];
};

export type ResultadoLocalizacaoPorVinculoFornecedor = {
  encontradosPorCodigo: Map<string, ProdutoLocalizadoFornecedor>;
  codigosSemVinculo: string[];
};

export type ResumoConferenciaFornecedor = {
  totalImportado: number;
  totalEncontrados: number;
  totalNaoEncontrados: number;
  totalErros: number;
};

export type ResultadoAnaliseProdutosImportados = ResumoConferenciaFornecedor & {
  importacaoId: string;
};

export type ResultadoVinculacaoProdutoFornecedor = {
  vinculoId: string;
  stagingId: string;
  fornecedorId: string;
  codigoFornecedor: string;
  produtoId: string;
};

export type ProdutoParaVinculoFornecedor = {
  id: string;
  nome: string;
  sku: string;
  slug: string;
};

export type AjustePrecoImportacaoFornecedor = {
  id: string;
  importacaoId: string;
  tipoAjuste: TipoAjustePrecoFornecedor;
  escopoAjuste: EscopoAjustePrecoFornecedor;
  valorAjuste: string;
  categoriaFornecedor: string | null;
  produtoStagingId: string | null;
  status: StatusAjustePrecoFornecedor;
};

export type EntradaAjustePrecoImportacaoFornecedor = {
  importacaoId: string;
  tipoAjuste: TipoAjustePrecoFornecedor;
  escopoAjuste: EscopoAjustePrecoFornecedor;
  valorAjuste: string;
  categoriaFornecedor?: string | null;
  produtoStagingId?: string | null;
};

export type ResultadoCalculoAjustePrecoFornecedor = {
  stagingId: string;
  precoOriginal: string | null;
  precoCalculado: string | null;
  origemAjuste: OrigemAjustePrecoFornecedor;
};

export type ResumoAjustesPrecoFornecedor = {
  importacaoId: string;
  totalProcessados: number;
  totalComAjuste: number;
  totalSemPreco: number;
};

export type SituacaoPreviewSincronizacaoFornecedor =
  | "pronto_para_sincronizar"
  | "pendente_vinculacao"
  | "bloqueado";

export type ItemPreviewSincronizacaoFornecedor = {
  stagingId: string;
  codigoFornecedor: string | null;
  nomeProdutoFornecedor: string;
  produtoVinculadoId: string | null;
  produtoVinculadoNome: string | null;
  sku: string | null;
  precoFornecedor: string | null;
  precoCalculado: string | null;
  precoAtualLoja: string | null;
  diferencaPreco: string | null;
  estoqueFornecedor: number | null;
  situacao: SituacaoPreviewSincronizacaoFornecedor;
  erro: string | null;
};

export type ResumoPreviewSincronizacaoFornecedor = {
  totalImportado: number;
  totalProntosParaSincronizar: number;
  totalPendentesVinculacao: number;
  totalComErro: number;
};

export type PreviewSincronizacaoFornecedor = {
  importacaoId: string;
  resumo: ResumoPreviewSincronizacaoFornecedor;
  itens: ItemPreviewSincronizacaoFornecedor[];
};
