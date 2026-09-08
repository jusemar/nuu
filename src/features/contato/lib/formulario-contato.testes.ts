import assert from "node:assert/strict";
import test from "node:test";

import { formularioContatoSchema } from "../schemas/formulario-contato.schema";
import { sanitizarTextoContato } from "./sanitizar-formulario-contato";

test("schema aceita uma mensagem de contato válida", () => {
  const resultado = formularioContatoSchema.safeParse({
    nome: "Cliente Nooo",
    email: "cliente@example.com",
    assunto: "Dúvida sobre produto",
    mensagem: "Gostaria de receber mais informações sobre este produto.",
  });
  assert.equal(resultado.success, true);
});

test("schema rejeita email inválido e mensagem acima do limite", () => {
  const resultado = formularioContatoSchema.safeParse({
    nome: "Cliente Nooo",
    email: "email-invalido",
    assunto: "Dúvida",
    mensagem: "a".repeat(2_001),
  });
  assert.equal(resultado.success, false);
});

test("sanitização remove HTML e preserva o conteúdo textual", () => {
  assert.equal(
    sanitizarTextoContato("<script>alert(1)</script><b>Olá</b>\nTudo bem?"),
    "Olá\nTudo bem?",
  );
});
