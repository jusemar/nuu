import { VERSAO_FERRAMENTAS_PUBLICAS } from "../../constants/ferramentas-publicas";
import type { FontesFerramentasPublicas } from "../../queries/fontes-ferramentas-publicas";
import {
  argumentosBuscarProdutosPublicosSchema,
  argumentosConsultarCondicaoProdutoSchema,
  argumentosConsultarLogisticaPublicaSchema,
  argumentosConsultarProdutoPublicoSchema,
  resultadoBuscarProdutosPublicosSchema,
  resultadoConsultarEstoquePublicoSchema,
  resultadoConsultarLogisticaPublicaSchema,
  resultadoConsultarPrecosPublicosSchema,
  resultadoConsultarProdutoPublicoSchema,
  resultadoConsultarPromocoesPublicasSchema,
} from "../../schemas/ferramentas-publicas.schema";
import type {
  FerramentaPublica,
  NomeFerramentaPublica,
} from "../../types/ferramentas-publicas";

const propriedadeNullableString = {
  anyOf: [{ type: "string" }, { type: "null" }],
} as const;
const parametrosCondicaoProduto = {
  additionalProperties: false,
  properties: {
    modalidade: propriedadeNullableString,
    sku_variante: propriedadeNullableString,
    slug: { type: "string" },
  },
  required: ["modalidade", "sku_variante", "slug"],
  type: "object",
} as const;

export function criarCatalogoFerramentasPublicas(
  fontes: FontesFerramentasPublicas,
): Map<NomeFerramentaPublica, FerramentaPublica> {
  const ferramentas: FerramentaPublica[] = [
    {
      definicao: {
        description:
          "Busca até cinco produtos ativos, publicados e expostos no catálogo público da loja.",
        name: "buscar_produtos_publicos",
        parameters: {
          additionalProperties: false,
          properties: { termo: { type: "string" } },
          required: ["termo"],
          type: "object",
        },
        strict: true,
        type: "function",
      },
      executar: (argumentos) =>
        fontes.buscarProdutos(
          argumentosBuscarProdutosPublicosSchema.parse(argumentos),
        ),
      schemaArgumentos: argumentosBuscarProdutosPublicosSchema,
      schemaResultado: resultadoBuscarProdutosPublicosSchema,
      versao: VERSAO_FERRAMENTAS_PUBLICAS,
    },
    {
      definicao: {
        description:
          "Consulta os detalhes públicos oficiais de um produto publicado, inclusive suas variantes ativas.",
        name: "consultar_produto_publico",
        parameters: {
          additionalProperties: false,
          properties: { slug: { type: "string" } },
          required: ["slug"],
          type: "object",
        },
        strict: true,
        type: "function",
      },
      executar: (argumentos) =>
        fontes.consultarProduto(
          argumentosConsultarProdutoPublicoSchema.parse(argumentos),
        ),
      schemaArgumentos: argumentosConsultarProdutoPublicoSchema,
      schemaResultado: resultadoConsultarProdutoPublicoSchema,
      versao: VERSAO_FERRAMENTAS_PUBLICAS,
    },
    {
      definicao: {
        description:
          "Consulta preços efetivos públicos por modalidade ou SKU de variante usando a precificação central.",
        name: "consultar_precos_publicos",
        parameters: parametrosCondicaoProduto,
        strict: true,
        type: "function",
      },
      executar: (argumentos) =>
        fontes.consultarPrecos(
          argumentosConsultarCondicaoProdutoSchema.parse(argumentos),
        ),
      schemaArgumentos: argumentosConsultarCondicaoProdutoSchema,
      schemaResultado: resultadoConsultarPrecosPublicosSchema,
      versao: VERSAO_FERRAMENTAS_PUBLICAS,
    },
    {
      definicao: {
        description:
          "Consulta a disponibilidade pública efetiva de um produto ou variante na modalidade indicada.",
        name: "consultar_estoque_publico",
        parameters: parametrosCondicaoProduto,
        strict: true,
        type: "function",
      },
      executar: (argumentos) =>
        fontes.consultarEstoque(
          argumentosConsultarCondicaoProdutoSchema.parse(argumentos),
        ),
      schemaArgumentos: argumentosConsultarCondicaoProdutoSchema,
      schemaResultado: resultadoConsultarEstoquePublicoSchema,
      versao: VERSAO_FERRAMENTAS_PUBLICAS,
    },
    {
      definicao: {
        description:
          "Consulta promoções públicas vigentes e efetivamente aplicáveis ao produto, modalidade ou variante.",
        name: "consultar_promocoes_publicas",
        parameters: parametrosCondicaoProduto,
        strict: true,
        type: "function",
      },
      executar: (argumentos) =>
        fontes.consultarPromocoes(
          argumentosConsultarCondicaoProdutoSchema.parse(argumentos),
        ),
      schemaArgumentos: argumentosConsultarCondicaoProdutoSchema,
      schemaResultado: resultadoConsultarPromocoesPublicasSchema,
      versao: VERSAO_FERRAMENTAS_PUBLICAS,
    },
    {
      definicao: {
        description:
          "Consulta opções públicas de entrega e retirada para CEP, produto, variante, modalidade e quantidade informados.",
        name: "consultar_logistica_publica",
        parameters: {
          additionalProperties: false,
          properties: {
            cep: { type: "string" },
            modalidade: propriedadeNullableString,
            quantidade: { maximum: 20, minimum: 1, type: "integer" },
            sku_variante: propriedadeNullableString,
            slug: { type: "string" },
          },
          required: ["cep", "modalidade", "quantidade", "sku_variante", "slug"],
          type: "object",
        },
        strict: true,
        type: "function",
      },
      executar: (argumentos) =>
        fontes.consultarLogistica(
          argumentosConsultarLogisticaPublicaSchema.parse(argumentos),
        ),
      schemaArgumentos: argumentosConsultarLogisticaPublicaSchema,
      schemaResultado: resultadoConsultarLogisticaPublicaSchema,
      versao: VERSAO_FERRAMENTAS_PUBLICAS,
    },
  ];

  return new Map<NomeFerramentaPublica, FerramentaPublica>(
    ferramentas.map((ferramenta) => [
      ferramenta.definicao.name as NomeFerramentaPublica,
      ferramenta,
    ]),
  );
}
