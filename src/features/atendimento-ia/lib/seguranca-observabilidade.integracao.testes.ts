import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";

import { eq } from "drizzle-orm";

import { atendimentoIaAuditoriasTable, atendimentoIaLimitesUsoTable } from "@/db/schema";
import { dbTransacional, encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import { RepositorioSegurancaObservabilidadeDrizzle } from "../actions/repositorio-seguranca-observabilidade-drizzle";
import { consultarMetricasOperacionais } from "../queries/consultar-metricas-operacionais";

const correlacaoId = randomUUID();
const repositorio = new RepositorioSegurancaObservabilidadeDrizzle();
const ids: string[] = [];

after(async () => {
  if (ids.length) await dbTransacional.delete(atendimentoIaAuditoriasTable).where(eq(atendimentoIaAuditoriasTable.correlacaoId, correlacaoId));
  await dbTransacional.delete(atendimentoIaLimitesUsoTable).where(eq(atendimentoIaLimitesUsoTable.recurso, `teste-${correlacaoId}`));
  await encerrarBancoTransacionalIntegracao();
});

test("auditoria real sanitiza, correlaciona e impede reescrita", async () => {
  const evento = await repositorio.registrar({
    categoria: "seguranca", correlacaoId, evento: "evento_seguranca_bloqueado",
    metadados: { authorization: "Bearer proibido", classe: "prompt_injection" },
    referenciaSessaoHash: "hash-sem-identidade", resultado: "recusa",
    severidade: "atencao", tipoAtor: "visitante",
  });
  ids.push(evento.id);
  await assert.rejects(dbTransacional.update(atendimentoIaAuditoriasTable)
    .set({ evento: "reescrito" }).where(eq(atendimentoIaAuditoriasTable.id, evento.id)));
  const [persistido] = await dbTransacional.select().from(atendimentoIaAuditoriasTable)
    .where(eq(atendimentoIaAuditoriasTable.id, evento.id));
  assert.equal(persistido.evento, "evento_seguranca_bloqueado");
  assert.doesNotMatch(JSON.stringify(persistido.metadados), /Bearer|proibido/i);
});

test("correção cria novo evento relacionado e preserva o original", async () => {
  const correcao = await repositorio.registrarCorrecao({
    correlacaoId, eventoAnteriorId: ids[0], justificativa: "Classificação ajustada pelo processo de teste.", processo: "teste_local",
  });
  ids.push(correcao.id);
  const eventos = await dbTransacional.select().from(atendimentoIaAuditoriasTable)
    .where(eq(atendimentoIaAuditoriasTable.correlacaoId, correlacaoId));
  assert.equal(eventos.length, 2);
  assert.equal(eventos.find((item) => item.id === correcao.id)?.corrigeEventoId, ids[0]);
});

test("limite persistente é atômico, proporcional e isolado por referência", async () => {
  const recurso = `teste-${correlacaoId}`;
  const agora = new Date();
  const resultados = await Promise.all([1, 2, 3].map(() => repositorio.consumirLimite({
    agora, escopo: "sessao", janelaEmMs: 60_000, limite: 2, recurso, referencia: "sessao-a",
  })));
  assert.deepEqual(resultados.map((item) => item.quantidade).sort(), [1, 2, 3]);
  assert.equal(resultados.filter((item) => item.permitido).length, 2);
  assert.equal((await repositorio.consumirLimite({ agora, escopo: "sessao", janelaEmMs: 60_000, limite: 2, recurso, referencia: "sessao-b" })).permitido, true);
});

test("consulta interna agrega apenas fatos permitidos e exige menor privilégio", async () => {
  const agora = new Date();
  const metricas = await consultarMetricasOperacionais({
    acesso: { finalidade: "seguranca", permissao: "atendimento_ia_metricas_leitura", usuarioInternoId: "operador-teste" },
    ate: new Date(agora.getTime() + 1_000), desde: new Date(agora.getTime() - 60_000),
  });
  assert.ok(metricas.eventos.some((item) => item.evento === "evento_seguranca_bloqueado"));
  assert.doesNotMatch(JSON.stringify(metricas), /satisfacao|receita|venda_causada|problema_resolvido/i);
  await assert.rejects(consultarMetricasOperacionais({
    acesso: { finalidade: "seguranca", permissao: "invalida" as never, usuarioInternoId: "operador-teste" },
    ate: new Date(agora.getTime() + 1_000), desde: new Date(agora.getTime() - 60_000),
  }), /ACESSO_METRICAS_NAO_AUTORIZADO/);
});
