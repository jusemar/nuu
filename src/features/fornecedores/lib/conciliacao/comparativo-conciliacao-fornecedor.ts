/**
 * Comparativo Fornecedor × Loja atual × A publicar, campo a campo.
 *
 * Vive em `lib/` porque é regra de negócio pura: descreve o que a publicação
 * vai fazer com cada campo, sem depender de React. A tabela da Conciliação usa
 * o resultado tanto no desktop quanto no celular.
 *
 * Os três valores são coisas diferentes e precisam aparecer juntos:
 *
 *   Fornecedor   o que veio na aquisição (arquivo ou API)
 *   Loja atual   o que o produto real pratica hoje no catálogo
 *   A publicar   o que a publicação vai gravar
 *
 * Para item ainda NÃO vinculado não existe "loja atual": o produto não existe.
 * A coluna vem como "—" em vez de repetir o valor a publicar, que daria a
 * impressão falsa de que nada muda.
 */

export type LinhaComparativoConciliacaoFornecedor = {
  campo: string;
  fornecedor: string;
  lojaAtual: string;
  aPublicar: string;
  /** Verdadeiro quando o que será publicado difere do que a loja pratica. */
  muda: boolean;
};

export type EntradaComparativoConciliacaoFornecedor = {
  /** Preço, estoque e prazo recebidos do fornecedor nesta importação. */
  fornecedor: {
    preco: string | null;
    estoque: number | null;
  };
  /** Retrato do produto real da loja. Ausente em item "criar produto novo". */
  lojaAtual: {
    preco: string | null;
    estoque: number | null;
    modalidade: string | null;
    prazo: string | null;
  } | null;
  /** O que o rascunho desta importação vai publicar. */
  aPublicar: {
    preco: string | null;
    estoque: number | null;
    categoriaNome: string | null;
    marcaNome: string | null;
    secoesLoja: string[] | null;
    modalidade: string | null;
    prazo: string | null;
  };
};

const SEM_LOJA = "—";

const NOMES_SECOES_LOJA: Record<string, string> = {
  general: "Catálogo",
  new: "Novidades",
  sale: "Ofertas",
  featured: "Destaques",
  bestseller: "+ Vendidos",
};

const ROTULOS_MODALIDADE_LOJA: Record<string, string> = {
  stock: "Estoque próprio",
  pre_sale: "Pré-venda",
  dropshipping: "Dropshipping",
  order_basis: "Sob encomenda",
};

export function formatarSecoesLojaConciliacao(secoes?: string[] | null) {
  if (!secoes?.length) return null;

  return secoes.map((secao) => NOMES_SECOES_LOJA[secao] ?? secao).join(", ");
}

export function formatarModalidadeConciliacao(modalidade?: string | null) {
  if (!modalidade) return null;

  return ROTULOS_MODALIDADE_LOJA[modalidade] ?? modalidade;
}

function formatarMoeda(valor?: string | null) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

function formatarInteiro(valor?: number | null) {
  return typeof valor === "number" && Number.isFinite(valor)
    ? String(valor)
    : null;
}

export function montarComparativoConciliacaoFornecedor(
  entrada: EntradaComparativoConciliacaoFornecedor,
): LinhaComparativoConciliacaoFornecedor[] {
  const { fornecedor, lojaAtual, aPublicar } = entrada;
  const temProdutoNaLoja = lojaAtual !== null;

  function linha(
    campo: string,
    valorFornecedor: string | null,
    valorLoja: string | null,
    valorPublicar: string | null,
  ): LinhaComparativoConciliacaoFornecedor {
    const loja = temProdutoNaLoja ? (valorLoja ?? "Não cadastrado") : SEM_LOJA;
    const publicar = valorPublicar ?? "Pendente";

    return {
      campo,
      fornecedor: valorFornecedor ?? "Não recebido",
      lojaAtual: loja,
      aPublicar: publicar,
      muda: temProdutoNaLoja && loja !== publicar,
    };
  }

  const estoqueFornecedor = formatarInteiro(fornecedor.estoque);

  return [
    linha(
      "Preço",
      formatarMoeda(fornecedor.preco),
      formatarMoeda(lojaAtual?.preco),
      formatarMoeda(aPublicar.preco),
    ),
    // Fornecedor alimenta automaticamente o estoque a publicar: aprovar sem
    // edição manual significa aceitar o que ele mandou.
    linha(
      "Estoque",
      estoqueFornecedor,
      formatarInteiro(lojaAtual?.estoque),
      formatarInteiro(aPublicar.estoque) ?? estoqueFornecedor,
    ),
    linha("Categoria", null, null, aPublicar.categoriaNome),
    linha("Marca", null, null, aPublicar.marcaNome),
    linha(
      "Seções",
      null,
      null,
      formatarSecoesLojaConciliacao(aPublicar.secoesLoja),
    ),
    linha(
      "Modalidade",
      null,
      formatarModalidadeConciliacao(lojaAtual?.modalidade),
      formatarModalidadeConciliacao(aPublicar.modalidade),
    ),
    linha("Prazo", null, lojaAtual?.prazo ?? null, aPublicar.prazo),
  ];
}
