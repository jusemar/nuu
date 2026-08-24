import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (arquivo: string) => readFileSync(arquivo, "utf8");

test("páginas restantes possuem gates explícitos por módulo", () => {
  const gates = [
    ["src/app/admin/logistica/layout.tsx", "LOGISTICA.VISUALIZAR"],
    ["src/app/admin/logistics/layout.tsx", "LOGISTICA.VISUALIZAR"],
    ["src/app/admin/fornecedores/layout.tsx", "FORNECEDORES.VISUALIZAR"],
    ["src/app/admin/marcas/layout.tsx", "MARCAS.ADMINISTRAR"],
    ["src/app/admin/precificacao/page.tsx", "PRECIFICACAO.ADMINISTRAR"],
    [
      "src/app/admin/configuracoes/loja/page.tsx",
      "LOJA_CONFIGURACOES.ADMINISTRAR",
    ],
    [
      "src/app/admin/configuracoes/paginas-da-loja/page.tsx",
      "PAGINAS.ADMINISTRAR",
    ],
    [
      "src/app/admin/marketing/programa-fidelidade/page.tsx",
      "FIDELIDADE.ADMINISTRAR",
    ],
    ["src/app/admin/atendente-ia/layout.tsx", "ATENDENTE_IA.ACESSAR"],
  ] as const;

  for (const [arquivo, permissao] of gates) {
    const fonte = ler(arquivo);
    assert.match(fonte, /exigirPermissaoAdmin/);
    assert.ok(fonte.includes(`PERMISSOES_ADMIN.${permissao}`), arquivo);
  }
  const layout = ler("src/app/admin/layout.tsx");
  assert.match(layout, /caminho === "\/admin"/);
  assert.match(layout, /PAINEL\.VISUALIZAR/);
});

test("mutations de módulos simples exigem sua permissão antes da escrita", () => {
  const casos = [
    [
      "src/features/admin/marcas/services/marcaService.ts",
      "MARCAS.ADMINISTRAR",
    ],
    [
      "src/features/precificacao/actions/atualizar-configuracao-pagamento.ts",
      "PRECIFICACAO.ADMINISTRAR",
    ],
    [
      "src/features/configuracoes-loja/actions/salvar-configuracao-loja.ts",
      "LOJA_CONFIGURACOES.ADMINISTRAR",
    ],
    [
      "src/features/programa-fidelidade/actions/salvar-programa-fidelidade.ts",
      "FIDELIDADE.ADMINISTRAR",
    ],
    [
      "src/features/banners-home/actions/salvar-banner-home.ts",
      "BANNERS.ADMINISTRAR",
    ],
    [
      "src/features/paginas-dinamicas/lib/backend-paginas-dinamicas.ts",
      "PAGINAS.ADMINISTRAR",
    ],
  ] as const;
  for (const [arquivo, permissao] of casos) {
    const fonte = ler(arquivo);
    assert.match(fonte, /exigirPermissaoAdmin/);
    assert.ok(fonte.includes(`PERMISSOES_ADMIN.${permissao}`), arquivo);
  }
});

test("logística separa leitura, administração e sincronização", () => {
  const leitura = ler(
    "src/features/admin/logistica/queries/frete/servicos/listar-servicos-frete.ts",
  );
  const administracao = ler(
    "src/features/admin/logistica/actions/frete/servicos/criar-servico-frete.ts",
  );
  const sincronizacao = ler(
    "src/features/admin/logistica/actions/frete/sincronizar-catalogo-frenet.ts",
  );
  assert.match(leitura, /LOGISTICA\.VISUALIZAR/);
  assert.doesNotMatch(leitura, /LOGISTICA\.SINCRONIZAR/);
  assert.match(administracao, /LOGISTICA\.ADMINISTRAR/);
  assert.match(sincronizacao, /LOGISTICA\.SINCRONIZAR/);
});

test("fornecedores separa visualizar, importar e publicar", () => {
  const sessao = ler(
    "src/features/fornecedores/lib/sessao-fornecedores-admin.ts",
  );
  const importar = ler(
    "src/features/fornecedores/actions/importar-planilha-fornecedor.ts",
  );
  const publicar = ler(
    "src/features/fornecedores/actions/publicar-produtos-importacao-fornecedor.ts",
  );
  assert.match(sessao, /FORNECEDORES[\s\S]*\.ADMINISTRAR/);
  assert.match(importar, /FORNECEDORES\.IMPORTAR/);
  assert.match(publicar, /FORNECEDORES\.PUBLICAR/);
  assert.doesNotMatch(importar, /FORNECEDORES\.PUBLICAR/);
});

test("sidebar filtra itens, grupos vazios e mantém guard independente", () => {
  const sidebar = ler("src/features/admin/layout/components/sidebar.tsx");
  const layout = ler("src/app/admin/layout.tsx");
  assert.match(sidebar, /filtrarMenuAdmin/);
  assert.match(sidebar, /items\.length/);
  assert.match(sidebar, /administradores\.visualizar/);
  assert.match(layout, /exigirPermissaoAdmin/);
});

test("Atendente IA exige acesso global sem criar papel local automaticamente", () => {
  const acesso = ler(
    "src/features/atendimento-ia/queries/admin/permissoes/buscar-acesso-atendimento-ia.ts",
  );
  assert.match(acesso, /ATENDENTE_IA\.ACESSAR/);
  assert.match(acesso, /if \(!ultimoRegistro\) return null/);
  assert.doesNotMatch(acesso, /await bootstrapGestorPrincipalAtendimentoIa/);
});

test("presets novos são operacionais e não promovem principal", () => {
  const presets = ler(
    "src/features/administradores/constants/presets-administrativos.ts",
  );
  assert.match(presets, /chave: "logistica"/);
  assert.match(presets, /chave: "fornecedores"/);
  assert.match(presets, /chave: "administracao_loja"/);
  assert.doesNotMatch(presets, /administradorPrincipal|gestor_principal/);
});

test("login e recuperação reconhecem administrador persistido sem ADMIN_EMAILS", () => {
  const login = ler(
    "src/features/autenticacao/lib/plugin-login-identificador-admin.ts",
  );
  const autenticacao = ler("src/lib/auth.ts");
  assert.match(login, /vinculo\?\.status !== "ativo"/);
  assert.match(autenticacao, /vinculo\?\.status === "ativo"/);
  assert.doesNotMatch(login, /ADMIN_EMAILS|emailPossuiPermissaoAdmin/);
  assert.doesNotMatch(autenticacao, /ADMIN_EMAILS|emailPossuiPermissaoAdmin/);
});
