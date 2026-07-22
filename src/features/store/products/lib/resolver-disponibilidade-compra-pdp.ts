import type { PrecoProdutoCalculado } from "@/features/precificacao/client";
import type { ResultadoVarianteTecnicaProdutoSimples } from "@/features/products/domain";

import type {
  PrecoModalidade,
  VarianteProdutoLoja,
} from "../types/product.types";

export type DisponibilidadeCompraPdp =
  | { estado: "disponivel"; estoqueMaximo: number | null }
  | { estado: "selecione_variante"; estoqueMaximo: 0 }
  | { estado: "indisponivel"; estoqueMaximo: 0; motivo: string };

function possuiPrecoValido(preco: PrecoProdutoCalculado | null | undefined) {
  if (!preco) return false;

  return (
    (preco.pix.ativo && preco.pix.valorEmCentavos > 0) ||
    (preco.cartao.ativo && preco.cartao.valorEmCentavos > 0)
  );
}

export function resolverDisponibilidadeCompraPdp({
  tipoProduto,
  modalidade,
  precoCalculado,
  varianteSelecionada,
  possuiVariantesPublicas,
  varianteTecnicaProdutoSimples,
}: {
  tipoProduto?: string | null;
  modalidade: PrecoModalidade | null | undefined;
  precoCalculado: PrecoProdutoCalculado | null | undefined;
  varianteSelecionada: VarianteProdutoLoja | null;
  possuiVariantesPublicas: boolean;
  varianteTecnicaProdutoSimples?: ResultadoVarianteTecnicaProdutoSimples | null;
}): DisponibilidadeCompraPdp {
  if (tipoProduto === "variable") {
    if (!possuiVariantesPublicas) {
      return {
        estado: "indisponivel",
        estoqueMaximo: 0,
        motivo: "Este produto está sem variantes disponíveis no momento.",
      };
    }

    if (!varianteSelecionada) {
      return { estado: "selecione_variante", estoqueMaximo: 0 };
    }

    if (
      !varianteSelecionada.isActive ||
      varianteSelecionada.stockQuantity <= 0
    ) {
      return {
        estado: "indisponivel",
        estoqueMaximo: 0,
        motivo: "A variante selecionada está indisponível no momento.",
      };
    }

    if (!possuiPrecoValido(precoCalculado)) {
      return {
        estado: "indisponivel",
        estoqueMaximo: 0,
        motivo: "A variante selecionada está sem preço válido.",
      };
    }

    return {
      estado: "disponivel",
      estoqueMaximo: varianteSelecionada.stockQuantity,
    };
  }

  if (!modalidade?.isActive || !possuiPrecoValido(precoCalculado)) {
    return {
      estado: "indisponivel",
      estoqueMaximo: 0,
      motivo: "Este produto está indisponível no momento.",
    };
  }

  if (varianteTecnicaProdutoSimples?.situacao !== "confiavel") {
    return {
      estado: "indisponivel",
      estoqueMaximo: 0,
      motivo:
        varianteTecnicaProdutoSimples?.motivo ||
        "Este produto está sem estoque interno confiável.",
    };
  }

  if (modalidade.type === "stock") {
    if (varianteTecnicaProdutoSimples.variante.estoque <= 0) {
      return {
        estado: "indisponivel",
        estoqueMaximo: 0,
        motivo: "Este produto está sem estoque no momento.",
      };
    }

    return {
      estado: "disponivel",
      estoqueMaximo: varianteTecnicaProdutoSimples.variante.estoque,
    };
  }

  // Pré-venda, dropshipping e sob encomenda não dependem de estoque local.
  return { estado: "disponivel", estoqueMaximo: null };
}
