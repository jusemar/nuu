import assert from "node:assert/strict";
import test from "node:test";

import {
  possuiConteudoHtmlEditorial,
  sanitizarHtmlEditorialCategoria,
} from "./sanitizar-html-editorial-categoria";

test("remove conteúdo executável, protocolos perigosos e atributos livres", () => {
  const resultado = sanitizarHtmlEditorialCategoria(`
    <script>alert(1)</script>
    <p onclick="alert(2)">Conteúdo seguro</p>
    <a href="javascript:alert(3)" onmouseover="alert(4)">Link</a>
    <img src="data:image/svg+xml,<svg onload=alert(5)>" onerror="alert(6)">
    <iframe src="https://malicioso.test"></iframe>
    <form><input formaction="https://malicioso.test"></form>
    <object data="https://malicioso.test"></object>
  `);

  assert.doesNotMatch(
    resultado,
    /script|onclick|onmouseover|onerror|javascript:|data:|iframe|form|input|object/i,
  );
  assert.match(resultado, /<p>Conteúdo seguro<\/p>/);
});

test("mantém somente o HTML editorial e protocolos permitidos", () => {
  const resultado = sanitizarHtmlEditorialCategoria(`
    <h2>Guia</h2>
    <p style="text-align: center; position: fixed"><strong>Escolha</strong> com <em>segurança</em>.</p>
    <ul><li>Primeiro item</li></ul>
    <blockquote>Uma observação</blockquote>
    <table><tbody><tr><th>Tipo</th><td>Valor</td></tr></tbody></table>
    <a href="https://loja.test/guia" target="_blank">Saiba mais</a>
  `);

  assert.match(resultado, /<h2>Guia<\/h2>/);
  assert.match(resultado, /<strong>Escolha<\/strong>/);
  assert.match(resultado, /<ul><li>Primeiro item<\/li><\/ul>/);
  assert.match(resultado, /<table>/);
  assert.match(resultado, /href="https:\/\/loja\.test\/guia"/);
  assert.match(resultado, /rel="noopener noreferrer"/);
  assert.match(resultado, /text-align:center/);
  assert.doesNotMatch(resultado, /position/);
});

test("reserva h1 ao título principal e reconhece HTML editorial vazio", () => {
  assert.equal(
    sanitizarHtmlEditorialCategoria("<h1>Título indevido</h1>"),
    "Título indevido",
  );
  assert.equal(possuiConteudoHtmlEditorial("<p><br></p>"), false);
  assert.equal(possuiConteudoHtmlEditorial("<p>Conteúdo</p>"), true);
});
