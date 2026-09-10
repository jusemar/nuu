import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { criarConviteAdministradorSchema } from "../schemas/convites-administrativos.schema";

const entradaBase = {
  funcaoId: null,
  nome: "Pessoa Convidada",
  permissoesEfetivas: [],
};

test("schema preserva o convite legado por e-mail", () => {
  const convite = criarConviteAdministradorSchema.parse({
    ...entradaBase,
    email: "PESSOA@EXEMPLO.COM",
  });

  assert.equal(convite.tipoIdentificador, "email");
  assert.equal(convite.email, "pessoa@exemplo.com");
  assert.equal(convite.identificadorNormalizado, "pessoa@exemplo.com");
});

test("schema exige uma identidade coerente e normaliza WhatsApp", () => {
  const convite = criarConviteAdministradorSchema.parse({
    ...entradaBase,
    telefone: "(31) 99925-5777",
    tipoIdentificador: "whatsapp",
  });

  assert.equal(convite.tipoIdentificador, "whatsapp");
  assert.equal(convite.email, null);
  assert.equal(convite.identificadorNormalizado, "+5531999255777");
  assert.equal(
    criarConviteAdministradorSchema.safeParse({
      ...entradaBase,
      tipoIdentificador: "whatsapp",
    }).success,
    false,
  );
  assert.equal(
    criarConviteAdministradorSchema.safeParse({
      ...entradaBase,
      tipoIdentificador: "email",
    }).success,
    false,
  );
  assert.equal(
    criarConviteAdministradorSchema.safeParse({
      ...entradaBase,
      email: "pessoa@exemplo.com",
      telefone: "+5531999255777",
      tipoIdentificador: "whatsapp",
    }).success,
    false,
  );
  assert.equal(
    criarConviteAdministradorSchema.safeParse({
      ...entradaBase,
      email: "pessoa@exemplo.com",
      telefone: "+5531999255777",
      tipoIdentificador: "email",
    }).success,
    false,
  );
});

test("criação só envia e-mail para convite desse tipo e devolve link manual para WhatsApp", () => {
  const fonte = readFileSync(
    "src/features/administradores/actions/criar-convite-administrador.ts",
    "utf8",
  );

  assert.match(fonte, /tipoIdentificador: dados\.tipoIdentificador/);
  assert.match(
    fonte,
    /identificadorNormalizado: dados\.identificadorNormalizado/,
  );
  assert.match(fonte, /if \(dados\.tipoIdentificador === "email"\)/);
  assert.match(fonte, /enviarEmailConviteAdministrativo/);
  assert.match(fonte, /linkConvite/);
  assert.match(fonte, /dados\.tipoIdentificador === "whatsapp"/);
  assert.doesNotMatch(fonte, /comunicacaoWhatsapp/);
});

test("leitura pública divulga somente a identidade mascarada correta", () => {
  const fonte = readFileSync(
    "src/features/administradores/queries/validar-convite-publico.ts",
    "utf8",
  );

  assert.match(fonte, /tipoIdentificador/);
  assert.match(fonte, /emailMascarado/);
  assert.match(fonte, /telefoneMascarado/);
  assert.match(fonte, /mascararTelefoneWhatsapp/);
  assert.doesNotMatch(fonte, /telefone: convite\.identificadorNormalizado/);
});
