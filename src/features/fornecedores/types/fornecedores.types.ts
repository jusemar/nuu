import type {
  Fornecedor,
  FornecedorMapeamentoColuna,
  FornecedorProdutoStaging,
  FornecedorProdutoVinculo,
  ImportacaoFornecedor,
  ImportacaoFornecedorAjuste,
  NovaImportacaoFornecedor,
  NovaImportacaoFornecedorAjuste,
  NovoFornecedor,
  NovoFornecedorMapeamentoColuna,
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

export type CampoMapeamentoColunaFornecedor =
  | "codigo_fornecedor"
  | "nome_produto"
  | "categoria_fornecedor"
  | "marca_fornecedor"
  | "preco_fornecedor"
  | "estoque_fornecedor";

export type OrigemMapeamentoColunaFornecedor =
  | "salvo"
  | "confirmado"
  | "automatico";

export type SituacaoMapeamentoColunaFornecedor =
  | "detectado_automaticamente"
  | "vindo_do_mapeamento_salvo"
  | "pendente"
  | "conflito";

export type DadosFornecedor = Fornecedor;
export type NovoDadosFornecedor = NovoFornecedor;

export type DadosImportacaoFornecedor = ImportacaoFornecedor;
export type NovaDadosImportacaoFornecedor = NovaImportacaoFornecedor;

export type DadosFornecedorProdutoStaging = FornecedorProdutoStaging;
export type NovoDadosFornecedorProdutoStaging = NovoFornecedorProdutoStaging;

export type DadosFornecedorProdutoVinculo = FornecedorProdutoVinculo;
export type NovoDadosFornecedorProdutoVinculo = NovoFornecedorProdutoVinculo;

export type DadosFornecedorMapeamentoColuna = FornecedorMapeamentoColuna;
export type NovoDadosFornecedorMapeamentoColuna =
  NovoFornecedorMapeamentoColuna;

export type DadosImportacaoFornecedorAjuste = ImportacaoFornecedorAjuste;
export type NovaDadosImportacaoFornecedorAjuste =
  NovaImportacaoFornecedorAjuste;

export type FornecedorComResumoImportacoes = DadosFornecedor & {
  totalImportacoes: number;
  ultimaImportacaoEm: Date | null;
  ultimaImportacaoStatus: StatusImportacaoFornecedor | null;
  integracaoApi: {
    id: string;
    fornecedorId: string;
    provedor: "laquila";
    ambiente: "homologacao" | "producao";
    urlBase: string | null;
    cnpjEmpresa: string;
    ativo: boolean;
    tokenConfigurado: boolean;
    ultimoTesteStatus: "nao_testado" | "sucesso" | "erro";
    ultimoTesteEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  } | null;
};

export type CampoLinhaImportacaoFornecedor =
  | "linha"
  | "codigoFornecedor"
  | "categoriaFornecedor"
  | "nomeProduto"
  | "marcaFornecedor"
  | "precoFornecedor"
  | "estoqueFornecedor";

export type CodigoErroImportacaoFornecedor =
  | "linha_vazia"
  | "produto_sem_nome"
  | "produto_sem_codigo"
  | "mapeamento_pendente"
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
  marcaFornecedor: string | null;
  precoFornecedorOriginal: string | null;
  estoqueFornecedorOriginal: string | null;
  linhaVazia: boolean;
  dadosBrutos: Record<string, string | number | boolean | Date | null>;
};

export type LinhaStagingFornecedorPreparada = {
  numeroLinha: number;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
  precoFornecedor: string | null;
  estoqueFornecedor: number | null;
  status: StatusFornecedorProdutoStaging;
  errosValidacao: ErroImportacaoFornecedor[];
  dadosBrutos: Record<string, string | number | boolean | Date | null>;
};

export type ResultadoParserFornecedor = {
  nomeAba: string;
  colunas: ColunaPlanilhaFornecedor[];
  mapeamentoColunas: ResultadoDeteccaoColunaFornecedor[];
  linhas: LinhaPlanilhaFornecedor[];
};

export type ColunaPlanilhaFornecedor = {
  indice: number;
  nomeOriginal: string;
  nomeNormalizado: string;
};

export type MapeamentoColunaFornecedor = {
  nomeColunaOrigem: string;
  campoDestino: CampoMapeamentoColunaFornecedor;
};

export type ResultadoDeteccaoColunaFornecedor = {
  nomeColunaOrigem: string;
  nomeColunaNormalizada: string;
  campoDestino: CampoMapeamentoColunaFornecedor | null;
  origem: OrigemMapeamentoColunaFornecedor | null;
  situacao: SituacaoMapeamentoColunaFornecedor;
};

export type EntradaSalvarMapeamentoColunasFornecedor = {
  fornecedorId: string;
  mapeamentos: MapeamentoColunaFornecedor[];
};

export type ResultadoSalvarMapeamentoColunasFornecedor = {
  fornecedorId: string;
  totalSalvos: number;
};

export type EntradaAplicarMapeamentoImportacaoFornecedor = {
  importacaoId: string;
  mapeamentos?: MapeamentoColunaFornecedor[];
  salvarParaFornecedor?: boolean;
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
  | "vinculo_manual_fornecedor"
  | "sem_codigo_fornecedor"
  | "novo_produto_fornecedor"
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

export type CampoProblemaRevisaoFornecedor =
  | "codigoFornecedor"
  | "categoriaFornecedor"
  | "nomeProduto"
  | "marcaFornecedor"
  | "precoFornecedor";

export type CodigoProblemaRevisaoFornecedor =
  | "sem_codigo"
  | "sem_categoria"
  | "sem_nome"
  | "sem_marca"
  | "preco_invalido";

export type ProblemaRevisaoFornecedor = {
  codigo: CodigoProblemaRevisaoFornecedor;
  mensagem: string;
  campo: CampoProblemaRevisaoFornecedor;
};

export type StatusRevisaoFornecedor = "com_problema";

export type ItemRevisaoImportacaoFornecedor = {
  stagingId: string;
  codigoFornecedor: string | null;
  sku: string | null;
  nomeProduto: string | null;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
  precoFornecedor: string | null;
  problemas: ProblemaRevisaoFornecedor[];
  status: StatusRevisaoFornecedor;
};

export type ResumoRevisaoImportacaoFornecedor = {
  totalImportado: number;
  totalSemCodigo: number;
  totalSemCategoria: number;
  totalSemNome: number;
  totalSemMarca: number;
  totalPrecoInvalido: number;
  totalProdutosOK: number;
  totalComProblema: number;
};

export type ResultadoRevisaoImportacaoFornecedor = {
  importacaoId: string;
  resumo: ResumoRevisaoImportacaoFornecedor;
  itens: ItemRevisaoImportacaoFornecedor[];
};

export type EscopoCorrecaoRevisaoFornecedor = "categoria" | "marca" | "nome";

export type EntradaCorrecaoRevisaoImportacaoFornecedor = {
  importacaoId: string;
  stagingIds: string[];
  escopo: EscopoCorrecaoRevisaoFornecedor;
  categoriaId?: string;
  marcaId?: string;
  nomeProduto?: string;
};

export type ResultadoCorrecaoRevisaoImportacaoFornecedor = {
  importacaoId: string;
  totalAtualizados: number;
};

export type ResultadoVinculacaoProdutoFornecedor = {
  vinculoId: string;
  stagingId: string;
  importacaoId: string;
  fornecedorId: string;
  codigoFornecedor: string;
  produtoId: string;
};

export type ProdutoParaVinculoFornecedor = {
  id: string;
  nome: string;
  sku: string;
  slug: string;
  marca: string | null;
};

export type ProdutoVinculadoFornecedorAdmin = {
  id: string;
  fornecedorId: string;
  produtoId: string;
  produtoNome: string;
  produtoSku: string;
  produtoMarca: string | null;
  codigoFornecedor: string | null;
  tipoVinculo: TipoVinculoProdutoFornecedor;
  status: StatusVinculoProdutoFornecedor;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type EntradaSalvarVinculoProdutoFornecedorManual = {
  id?: string;
  fornecedorId: string;
  produtoId: string;
  codigoFornecedor?: string | null;
  status?: StatusVinculoProdutoFornecedor;
};

export type ResultadoSalvarVinculoProdutoFornecedorManual = {
  vinculoId: string;
  fornecedorId: string;
  produtoId: string;
  codigoFornecedor: string | null;
  status: StatusVinculoProdutoFornecedor;
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
