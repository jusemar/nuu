import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { cotarFreteFluxoAtual } from "../entradas/cotar-frete-fluxo-atual";
import type {
  ProdutoAtualComDimensoes,
  VarianteAtualComDimensoes,
} from "../adaptadores/adaptar-produto-atual";

const produtoSimples: ProdutoAtualComDimensoes = {
  identificadorProduto: "produto-1",
  nomeProduto: "Produto simples",
  codigoSkuProduto: "SKU-SIMPLES",
  tipoProdutoAtual: "simple",
  pesoProdutoEmGramas: 500,
  alturaProdutoEmCm: 5,
  larguraProdutoEmCm: 10,
  comprimentoProdutoEmCm: 15,
};

const produtoComVariantes: ProdutoAtualComDimensoes = {
  identificadorProduto: "produto-2",
  nomeProduto: "Produto com variantes",
  tipoProdutoAtual: "variable",
};

const varianteAtual: VarianteAtualComDimensoes = {
  identificadorVariante: "variante-1",
  nomeVariante: "Variante Azul",
  codigoSkuVariante: "SKU-AZUL",
  pesoVarianteEmGramas: 700,
  alturaVarianteEmCm: 7,
  larguraVarianteEmCm: 12,
  comprimentoVarianteEmCm: 20,
};

descrever("cotarFreteFluxoAtual", () => {
  verificar("monta produto simples com CEP valido", async () => {
    const resultado = await cotarFreteFluxoAtual({
      produtoAtual: produtoSimples,
      quantidade: 2,
      cep: "30140-071",
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(resultado.solicitacao.destino.cep, "30140071");
    afirmacoes.equal(resultado.solicitacao.itens[0]?.produtoId, "produto-1");
    afirmacoes.equal(resultado.solicitacao.pacotes[0]?.quantidadeVolumes, 2);
    afirmacoes.equal(resultado.solicitacao.pacotes[0]?.pesoTotalEmGramas, 1000);
  });

  verificar("monta produto com variante com CEP valido", async () => {
    const resultado = await cotarFreteFluxoAtual({
      produtoAtual: produtoComVariantes,
      varianteAtual,
      quantidade: 1,
      cep: "30140071",
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(resultado.solicitacao.itens[0]?.varianteId, "variante-1");
    afirmacoes.equal(resultado.solicitacao.itens[0]?.pesoEmGramas, 700);
  });

  verificar(
    "retorna erro quando variante obrigatoria esta ausente",
    async () => {
      const resultado = await cotarFreteFluxoAtual({
        produtoAtual: produtoComVariantes,
        quantidade: 1,
        cep: "30140071",
      });

      afirmacoes.equal(resultado.sucesso, false);

      if (resultado.sucesso) return;

      afirmacoes.equal(resultado.erros[0]?.codigo, "variante-obrigatoria");
    },
  );

  verificar("retorna erro para produto sem peso ou dimensoes", async () => {
    const resultado = await cotarFreteFluxoAtual({
      produtoAtual: {
        ...produtoSimples,
        pesoProdutoEmGramas: null,
        alturaProdutoEmCm: null,
      },
      quantidade: 1,
      cep: "30140071",
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erros[0]?.codigo, "dimensoes-incompletas");
  });

  verificar("expõe retirada disponivel na cotacao interna", async () => {
    const resultado = await cotarFreteFluxoAtual({
      produtoAtual: produtoSimples,
      quantidade: 1,
      cep: "30140071",
      retiradasAtuais: [
        {
          identificador: "loja-centro",
          nome: "Retirada Centro",
        },
      ],
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(resultado.opcoes[0]?.tipo, "retirada");
  });

  verificar("expõe entrega propria disponivel na cotacao interna", async () => {
    const resultado = await cotarFreteFluxoAtual({
      produtoAtual: produtoSimples,
      quantidade: 1,
      cep: "30140071",
      async consultarEntregaPropriaAtual(consulta) {
        afirmacoes.deepEqual(consulta, {
          produtoId: "produto-1",
          cep: "30140071",
        });

        return {
          disponivel: true,
          valorEmCentavos: 2600,
        };
      },
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(resultado.opcoes[0]?.provedor, "entrega-propria");
  });

  verificar("retorna erro para CEP invalido", async () => {
    const resultado = await cotarFreteFluxoAtual({
      produtoAtual: produtoSimples,
      quantidade: 1,
      cep: "123",
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erros[0]?.codigo, "cep-invalido");
  });

  verificar("controla falha da entrega propria sem quebrar fluxo", async () => {
    const resultado = await cotarFreteFluxoAtual({
      produtoAtual: produtoSimples,
      quantidade: 1,
      cep: "30140071",
      async consultarEntregaPropriaAtual() {
        throw new Error("falha controlada");
      },
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(
      resultado.erros[0]?.codigo,
      "cotacao-entrega-propria-indisponivel",
    );
  });
});
