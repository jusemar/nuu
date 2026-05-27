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
});

