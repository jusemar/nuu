import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { mapearDisponibilidadeFreteProduto } from "./mapear-disponibilidade-frete-produto";

descrever("mapearDisponibilidadeFreteProduto", () => {
  verificar("carrega regras do banco para o resolvedor", () => {
    const disponibilidade = mapearDisponibilidadeFreteProduto({
      produtoId: "produto-1",
      varianteId: "variante-1",
      categoriaId: "categoria-1",
      tiposLogisticosIdentificadores: ["fragil"],
      provedores: [{ identificador: "frenet", ativo: true }],
      transportadoras: [
        {
          identificador: "correios",
          nome: "Correios",
          ativo: true,
          pesoMaximoEmGramas: 30000,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: 100,
          provedor: { identificador: "frenet" },
        },
      ],
      servicos: [
        {
          identificador: "sedex",
          ativo: true,
          pesoMaximoEmGramas: null,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: null,
          provedor: { identificador: "frenet" },
          transportadora: { identificador: "correios" },
        },
      ],
      regrasCategorias: [
        {
          categoriaId: "categoria-1",
          efeito: "permitir",
          ativo: true,
          servico: {
            identificador: "sedex",
            provedor: { identificador: "frenet" },
            transportadora: { identificador: "correios" },
          },
        },
      ],
      regrasProdutos: [
        {
          produtoId: "produto-1",
          efeito: "bloquear",
          ativo: true,
          transportadora: {
            identificador: "correios",
            provedor: { identificador: "frenet" },
          },
        },
      ],
      regrasTiposLogisticos: [
        {
          tipoLogistico: { identificador: "fragil" },
          efeito: "bloquear",
          ativo: true,
          provedor: { identificador: "frenet" },
        },
      ],
    });

    afirmacoes.equal(
      disponibilidade.contextoProduto.categoriaId,
      "categoria-1",
    );
    afirmacoes.equal(disponibilidade.contextoProduto.varianteId, "variante-1");
    afirmacoes.equal(
      disponibilidade.configuracao.transportadoras[0]?.comprimentoMaximoEmCm,
      100,
    );
    afirmacoes.deepEqual(disponibilidade.configuracao.servicos[0], {
      identificador: "sedex",
      ativo: true,
      provedorIdentificador: "frenet",
      transportadoraIdentificador: "correios",
      pesoMaximoEmGramas: null,
      alturaMaximaEmCm: null,
      larguraMaximaEmCm: null,
      comprimentoMaximoEmCm: null,
    });
    afirmacoes.equal(
      disponibilidade.configuracao.regrasCategorias[0]?.provedorIdentificador,
      "frenet",
    );
    afirmacoes.equal(
      disponibilidade.configuracao.regrasProdutos[0]
        ?.transportadoraIdentificador,
      "correios",
    );
    afirmacoes.equal(
      disponibilidade.configuracao.regrasTiposLogisticos[0]
        ?.tipoLogisticoIdentificador,
      "fragil",
    );
  });
});
