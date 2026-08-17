import assert from "node:assert/strict";
import test from "node:test";

import { salvarProgramaFidelidadeSchema } from "./salvar-programa-fidelidade.schema";

const entradaValida = {
  configuracao: {
    ativo: true,
    nomePublico: "Clube Patinhas",
    pontosPorReal: 1.25,
    pontosConversao: 100,
    valorCredito: 10,
    minimoResgate: 200,
    mesesValidade: 12,
  },
  regras: [],
  versao: 1,
};

test("aceita configuração global válida para criação e atualização", () => {
  assert.equal(
    salvarProgramaFidelidadeSchema.safeParse(entradaValida).success,
    true,
  );
  assert.equal(
    salvarProgramaFidelidadeSchema.safeParse({ ...entradaValida, versao: 2 })
      .success,
    true,
  );
});

test("rejeita valores inválidos e taxa personalizada zerada", () => {
  const resultado = salvarProgramaFidelidadeSchema.safeParse({
    ...entradaValida,
    configuracao: { ...entradaValida.configuracao, pontosConversao: 0 },
    regras: [
      {
        categoriaId: "11111111-1111-4111-8111-111111111111",
        personalizada: true,
        pontosPorReal: 0,
        ativa: true,
      },
    ],
  });
  assert.equal(resultado.success, false);
});
