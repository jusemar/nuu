import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { describe } from "node:test";

import { mascararDadosPessoaisAdmin } from "./mascarar-dados-pessoais-admin";
import { sanitizarMensagemAdmin } from "./sanitizar-conversa-admin";
import { sanitizarExecucaoAdmin } from "./sanitizar-execucao-admin";
import { sanitizarFerramentaAdmin } from "./sanitizar-ferramenta-admin";

describe("sanitização administrativa", () => {
  test("mascara email, telefone, CEP, segredo e limita texto", () => {
    const texto = mascararDadosPessoaisAdmin(
      "ana@example.com 11999998888 01001-000 sk-segredo",
      200,
    );
    assert.doesNotMatch(texto, /ana@example|11999998888|01001-000|sk-segredo/);
  });
  test("impede reidentificação por combinação de CPF, pedido, pagamento e endereço", () => {
    const original =
      "Ana ana@example.com CPF 123.456.789-01, pedido NUU-12345, cartão 4111 1111 1111 1111, chave PIX: 12345678901, Rua das Flores, 42, CEP 01001-000.";
    const texto = mascararDadosPessoaisAdmin(original, 500);
    for (const sensivel of [
      "ana@example.com",
      "123.456.789-01",
      "NUU-12345",
      "4111 1111 1111 1111",
      "12345678901",
      "Rua das Flores",
      "01001-000",
    ])
      assert.doesNotMatch(texto, new RegExp(sensivel.replaceAll(".", "\\."), "i"));
  });
  test("DTOs omitem argumentos, resultados, erros, prompts e raciocínio", () => {
    const ferramenta = sanitizarFerramentaAdmin({
      classificacao: "consulta_publica",
      duracaoEmMs: 10,
      nomeFerramenta: "consultar",
      status: "concluida",
    });
    const execucao = sanitizarExecucaoAdmin(
      {
        concluidoEm: null,
        duracaoEmMs: 10,
        iniciadoEm: new Date(0),
        modelo: "modelo",
        status: "concluida",
        tokensEntrada: 1,
        tokensSaida: 2,
      },
      [ferramenta],
    );
    const mensagem = sanitizarMensagemAdmin({
      autor: "cliente",
      conteudo: "Meu email é ana@example.com",
      criadoEm: new Date(0),
      id: "00000000-0000-4000-8000-000000000001",
      status: "concluida",
    });
    const serializado = JSON.stringify({ execucao, mensagem });
    for (const proibido of [
      "argumentos",
      "resultado",
      "erro",
      "prompt",
      "raciocinio",
      "chaveIdempotencia",
      "identificadorSessao",
    ])
      assert.equal(
        Object.prototype.hasOwnProperty.call(JSON.parse(serializado), proibido),
        false,
      );
    assert.doesNotMatch(serializado, /ana@example.com/);
  });
  test("queries são server-only, explícitas, autorizadas e sem select estrela", () => {
    const arquivos = [
      "inicio/buscar-resumo-treinamento.ts",
      "conhecimentos/listar-conhecimentos.ts",
      "conhecimentos/buscar-conhecimento.ts",
      "conhecimentos/listar-versoes.ts",
      "revisoes/listar-conversas-revisao.ts",
      "revisoes/buscar-conversa-sanitizada.ts",
      "revisoes/buscar-execucao-sanitizada.ts",
      "metricas/buscar-metricas-treinamento.ts",
    ];
    for (const arquivo of arquivos) {
      const conteudo = readFileSync(
        `src/features/atendimento-ia/queries/admin/${arquivo}`,
        "utf8",
      );
      assert.match(conteudo, /import "server-only"/);
      assert.match(conteudo, /exigirCapacidadeAtendimentoIa/);
      assert.doesNotMatch(conteudo, /select\s+\*/i);
    }
    const detalhe = readFileSync(
      "src/features/atendimento-ia/queries/admin/revisoes/buscar-conversa-sanitizada.ts",
      "utf8",
    );
    assert.match(detalhe, /atendimento_ia_conversa_admin_visualizada/);
    const lista = readFileSync(
      "src/features/atendimento-ia/queries/admin/revisoes/listar-conversas-revisao.ts",
      "utf8",
    );
    assert.doesNotMatch(lista, /AuditoriasTable|conversa_admin_visualizada/);
  });
});
