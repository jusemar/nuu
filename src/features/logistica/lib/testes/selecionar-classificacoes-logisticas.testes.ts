import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { selecionarClassificacoesLogisticasAplicaveis } from "../disponibilidade/selecionar-classificacoes-logisticas";

const vinculoProduto = {
  tipoLogisticoId: "classificacao-produto",
  tipoLogistico: { identificador: "produto-pesado", ativo: true },
};

descrever("selecionar classificações logísticas aplicáveis", () => {
  verificar("usa classificação própria da variante", () => {
    const classificacoes = selecionarClassificacoesLogisticasAplicaveis({
      vinculosProduto: [vinculoProduto],
      vinculosVariante: [
        {
          tipoLogisticoId: "classificacao-variante",
          tipoLogistico: { identificador: "grande-volume", ativo: true },
        },
      ],
    });

    afirmacoes.deepEqual(classificacoes, ["grande-volume"]);
  });

  verificar("herda classificação do produto sem vínculo na variante", () => {
    const classificacoes = selecionarClassificacoesLogisticasAplicaveis({
      vinculosProduto: [vinculoProduto],
      vinculosVariante: [],
    });

    afirmacoes.deepEqual(classificacoes, ["produto-pesado"]);
  });

  verificar("ignora classificação inativa", () => {
    const classificacoes = selecionarClassificacoesLogisticasAplicaveis({
      vinculosProduto: [],
      vinculosVariante: [
        {
          tipoLogisticoId: "inativa",
          tipoLogistico: { identificador: "produto-fragil", ativo: false },
        },
      ],
    });

    afirmacoes.deepEqual(classificacoes, []);
  });
});
