import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("./CategoryFaqSection.tsx", import.meta.url),
  "utf8",
);
const action = readFileSync(
  new URL("../actions/faqs-categoria.ts", import.meta.url),
  "utf8",
);

test("categoria nova mantém seção visível e bloqueada até possuir ID", () => {
  assert.match(
    componente,
    /Salve a categoria antes de adicionar perguntas frequentes\./,
  );
  assert.match(componente, /disabled=\{!categoriaId/);
});

test("interface cobre vazio, loading, erro com retry e feedback", () => {
  assert.match(componente, /Nenhuma pergunta frequente cadastrada/);
  assert.match(componente, /Carregando perguntas frequentes/);
  assert.match(componente, /role="alert"/);
  assert.match(componente, /Tentar novamente/);
  assert.match(componente, /toast\.success/);
  assert.match(componente, /toast\.error/);
});

test("CRUD possui validação, status, confirmação e proteção contra repetição", () => {
  assert.match(componente, /Criar pergunta/);
  assert.match(componente, /Salvar pergunta/);
  assert.match(componente, /alterarStatusFaqCategoria/);
  assert.match(componente, /window\.confirm/);
  assert.match(componente, /excluindo \|\|/);
  assert.match(componente, /salvando \|\|/);
});

test("erro de persistência não limpa o conteúdo digitado", () => {
  const blocoSalvar = componente.slice(
    componente.indexOf("const salvar = async"),
    componente.indexOf("return (", componente.indexOf("const salvar = async")),
  );
  assert.match(blocoSalvar, /catch \(erro\)/);
  assert.doesNotMatch(
    blocoSalvar,
    /setCampos\(\{ answer: "", question: "" \}\)/,
  );
});

test("operações pendentes desabilitam seus controles", () => {
  assert.match(componente, /disabled=\{desabilitado \|\| salvando\}/);
  assert.match(componente, /disabled=\{desabilitado \|\| alterandoStatus\}/);
  assert.match(componente, /disabled=\{desabilitado \|\| excluindo\}/);
  assert.match(
    componente,
    /disabled=\{!categoriaId \|\| !ordemAlterada \|\| reordenando\}/,
  );
});

test("reordenação oferece mouse, teclado, salvamento explícito e rollback", () => {
  assert.match(componente, /PointerSensor/);
  assert.match(componente, /KeyboardSensor/);
  assert.match(componente, /sortableKeyboardCoordinates/);
  assert.match(componente, /Salvar ordem/);
  assert.match(componente, /setFaqs\(ordemPersistida\)/);
});

test("recarregamento consulta novamente os dados persistidos", () => {
  assert.match(componente, /const carregar = useCallback\(async/);
  assert.match(componente, /setFaqs\(resultado\)/);
  assert.match(componente, /void carregar\(\)/);
  assert.match(componente, /\[carregar, categoriaId\]/);
});

test("actions sempre condicionam mutações ao ID da categoria e atualizam ordem uma vez", () => {
  assert.match(action, /eq\(categoryFaqTable\.categoryId, idCategoria\)/);
  assert.match(action, /Um único UPDATE evita ordem parcialmente persistida/);
  assert.match(action, /validarEscopoOrdemFaqs/);
});
