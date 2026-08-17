import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { GrupoLogistico } from "@/features/logistica/types/grupos-logisticos";

import type { ItemResumoCheckout } from "../../types/checkout.types";
import { montarGruposVisuaisCheckout } from "./montar-grupos-visuais-checkout";

function criarItem(
  id: string,
  origemExpedicao: "loja" | "fornecedor",
  fornecedorProvedor: string | null,
  quantidade = 1,
) {
  return {
    id,
    produtoId: `produto-${id}`,
    quantidade,
    origemExpedicao,
    fornecedorProvedor,
    necessitaEtiquetaFornecedor: fornecedorProvedor === "laquila",
    pix: { valorEmCentavos: 12345 },
    cartao: { valorEmCentavos: 13000 },
  } as ItemResumoCheckout;
}

function criarGrupo(
  chave: string,
  itens: ItemResumoCheckout[],
): GrupoLogistico<ItemResumoCheckout> {
  const primeiroItem = itens[0]!;

  return {
    chave,
    origemExpedicao: primeiroItem.origemExpedicao,
    fornecedorProvedor: primeiroItem.fornecedorProvedor,
    necessitaEtiquetaFornecedor: primeiroItem.necessitaEtiquetaFornecedor,
    itens,
  };
}

descrever("montarGruposVisuaisCheckout", () => {
  verificar("mantem um unico grupo da loja sem ruido visual", () => {
    const itens = [
      criarItem("loja-1", "loja", null),
      criarItem("loja-2", "loja", null),
    ];
    const grupos = montarGruposVisuaisCheckout([
      criarGrupo("expedicao:loja", itens),
    ]);

    afirmacoes.equal(grupos.length, 1);
    afirmacoes.equal(grupos[0]?.titulo, null);
    afirmacoes.equal(grupos[0]?.descricao, null);
    afirmacoes.deepEqual(grupos[0]?.itens, itens);
  });

  verificar("usa mensagem neutra para um unico fornecedor", () => {
    const item = criarItem("fornecedor-1", "fornecedor", "laquila");
    const [grupo] = montarGruposVisuaisCheckout([
      criarGrupo("expedicao:fornecedor:laquila", [item]),
    ]);

    afirmacoes.equal(grupo?.titulo, null);
    afirmacoes.equal(grupo?.descricao, "Produtos enviados separadamente");
    afirmacoes.equal(grupo?.descricao.includes("Laquila"), false);
  });

  verificar("mostra as origens no checkout misto e preserva cada item", () => {
    const itemLoja = criarItem("loja-1", "loja", null);
    const itemFornecedor = criarItem("fornecedor-1", "fornecedor", "laquila");
    const grupos = montarGruposVisuaisCheckout([
      criarGrupo("expedicao:loja", [itemLoja]),
      criarGrupo("expedicao:fornecedor:laquila", [itemFornecedor]),
    ]);

    afirmacoes.deepEqual(
      grupos.map(({ titulo, descricao }) => ({ titulo, descricao })),
      [
        {
          titulo: "Envio de BH/MG",
          descricao: null,
        },
        {
          titulo: "Envio do PR",
          descricao: null,
        },
      ],
    );
    afirmacoes.deepEqual(
      grupos.flatMap((grupo) => grupo.itens.map((item) => item.id)),
      ["loja-1", "fornecedor-1"],
    );
  });

  verificar("não revela fornecedores diferentes", () => {
    const grupos = montarGruposVisuaisCheckout([
      criarGrupo("expedicao:loja", [criarItem("loja", "loja", null)]),
      criarGrupo("expedicao:fornecedor:x", [
        criarItem("x", "fornecedor", "fornecedor-x"),
      ]),
      criarGrupo("expedicao:fornecedor:y", [
        criarItem("y", "fornecedor", "fornecedor-y"),
      ]),
    ]);

    afirmacoes.deepEqual(
      grupos.map((grupo) => grupo.titulo),
      ["Envio de BH/MG", "Envio do PR", "Envio do PR"],
    );
    afirmacoes.deepEqual(
      grupos.map((grupo) => grupo.descricao),
      [null, null, null],
    );
  });

  verificar("preserva quantidade, variante e referencias de preco", () => {
    const item = criarItem("variante", "fornecedor", "laquila", 5);
    item.produtoVarianteId = "variante-220v";
    const [grupo] = montarGruposVisuaisCheckout([
      criarGrupo("expedicao:fornecedor:laquila", [item]),
    ]);
    const itemVisual = grupo?.itens[0];

    afirmacoes.equal(itemVisual, item);
    afirmacoes.equal(itemVisual?.quantidade, 5);
    afirmacoes.equal(itemVisual?.produtoVarianteId, "variante-220v");
    afirmacoes.equal(itemVisual?.pix.valorEmCentavos, 12345);
    afirmacoes.equal(itemVisual?.cartao.valorEmCentavos, 13000);
  });
});
