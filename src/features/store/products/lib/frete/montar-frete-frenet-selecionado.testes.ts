import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { montarFreteFrenetSelecionado } from "./montar-frete-frenet-selecionado";

descrever("montarFreteFrenetSelecionado", () => {
  verificar("monta selecao Frenet do BuyBox", () => {
    const frete = montarFreteFrenetSelecionado({
      cep: "01310-930",
      opcao: {
        identificador: "frenet:sedex",
        provedor: "frenet",
        servico: "SEDEX",
        nome: "Sedex",
        prazo: "3 dias uteis",
        valorEmCentavos: 2490,
        transportadora: "Correios",
      },
    });

    afirmacoes.deepEqual(frete, {
      id: "frenet",
      nome: "Sedex",
      prazo: "3 dias uteis",
      valorEmCentavos: 2490,
      cep: "01310-930",
      servico: "SEDEX",
      transportadora: "Correios",
    });
  });

  verificar("nao monta provedor diferente da Frenet", () => {
    const frete = montarFreteFrenetSelecionado({
      cep: "01310-930",
      opcao: {
        identificador: "entrega-propria",
        provedor: "entrega-propria",
        servico: "entrega-propria-atual",
        nome: "Entrega propria",
        prazo: "Hoje",
        valorEmCentavos: 1800,
      },
    });

    afirmacoes.equal(frete, undefined);
  });
});
