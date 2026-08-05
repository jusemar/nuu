import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  planejarSeedDadosIniciaisLogistica,
  provedoresFreteIniciais,
  servicosFreteIniciais,
  tiposLogisticosIniciais,
  transportadorasFreteIniciais,
} from "./dados-iniciais-logistica";

describe("seed dados iniciais logística", () => {
  it("cria quando nao existe", () => {
    const plano = planejarSeedDadosIniciaisLogistica({
      provedoresExistentes: [],
      tiposExistentes: [],
      transportadorasExistentes: [],
      servicosExistentes: [],
    });

    assert.equal(plano.provedoresCriar.length, provedoresFreteIniciais.length);
    assert.equal(plano.tiposCriar.length, tiposLogisticosIniciais.length);
    assert.equal(
      plano.transportadorasCriar.length,
      transportadorasFreteIniciais.length,
    );
    assert.equal(plano.servicosCriar.length, servicosFreteIniciais.length);
  });

  it("nao duplica quando ja existe", () => {
    const plano = planejarSeedDadosIniciaisLogistica({
      provedoresExistentes: provedoresFreteIniciais,
      tiposExistentes: tiposLogisticosIniciais,
      transportadorasExistentes: transportadorasFreteIniciais.map((item) => ({
        identificador: item.identificador,
        provedorIdentificador: item.provedorIdentificador,
      })),
      servicosExistentes: servicosFreteIniciais.map((item) => ({
        identificador: item.identificador,
        provedorIdentificador: item.provedorIdentificador,
      })),
    });

    assert.equal(plano.provedoresCriar.length, 0);
    assert.equal(plano.tiposCriar.length, 0);
    assert.equal(plano.transportadorasCriar.length, 0);
    assert.equal(plano.servicosCriar.length, 0);
  });

  it("dados iniciais ficam ativos e em portugues", () => {
    assert.equal(
      [...provedoresFreteIniciais, ...tiposLogisticosIniciais, ...transportadorasFreteIniciais, ...servicosFreteIniciais].every(
        (item) => item.ativo,
      ),
      true,
    );

    assert.equal(
      tiposLogisticosIniciais.some((item) => item.nome.includes("Produto Frágil")),
      true,
    );
    assert.equal(
      servicosFreteIniciais.some((item) => item.nome.includes("Correios PAC")),
      true,
    );
  });

  it("registra os servicos de entrega propria com os identificadores usados na cotacao", () => {
    // Estes identificadores são um contrato com o motor de cotação: são exatamente
    // as strings emitidas no campo `servico` de `OpcaoFrete`. Se alguém renomear aqui
    // sem renomear lá, a configuração por serviço deixa de casar com o frete escolhido
    // e o pedido perde a referência — por isso o teste trava os dois valores.
    const servicosEntregaPropria = servicosFreteIniciais.filter(
      (item) => item.provedorIdentificador === "entrega-propria",
    );

    assert.deepEqual(
      servicosEntregaPropria.map((item) => item.identificador).sort(),
      ["entrega-programada", "entrega-propria-atual"],
    );

    // Entrega própria é feita pela loja: nenhum serviço pode apontar para transportadora.
    assert.equal(
      servicosEntregaPropria.every((item) => item.transportadoraIdentificador === null),
      true,
    );
  });

  it("nao recria os servicos de entrega propria quando o seed roda duas vezes", () => {
    // Idempotência: simula o banco já contendo apenas os dois serviços de entrega própria
    // e confirma que um segundo `npm run seed:logistica-dados-iniciais` não os duplicaria.
    const plano = planejarSeedDadosIniciaisLogistica({
      provedoresExistentes: provedoresFreteIniciais,
      tiposExistentes: tiposLogisticosIniciais,
      transportadorasExistentes: transportadorasFreteIniciais.map((item) => ({
        identificador: item.identificador,
        provedorIdentificador: item.provedorIdentificador,
      })),
      servicosExistentes: [
        { identificador: "entrega-propria-atual", provedorIdentificador: "entrega-propria" },
        { identificador: "entrega-programada", provedorIdentificador: "entrega-propria" },
      ],
    });

    assert.equal(
      plano.servicosCriar.some((item) => item.provedorIdentificador === "entrega-propria"),
      false,
    );
  });
});

