import { obterRotuloModalidadePreco } from "../../constants/modalidades-preco";
import type {
  ModalidadePrecoProduto,
  ProdutoAlteracaoEmMassa,
} from "../../types/alteracao-em-massa.types";

export type EntidadeConcorrencia = "produto" | "preco" | "estoque";

export type VersoesProdutoAlteracaoEmMassa = {
  produto: string;
  variante: string | null;
  precos: Array<{
    id: string;
    modalidade: ModalidadePrecoProduto;
    versao: string;
  }>;
};

export type ConflitoConcorrenciaAlteracaoEmMassa = {
  entidade: EntidadeConcorrencia;
  campoVersao: "updatedAt";
  versaoEsperada: string;
  versaoEncontrada: string;
  etapa: "validacao_antes_da_escrita";
  mensagem: string;
  orientacao: string;
};

/**
 * Igualamos formatos equivalentes sem descartar microssegundos existentes.
 * O banco continua sendo a fonte da versão autoritativa.
 */
export function normalizarVersaoTimestamp(valor: string) {
  const correspondencia = valor
    .trim()
    .match(
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(?:Z|[+-]00(?::?00)?)?$/,
    );
  if (!correspondencia) return valor.trim();
  const fracao = (correspondencia[3] ?? "").padEnd(6, "0");
  return `${correspondencia[1]}T${correspondencia[2]}.${fracao}`;
}

export function versoesTimestampIguais(esperada: string, encontrada: string) {
  return (
    normalizarVersaoTimestamp(esperada) ===
    normalizarVersaoTimestamp(encontrada)
  );
}

export function obterVersoesProdutoAlteracaoEmMassa(
  produto: ProdutoAlteracaoEmMassa,
): VersoesProdutoAlteracaoEmMassa {
  return {
    produto: produto.versaoConcorrencia,
    variante: produto.varianteTecnicaVersaoConcorrencia,
    precos: produto.precosModalidades
      .map((preco) => ({
        id: preco.id,
        modalidade: preco.modalidade,
        versao: preco.versaoConcorrencia,
      }))
      .toSorted((a, b) => a.id.localeCompare(b.id)),
  };
}

export function serializarVersoesProdutoAlteracaoEmMassa(
  produto: ProdutoAlteracaoEmMassa,
) {
  return JSON.stringify(obterVersoesProdutoAlteracaoEmMassa(produto));
}

export function compararVersaoEntidade({
  entidade,
  esperada,
  encontrada,
  modalidade,
}: {
  entidade: EntidadeConcorrencia;
  esperada: string;
  encontrada: string;
  modalidade?: ModalidadePrecoProduto;
}): ConflitoConcorrenciaAlteracaoEmMassa | null {
  if (versoesTimestampIguais(esperada, encontrada)) return null;

  const mensagem =
    entidade === "produto"
      ? "O produto foi alterado por outro processo após o preview."
      : entidade === "preco"
        ? `O preço da modalidade ${modalidade ? obterRotuloModalidadePreco(modalidade) : "selecionada"} mudou após a revisão.`
        : "O estoque foi atualizado depois da geração do preview.";

  return {
    entidade,
    campoVersao: "updatedAt",
    versaoEsperada: esperada,
    versaoEncontrada: encontrada,
    etapa: "validacao_antes_da_escrita",
    mensagem,
    orientacao: "Gere um novo preview para revisar os valores atuais.",
  };
}

export function localizarConflitoProduto(
  versaoAssinada: string | undefined,
  produto: ProdutoAlteracaoEmMassa,
) {
  if (!versaoAssinada) {
    return compararVersaoEntidade({
      entidade: "produto",
      esperada: "versão ausente no preview",
      encontrada: produto.versaoConcorrencia,
    });
  }
  try {
    const esperadas = JSON.parse(
      versaoAssinada,
    ) as VersoesProdutoAlteracaoEmMassa;
    const atual = obterVersoesProdutoAlteracaoEmMassa(produto);
    const produtoMudou = compararVersaoEntidade({
      entidade: "produto",
      esperada: esperadas.produto,
      encontrada: atual.produto,
    });
    if (produtoMudou) return produtoMudou;
    if (esperadas.variante || atual.variante) {
      const varianteMudou = compararVersaoEntidade({
        entidade: "estoque",
        esperada: esperadas.variante ?? "variante inexistente",
        encontrada: atual.variante ?? "variante inexistente",
      });
      if (varianteMudou) return varianteMudou;
    }
    for (const precoEsperado of esperadas.precos) {
      const precoAtual = atual.precos.find(
        (preco) => preco.id === precoEsperado.id,
      );
      const precoMudou = compararVersaoEntidade({
        entidade: "preco",
        esperada: precoEsperado.versao,
        encontrada: precoAtual?.versao ?? "preço não encontrado",
        modalidade: precoEsperado.modalidade,
      });
      if (precoMudou) return precoMudou;
    }
    return null;
  } catch {
    return compararVersaoEntidade({
      entidade: "produto",
      esperada: versaoAssinada,
      encontrada: serializarVersoesProdutoAlteracaoEmMassa(produto),
    });
  }
}
