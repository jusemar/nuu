import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { ItemAgrupavelLogisticamente } from "../../types/grupos-logisticos";
import { agruparItensPorOrigemExpedicao } from "./agrupar-itens-por-origem-expedicao";
import { resolverOrigemExpedicaoProduto } from "./resolver-origem-expedicao-produto";

function criarItem(
  produtoId: string,
  origem: ReturnType<typeof resolverOrigemExpedicaoProduto>,
  quantidade = 1,
): ItemAgrupavelLogisticamente {
  return {
    produtoId,
    quantidade,
    ...origem,
  };
}

const origemLoja = resolverOrigemExpedicaoProduto({
  fornecedorProvedorAtivo: null,
});
const origemLaquila = resolverOrigemExpedicaoProduto({
  fornecedorProvedorAtivo: "laquila",
});
const origemFornecedorX = resolverOrigemExpedicaoProduto({
  fornecedorProvedorAtivo: "fornecedor-x",
});

descrever("agruparItensPorOrigemExpedicao", () => {
  verificar("1. agrupa carrinho apenas com itens da loja", () => {
    const grupos = agruparItensPorOrigemExpedicao([
      criarItem("loja-1", origemLoja),
      criarItem("loja-2", origemLoja),
    ]);

    afirmacoes.equal(grupos.length, 1);
    afirmacoes.equal(grupos[0]?.origemExpedicao, "loja");
    afirmacoes.equal(grupos[0]?.fornecedorProvedor, null);
    afirmacoes.equal(grupos[0]?.necessitaEtiquetaFornecedor, false);
    afirmacoes.equal(grupos[0]?.itens.length, 2);
  });

  verificar("2. agrupa carrinho apenas com itens Laquila", () => {
    const grupos = agruparItensPorOrigemExpedicao([
      criarItem("laquila-1", origemLaquila),
      criarItem("laquila-2", origemLaquila),
    ]);

    afirmacoes.equal(grupos.length, 1);
    afirmacoes.equal(grupos[0]?.origemExpedicao, "fornecedor");
    afirmacoes.equal(grupos[0]?.fornecedorProvedor, "laquila");
    afirmacoes.equal(grupos[0]?.necessitaEtiquetaFornecedor, true);
  });

  verificar("3. separa carrinho misto entre loja e Laquila", () => {
    const grupos = agruparItensPorOrigemExpedicao([
      criarItem("laquila-1", origemLaquila),
      criarItem("loja-1", origemLoja),
    ]);

    afirmacoes.deepEqual(
      grupos.map((grupo) => grupo.chave),
      ["expedicao:loja", "expedicao:fornecedor:laquila"],
    );
  });

  verificar("4. agrupa multiplos itens Laquila no mesmo grupo", () => {
    const grupos = agruparItensPorOrigemExpedicao([
      criarItem("laquila-1", origemLaquila),
      criarItem("laquila-2", origemLaquila),
      criarItem("laquila-3", origemLaquila),
    ]);

    afirmacoes.equal(grupos.length, 1);
    afirmacoes.deepEqual(
      grupos[0]?.itens.map((item) => item.produtoId),
      ["laquila-1", "laquila-2", "laquila-3"],
    );
  });

  verificar("5. nao altera a composicao quando muda a ordem dos itens", () => {
    const itens = [
      criarItem("loja-1", origemLoja),
      criarItem("laquila-1", origemLaquila),
      criarItem("loja-2", origemLoja),
    ];
    const resumir = (entrada: readonly ItemAgrupavelLogisticamente[]) =>
      agruparItensPorOrigemExpedicao(entrada).map((grupo) => ({
        chave: grupo.chave,
        produtos: grupo.itens.map((item) => item.produtoId).sort(),
      }));

    afirmacoes.deepEqual(resumir(itens), resumir([...itens].reverse()));
  });

  verificar("6. quantidade e repeticao nao criam grupo indevido", () => {
    const item = criarItem("laquila-1", origemLaquila, 3);
    const grupos = agruparItensPorOrigemExpedicao([item, { ...item }]);

    afirmacoes.equal(grupos.length, 1);
    afirmacoes.equal(grupos[0]?.itens.length, 2);
    afirmacoes.deepEqual(
      grupos[0]?.itens.map((entrada) => entrada.quantidade),
      [3, 3],
    );
  });

  verificar("7. entrada vazia retorna lista vazia", () => {
    afirmacoes.deepEqual(agruparItensPorOrigemExpedicao([]), []);
  });

  verificar("8. separa fornecedor futuro da Laquila", () => {
    const grupos = agruparItensPorOrigemExpedicao([
      criarItem("laquila-1", origemLaquila),
      criarItem("fornecedor-x-1", origemFornecedorX),
    ]);

    afirmacoes.deepEqual(
      grupos.map((grupo) => ({
        provedor: grupo.fornecedorProvedor,
        necessitaEtiqueta: grupo.necessitaEtiquetaFornecedor,
      })),
      [
        { provedor: "fornecedor-x", necessitaEtiqueta: false },
        { provedor: "laquila", necessitaEtiqueta: true },
      ],
    );
  });

  verificar(
    "9. mantem loja, Laquila e fornecedor futuro em grupos distintos",
    () => {
      const grupos = agruparItensPorOrigemExpedicao([
        criarItem("fornecedor-x-1", origemFornecedorX),
        criarItem("loja-1", origemLoja),
        criarItem("laquila-1", origemLaquila),
      ]);

      afirmacoes.deepEqual(
        grupos.map((grupo) => grupo.chave),
        [
          "expedicao:loja",
          "expedicao:fornecedor:fornecedor-x",
          "expedicao:fornecedor:laquila",
        ],
      );
    },
  );

  verificar(
    "10. resolve Laquila pelo provedor ativo fornecido pela consulta segura",
    () => {
      const origem = resolverOrigemExpedicaoProduto({
        fornecedorProvedorAtivo: " LAQUILA ",
      });

      afirmacoes.deepEqual(origem, {
        origemExpedicao: "fornecedor",
        fornecedorProvedor: "laquila",
        necessitaEtiquetaFornecedor: true,
      });
      afirmacoes.deepEqual(
        resolverOrigemExpedicaoProduto({ fornecedorProvedorAtivo: null }),
        origemLoja,
      );
    },
  );
});
