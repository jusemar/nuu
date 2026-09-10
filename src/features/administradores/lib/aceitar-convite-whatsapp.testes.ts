import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const servico = readFileSync(
  "src/features/administradores/lib/aceitar-convite-whatsapp.ts",
  "utf8",
);
const plugin = readFileSync(
  "src/features/autenticacao/lib/plugin-convite-admin-whatsapp.ts",
  "utf8",
);
const schema = readFileSync(
  "src/features/autenticacao/schemas/convite-admin-whatsapp.schema.ts",
  "utf8",
);

test("aceite final compõe 5A, 5B, 5C1 e 5C2A em uma única transação", () => {
  assert.match(servico, /dbTransacional\.transaction/);
  assert.match(servico, /validarAceiteConviteWhatsappNaTransacao/);
  assert.match(servico, /criarOuReutilizarVinculoConviteWhatsappNaTransacao/);
  assert.match(servico, /aplicarPermissoesConviteWhatsappNaTransacao/);
  assert.match(servico, /consumirConviteWhatsappNaTransacao/);
  assert.match(servico, /throw new Error\("RBAC_NAO_APLICADO"\)/);
  assert.match(servico, /throw new Error\("CONVITE_NAO_CONSUMIDO"\)/);
  assert.match(servico, /aceito: true/);
  assert.match(servico, /acessoAdmin: true/);
  assert.match(servico, /proximoDestino: "\/admin"/);
});

test("endpoint final aceita somente token e não deriva autorização da requisição", () => {
  const endpointFinal = plugin.slice(
    plugin.indexOf("aceitarConviteAdminWhatsapp"),
  );

  assert.match(plugin, /\/admin\/convite\/whatsapp\/aceitar/);
  assert.match(plugin, /aceitarConviteAdminSchema/);
  assert.match(plugin, /token: contexto\.body\.token/);
  assert.match(plugin, /usuarioSessaoId: sessao\?\.user\.id \?\? null/);
  assert.match(schema, /aceitarConviteAdminSchema = z\.object/);
  assert.match(schema, /\}\)\.strict\(\)/);
  assert.doesNotMatch(endpointFinal, /contexto\.body\.(telefone|phoneNumber|usuarioId|administradorId|permissoes|roles|modulos|email|status)/);
});

test("resposta final não expõe dados da prova e mantém o contrato do endpoint", () => {
  assert.match(plugin, /aceito: true/);
  assert.match(plugin, /acesso_admin: true/);
  assert.match(plugin, /proximo_destino: "\/admin"/);
  assert.doesNotMatch(plugin, /telefoneMascarado.*aceito/);
});
