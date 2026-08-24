import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PermissaoAdministrativaChave } from "@/features/autenticacao/constants/permissoes-administrativas";

import {
  planejarOverridesAdministrativos,
  resolverVersaoAutorizacao,
  validarDelegacaoPermissoes,
} from "./personalizacao-permissoes";

const catalogo: PermissaoAdministrativaChave[] = [
  "painel.visualizar",
  "produtos.visualizar",
  "produtos.administrar",
  "produtos.publicar",
];

test("função e override produzem somente a personalização necessária", () => {
  const overrides = planejarOverridesAdministrativos({
    permissoesCatalogo: catalogo,
    permissoesDesejadas: new Set([
      "painel.visualizar",
      "produtos.visualizar",
      "produtos.publicar",
    ]),
    permissoesFuncao: new Set([
      "painel.visualizar",
      "produtos.visualizar",
      "produtos.administrar",
    ]),
  });
  assert.deepEqual(overrides, [
    { efeito: "negar", permissao: "produtos.administrar" },
    { efeito: "permitir", permissao: "produtos.publicar" },
  ]);
});

test("configuração idêntica ao preset não cria overrides", () => {
  const funcao = new Set<PermissaoAdministrativaChave>([
    "painel.visualizar",
    "produtos.visualizar",
    "produtos.administrar",
  ]);
  assert.deepEqual(
    planejarOverridesAdministrativos({
      permissoesCatalogo: catalogo,
      permissoesDesejadas: funcao,
      permissoesFuncao: funcao,
    }),
    [],
  );
});

test("alteração incrementa uma vez e idempotência preserva a versão", () => {
  assert.equal(
    resolverVersaoAutorizacao({ alterado: true, versaoAtual: 7 }),
    8,
  );
  assert.equal(
    resolverVersaoAutorizacao({ alterado: false, versaoAtual: 7 }),
    7,
  );
});

test("administrador limitado não delega permissão superior", () => {
  assert.throws(() =>
    validarDelegacaoPermissoes({
      atorPrincipal: false,
      permissoesAtor: new Set(["painel.visualizar"]),
      permissoesDesejadas: new Set([
        "painel.visualizar",
        "produtos.administrar",
      ]),
    }),
  );
});

test("principal pode delegar qualquer permissão ativa validada", () => {
  assert.doesNotThrow(() =>
    validarDelegacaoPermissoes({
      atorPrincipal: true,
      permissoesAtor: new Set(),
      permissoesDesejadas: new Set(["administradores.administrar"]),
    }),
  );
});

test("página e mutation possuem guards próprios e invariantes", () => {
  const pagina = readFileSync(
    "src/app/admin/configuracoes/usuarios-e-permissoes/page.tsx",
    "utf8",
  );
  const query = readFileSync(
    "src/features/administradores/queries/listar-administradores.ts",
    "utf8",
  );
  const action = readFileSync(
    "src/features/administradores/actions/salvar-acesso-administrador.ts",
    "utf8",
  );
  assert.match(pagina, /ADMINISTRADORES\.VISUALIZAR/);
  assert.match(query, /ADMINISTRADORES\.VISUALIZAR/);
  assert.match(action, /ADMINISTRADORES\.ADMINISTRAR/);
  assert.match(action, /podeAdmin\(contexto, permissao\)/);
  assert.match(action, /ALTERACAO_PRINCIPAL_BLOQUEADA/);
  assert.match(action, /ULTIMO_PRINCIPAL_ATIVO/);
  assert.match(action, /versaoAutorizacao: novaVersao/);
  assert.match(action, /nenhumaMudanca/);
});

test("tela global expõe somente a permissão de entrada do Atendente IA", () => {
  const fonte = readFileSync(
    "src/features/administradores/components/admin/pagina-usuarios-permissoes.tsx",
    "utf8",
  );
  assert.match(fonte, /atendente_ia\.acessar/);
  assert.doesNotMatch(fonte, /gestor_principal|revisor|visualizador/);
});
