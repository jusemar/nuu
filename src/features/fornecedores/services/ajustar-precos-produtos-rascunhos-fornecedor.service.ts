import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { produtoRascunhosTable } from "@/db/schema";
import {
  calcularAjustePrecoRascunhoFornecedor,
  type OperacaoAjustePrecoRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/calcular-ajuste-preco-rascunho-fornecedor";
import {
  listarPendenciasAtualizacaoRascunhoFornecedor,
  listarPendenciasRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";

type AjustePrecosRascunhosFornecedor = {
  rascunhoIds: string[];
  origemProvedor: string;
  operacao: OperacaoAjustePrecoRascunhoFornecedor;
  valor: number;
};

export async function ajustarPrecosProdutosRascunhosFornecedor(
  dados: AjustePrecosRascunhosFornecedor,
) {
  const rascunhos = await db
    .select({
      id: produtoRascunhosTable.id,
      nome: produtoRascunhosTable.nome,
      categoriaId: produtoRascunhosTable.categoriaId,
      marcaId: produtoRascunhosTable.marcaId,
      precoFornecedor: produtoRascunhosTable.precoFornecedor,
      precoLoja: produtoRascunhosTable.precoLoja,
      dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
      produtoAtualizadoId: produtoRascunhosTable.produtoAtualizadoId,
    })
    .from(produtoRascunhosTable)
    .where(
      and(
        inArray(produtoRascunhosTable.id, dados.rascunhoIds),
        eq(produtoRascunhosTable.origemProvedor, dados.origemProvedor),
      ),
    );

  const resultados = await Promise.all(
    rascunhos.map(async (rascunho) => {
      const precoAtual = rascunho.precoLoja ?? rascunho.precoFornecedor;
      const precoLoja = calcularAjustePrecoRascunhoFornecedor({
        precoAtual,
        operacao: dados.operacao,
        valor: dados.valor,
      });

      if (!precoLoja) return false;

      // Itens "atualizar" exigem aprovação explícita (ação "aprovar") para
      // virarem elegíveis à Publicação — ajustar o preço aqui nunca promove
      // o status sozinho, e as pendências obrigatórias de categoria/marca
      // não se aplicam a eles.
      const status = rascunho.produtoAtualizadoId
        ? listarPendenciasAtualizacaoRascunhoFornecedor(precoLoja).length === 0
          ? "pendente_conciliacao"
          : "rascunho"
        : listarPendenciasRascunhoFornecedor({ ...rascunho, precoLoja })
              .length === 0
          ? "pronto_para_publicar"
          : "pendente_conciliacao";

      await db
        .update(produtoRascunhosTable)
        .set({
          precoLoja,
          status,
          atualizadoEm: new Date(),
        })
        .where(eq(produtoRascunhosTable.id, rascunho.id));

      return { rascunhoId: rascunho.id, precoLoja };
    }),
  );

  return resultados.filter(
    (resultado): resultado is { rascunhoId: string; precoLoja: string } =>
      resultado !== false,
  );
}

export async function atualizarPrecoLojaProdutoRascunhoFornecedor({
  rascunhoId,
  origemProvedor,
  precoLoja,
}: {
  rascunhoId: string;
  origemProvedor: string;
  precoLoja: number;
}) {
  await db
    .update(produtoRascunhosTable)
    .set({ precoLoja: precoLoja.toFixed(2), atualizadoEm: new Date() })
    .where(
      and(
        eq(produtoRascunhosTable.id, rascunhoId),
        eq(produtoRascunhosTable.origemProvedor, origemProvedor),
      ),
    );
}
