import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";

import { eq } from "drizzle-orm";

import {
  atendimentoIaAuditoriasTable,
  atendimentoIaConversasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaTransferenciasTable,
} from "@/db/schema";
import { dbTransacional, encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import { RepositorioConfirmacoesFerramentasDrizzle } from "../../actions/repositorio-confirmacoes-ferramentas-drizzle";
import { RepositorioTransferenciaHumanaDrizzle } from "../../actions/repositorio-transferencia-humana-drizzle";
import type { IdentidadeEntradaAtendimento } from "../../types/entrada-mensagem";
import { criarFluxoTransferenciaWhatsapp } from "./fluxo-transferencia-whatsapp";

const sufixo = randomUUID();
const identidade: IdentidadeEntradaAtendimento = {
  identificadorSessao: `sessao-transferencia-${sufixo}`,
  usuarioId: null,
};
let conversaId = "";
let execucaoId = "";

const resumo = {
  fatos_verificados: ["Produto público localizado no catálogo autorizado."],
  identificador_seguro_atendimento: `ATD-${sufixo.slice(0, 8).toUpperCase()}`,
  informacoes_declaradas: ["Cliente declarou precisar de orientação adicional."],
  interpretacao_necessidade: "Orientação da equipe sobre uma dúvida pública.",
  motivo: "solicitacao_cliente" as const,
  necessidade_principal: "Conversar com a equipe da loja.",
  pendencia_validacao_humana: "Equipe deve avaliar a dúvida sem executar ação automática.",
  produto_ou_pedido_relacionado: "Produto público",
};

after(async () => {
  if (conversaId) {
    await dbTransacional.delete(atendimentoIaAuditoriasTable)
      .where(eq(atendimentoIaAuditoriasTable.conversaId, conversaId));
    await dbTransacional.delete(atendimentoIaConversasTable)
      .where(eq(atendimentoIaConversasTable.id, conversaId));
  }
  await encerrarBancoTransacionalIntegracao();
});

test("prepara conversa e execução somente no PostgreSQL local descartável", async () => {
  const [conversa] = await dbTransacional.insert(atendimentoIaConversasTable).values({
    identificadorSessao: identidade.identificadorSessao,
    status: "ativa",
  }).returning({ id: atendimentoIaConversasTable.id });
  conversaId = conversa.id;
  const [execucao] = await dbTransacional.insert(atendimentoIaExecucoesTable).values({
    conversaId,
    modelo: "mock-local-sem-openai",
  }).returning({ id: atendimentoIaExecucoesTable.id });
  execucaoId = execucao.id;
});

test("repositórios reais executam oferta, revisão, confirmação e link idempotente", async () => {
  const fluxo = criarFluxoTransferenciaWhatsapp({
    obterWhatsappOficial: () => "+55 (11) 99999-9999",
    repositorio: new RepositorioTransferenciaHumanaDrizzle(),
    repositorioConfirmacoes: new RepositorioConfirmacoesFerramentasDrizzle(),
    validarDadosParticulares: async () => false,
    validadeEmMs: 60_000,
  });
  const oferta = await fluxo.oferecer({
    capacidadesSegurasDisponiveis: false,
    chaveIdempotencia: `oferta-${sufixo}`,
    conversaId,
    execucaoId,
    identidade,
    mensagemId: null,
    motivo: "solicitacao_cliente",
  });
  assert.ok(oferta);
  assert.equal((await fluxo.oferecer({
    capacidadesSegurasDisponiveis: false,
    chaveIdempotencia: `oferta-${sufixo}`,
    conversaId,
    execucaoId,
    identidade,
    mensagemId: null,
    motivo: "solicitacao_cliente",
  }))?.id, oferta.id);
  assert.equal(await fluxo.responderOferta({ aceitar: true, identidade, transferenciaId: oferta.id }), true);
  assert.ok(await fluxo.prepararResumo({ contemDadosParticulares: false, identidade, resumo, transferenciaId: oferta.id }));
  assert.equal(await fluxo.confirmarResumo({ identidade, resposta: "sim", transferenciaId: oferta.id }), true);
  const primeiro = await fluxo.gerarLink({ chaveIdempotencia: `link-${sufixo}`, identidade, transferenciaId: oferta.id });
  const repetido = await fluxo.gerarLink({ chaveIdempotencia: `link-${sufixo}`, identidade, transferenciaId: oferta.id });
  assert.equal(primeiro.status, "link_gerado");
  assert.equal(repetido.link, primeiro.link);
  assert.match(primeiro.link ?? "", /^https:\/\/wa\.me\/5511999999999\?text=/);
  assert.equal(await fluxo.registrarAbertura({ identidade, transferenciaId: oferta.id }), true);

  const [persistida] = await dbTransacional.select().from(atendimentoIaTransferenciasTable)
    .where(eq(atendimentoIaTransferenciasTable.id, oferta.id));
  assert.equal(persistida.status, "whatsapp_aberto");
  assert.equal(persistida.usuarioId, null);
  assert.equal(persistida.referenciaExterna, null);
  assert.equal(persistida.dadosConfirmados && Object.keys(persistida.dadosConfirmados).length, 0);
});

test("isolamento de sessão e limpeza preservam ausência de dados temporários", async () => {
  const repositorio = new RepositorioTransferenciaHumanaDrizzle();
  const [registro] = await dbTransacional.select({ id: atendimentoIaTransferenciasTable.id })
    .from(atendimentoIaTransferenciasTable)
    .where(eq(atendimentoIaTransferenciasTable.conversaId, conversaId));
  assert.ok(registro);
  assert.equal(await repositorio.buscar(registro.id, { identificadorSessao: "sessao-alheia", usuarioId: null }), null);

  await dbTransacional.delete(atendimentoIaAuditoriasTable)
    .where(eq(atendimentoIaAuditoriasTable.conversaId, conversaId));
  await dbTransacional.delete(atendimentoIaConversasTable)
    .where(eq(atendimentoIaConversasTable.id, conversaId));
  const restantes = await dbTransacional.select({ id: atendimentoIaTransferenciasTable.id })
    .from(atendimentoIaTransferenciasTable)
    .where(eq(atendimentoIaTransferenciasTable.conversaId, conversaId));
  assert.equal(restantes.length, 0);
  conversaId = "";
});
