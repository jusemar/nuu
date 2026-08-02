import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";

import { and, eq, inArray } from "drizzle-orm";

import {
  atendimentoIaAuditoriasTable,
  atendimentoIaConfirmacoesFerramentasTable,
  atendimentoIaConversasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaOperacoesProtegidasTable,
  userTable,
} from "@/db/schema";
import { dbTransacional, encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import { RepositorioConfirmacoesFerramentasDrizzle } from "../../actions/repositorio-confirmacoes-ferramentas-drizzle";
import type { VinculoOperacaoConfirmada } from "../../types/confirmacoes-ferramentas";
import { criarGestorConfirmacoesFerramentas, ErroResultadoIncerto } from "./confirmacoes-ferramentas";

const sufixo = randomUUID();
const usuarioId = `teste-protegidas-${sufixo}`;
let conversaId = "";
let execucaoId = "";

after(async () => {
  if (conversaId) {
    await dbTransacional.delete(atendimentoIaAuditoriasTable).where(eq(atendimentoIaAuditoriasTable.conversaId, conversaId));
  }
  await dbTransacional.delete(userTable).where(eq(userTable.id, usuarioId));
  await encerrarBancoTransacionalIntegracao();
});

test("prepara somente referências temporárias no banco local", async () => {
  await dbTransacional.insert(userTable).values({ email: `${sufixo}@teste.local`, id: usuarioId, name: "Teste local" });
  const [conversa] = await dbTransacional.insert(atendimentoIaConversasTable).values({ identificadorSessao: `sessao-${sufixo}`, usuarioId }).returning({ id: atendimentoIaConversasTable.id });
  conversaId = conversa.id;
  const [execucao] = await dbTransacional.insert(atendimentoIaExecucoesTable).values({ conversaId, modelo: "mock-sem-openai" }).returning({ id: atendimentoIaExecucoesTable.id });
  execucaoId = execucao.id;
  assert.ok(conversaId && execucaoId);
});

test("repositório real deduplica solicitação e confirma exatamente uma vez", async () => {
  const repositorio = new RepositorioConfirmacoesFerramentasDrizzle();
  const gestor = criarGestorConfirmacoesFerramentas({ repositorio, validadeEmMs: 60_000 });
  const vinculo: VinculoOperacaoConfirmada = {
    acao: "acao_sintetica_sem_efeito", conversaId, execucaoId,
    ferramenta: "ferramenta_sintetica_bloqueada", parametrosEssenciais: { valor: 1 },
    recursoId: "recurso-sintetico", recursoTipo: "teste", referenciaSessaoHash: `hash-${sufixo}`, usuarioId,
  };
  const [a, b] = await Promise.all([gestor.solicitar(vinculo), gestor.solicitar(vinculo)]);
  assert.equal(a.id, b.id);
  const respostas = await Promise.all([1, 2].map(() => gestor.responder({ conversaId, referenciaSessaoHash: vinculo.referenciaSessaoHash, resposta: "sim", usuarioId })));
  assert.equal(respostas.filter(Boolean).length, 1);
  const confirmacao = respostas.find(Boolean)!;
  const executada = await gestor.executar({
    chaveIdempotencia: `idem-${sufixo}`, confirmacao, execucaoId,
    executarEfeito: async () => ({ dados: { resultado: "sintetico" }, status: "concluida" }),
    revalidar: async () => "autorizada",
    vinculoAtual: vinculo,
  });
  assert.equal(executada.status, "concluida");
  const repetida = await gestor.executar({
    chaveIdempotencia: `idem-${sufixo}`, confirmacao: { ...confirmacao, status: "consumida" }, execucaoId,
    executarEfeito: async () => { throw new Error("não deve executar"); },
    revalidar: async () => "autorizada", vinculoAtual: vinculo,
  });
  assert.equal(repetida.status, "ja_executada");
});

test("banco real preserva resultado incerto sem repetição automática", async () => {
  const repositorio = new RepositorioConfirmacoesFerramentasDrizzle();
  const gestor = criarGestorConfirmacoesFerramentas({ repositorio, validadeEmMs: 60_000 });
  const vinculo: VinculoOperacaoConfirmada = {
    acao: "acao_incerta_sintetica", conversaId, execucaoId,
    ferramenta: "ferramenta_sintetica_bloqueada", parametrosEssenciais: { valor: 2 },
    recursoId: "recurso-sintetico", recursoTipo: "teste", referenciaSessaoHash: `hash-${sufixo}`, usuarioId,
  };
  await gestor.solicitar(vinculo);
  const confirmacao = await gestor.responder({
    conversaId,
    referenciaSessaoHash: vinculo.referenciaSessaoHash,
    resposta: "sim",
    usuarioId,
  });
  assert.ok(confirmacao);
  const primeiro = await gestor.executar({ chaveIdempotencia: `incerto-${sufixo}`, confirmacao, execucaoId, executarEfeito: async () => { throw new ErroResultadoIncerto(); }, revalidar: async () => "autorizada", vinculoAtual: vinculo });
  assert.equal(primeiro.status, "resultado_incerto");
  const segundo = await gestor.executar({ chaveIdempotencia: `incerto-${sufixo}`, confirmacao: { ...confirmacao, status: "consumida" }, execucaoId, executarEfeito: async () => ({ dados: null, status: "concluida" }), revalidar: async () => "autorizada", vinculoAtual: vinculo });
  assert.equal(segundo.status, "resultado_incerto");
  const registros = await dbTransacional.select().from(atendimentoIaOperacoesProtegidasTable).where(eq(atendimentoIaOperacoesProtegidasTable.chaveIdempotencia, `incerto-${sufixo}`));
  assert.equal(registros.length, 1);
});

test("limpeza em cascata remove todos os dados temporários", async () => {
  await dbTransacional.delete(atendimentoIaAuditoriasTable).where(and(
    eq(atendimentoIaAuditoriasTable.conversaId, conversaId),
    inArray(atendimentoIaAuditoriasTable.evento, [
      "confirmacao_ferramenta_solicitada",
      "confirmacao_ferramenta_aceita",
      "operacao_protegida_concluida",
      "operacao_protegida_falhou",
      "operacao_protegida_repetida",
    ]),
  ));
  await dbTransacional.delete(userTable).where(eq(userTable.id, usuarioId));
  const confirmacoes = await dbTransacional.select({ id: atendimentoIaConfirmacoesFerramentasTable.id }).from(atendimentoIaConfirmacoesFerramentasTable).where(eq(atendimentoIaConfirmacoesFerramentasTable.usuarioId, usuarioId));
  assert.equal(confirmacoes.length, 0);
});
