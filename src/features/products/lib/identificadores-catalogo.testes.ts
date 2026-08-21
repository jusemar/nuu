import assert from "node:assert/strict";
import test from "node:test";

import {
  classificarConflitoIdentificador,
  normalizarGtin,
  validarGtin,
  validarMpnBasico,
} from "./identificadores-catalogo";

const casosValidos = [
  ["96385074", "gtin_8"],
  ["036000291452", "gtin_12"],
  ["4006381333931", "gtin_13"],
  ["10012345000017", "gtin_14"],
] as const;

for (const [valor, tipo] of casosValidos) {
  test(`${tipo} válido preserva o valor textual`, () => {
    assert.deepEqual(validarGtin(valor), { valido: true, valor, tipo });
  });

  test(`${tipo} rejeita dígito verificador incorreto`, () => {
    const ultimo = Number(valor.at(-1));
    const invalido = `${valor.slice(0, -1)}${(ultimo + 1) % 10}`;
    assert.deepEqual(validarGtin(invalido), {
      valido: false,
      motivo: "digito_verificador_invalido",
    });
  });
}

test("preserva zeros à esquerda", () => {
  assert.equal(normalizarGtin(" 036000291452 "), "036000291452");
});

function adicionarDigitoVerificador(corpo: string) {
  const soma = corpo
    .split("")
    .map(Number)
    .reverse()
    .reduce(
      (total, digito, indice) => total + digito * (indice % 2 === 0 ? 3 : 1),
      0,
    );
  return `${corpo}${(10 - (soma % 10)) % 10}`;
}

test("rejeita faixas restritas e cupons segundo o Merchant Center", () => {
  for (const prefixo of ["020", "040", "200", "050", "980", "990"]) {
    const valor = adicionarDigitoVerificador(`${prefixo}123456789`);
    assert.deepEqual(validarGtin(valor), {
      valido: false,
      motivo: "faixa_restrita_google",
    });
  }
});

test("rejeita caracteres não numéricos, comprimento inválido e placeholder", () => {
  assert.equal(validarGtin("400638133393A").valido, false);
  assert.equal(validarGtin("1234567890").valido, false);
  assert.deepEqual(validarGtin("00000000"), {
    valido: false,
    motivo: "placeholder",
  });
});

test("MPN exige declaração explícita e não é inferido de SKU", () => {
  assert.deepEqual(
    validarMpnBasico({
      valor: "SKU-INTERNO-123",
      declaradoExplicitamente: false,
    }),
    { valido: false, motivo: "nao_declarado_como_mpn" },
  );
  assert.deepEqual(
    validarMpnBasico({ valor: "FAB-AX9", declaradoExplicitamente: true }),
    { valido: true, valor: "FAB-AX9" },
  );
});

test("fornecedor não sobrescreve identificador manual", () => {
  assert.deepEqual(
    classificarConflitoIdentificador({
      existente: {
        valor: "4006381333931",
        origem: "manual_admin",
        status: "pendente",
      },
      recebido: {
        valor: "7894900011517",
        origem: "fornecedor_importacao",
        status: "pendente",
      },
    }),
    {
      acao: "conflito",
      motivo: "manual_protegido",
      preservarExistente: true,
    },
  );
});

test("identificador verificado nunca é substituído silenciosamente", () => {
  const resultado = classificarConflitoIdentificador({
    existente: {
      valor: "4006381333931",
      origem: "fornecedor_importacao",
      status: "verificado",
    },
    recebido: {
      valor: "7894900011517",
      origem: "manual_admin",
      status: "pendente",
    },
  });

  assert.equal(resultado.acao, "conflito");
});
