import assert from "node:assert/strict";
import test from "node:test";

import type { FontesFerramentasProtegidas } from "../../queries/fontes-ferramentas-protegidas";
import type { ConfirmacaoFerramenta, RepositorioConfirmacoesFerramentas, VinculoOperacaoConfirmada } from "../../types/confirmacoes-ferramentas";
import type { ResultadoFerramentaProtegida } from "../../types/ferramentas-protegidas";
import type { RepositorioExecucoesFerramentas } from "../../types/ferramentas-publicas";
import { criarCatalogoFerramentasPublicas } from "../ferramentas-publicas/catalogo-ferramentas-publicas";
import { criarCatalogoFerramentasProtegidas } from "./catalogo-ferramentas-protegidas";
import { criarGestorConfirmacoesFerramentas, ErroResultadoIncerto } from "./confirmacoes-ferramentas";
import { criarExecutorFerramentasProtegidas } from "./executar-ferramenta-protegida";
import { criarRegistroFerramentasAutorizadas } from "./registro-ferramentas-autorizadas";

const contexto = {
  conversaId: "11111111-1111-4111-8111-111111111111",
  execucaoId: "22222222-2222-4222-8222-222222222222",
  identificadorSessaoHash: "hash-seguro",
  usuarioIdEsperado: "usuario-1",
};
const usuariosConsultados: string[] = [];

function fontes(): FontesFerramentasProtegidas {
  return {
    async consultarEnderecos(usuarioId: string) {
      usuariosConsultados.push(usuarioId);
      return [{ bairro: "Cen*****", cep: "123**-***", cidade: "Cidade", estado: "SP", principal: true, rua: "Rua*****" }];
    },
    async consultarPedido(usuarioId: string, pedidoId: string) {
      usuariosConsultados.push(usuarioId);
      if (pedidoId.endsWith("2")) return null;
      return { criado_em: "2026-08-01T12:00:00.000Z", itens: [], numero_pedido: "P-1", pagamento: "pago", rastreio: "ABCD****", situacao: "confirmado", total_em_centavos: 1000 };
    },
    async listarPedidos(usuarioId: string, limite: number) {
      usuariosConsultados.push(usuarioId);
      return [{ criado_em: "2026-08-01T12:00:00.000Z", numero_pedido: "P-1", pagamento: "pago", referencia_pedido: "33333333-3333-4333-8333-333333333331", situacao: "confirmado", total_em_centavos: 1000 }].slice(0, limite);
    },
  } as unknown as FontesFerramentasProtegidas;
}

function repositorioExecucao(): RepositorioExecucoesFerramentas & { argumentos?: Record<string, unknown>; resultado?: unknown } {
  return {
    async reivindicar(dados) { this.argumentos = dados.argumentos; return { execucaoFerramentaId: "f-1", tipo: "adquirida" }; },
    async concluir(dados) { this.resultado = dados.resultado; },
    async falhar() {},
  };
}

test("registro explicita quatro níveis e deixa operações sem fluxo bloqueadas", () => {
  const catalogo = criarCatalogoFerramentasProtegidas(fontes());
  const publicas = criarCatalogoFerramentasPublicas({} as never);
  const registro = criarRegistroFerramentasAutorizadas({ protegidas: catalogo, publicas });
  assert.deepEqual(new Set([...registro.values()].map((f) => f.nivel)), new Set(["publica", "autenticada", "confirmada", "proibida"]));
  assert.equal(catalogo.get("listar_pedidos_cliente")?.habilitada, true);
  assert.equal(catalogo.get("solicitar_cancelamento_pedido")?.habilitada, false);
  assert.equal(catalogo.get("alterar_preco")?.nivel, "proibida");
});

test("executor aplica default deny, schema estrito e autenticação", async () => {
  const catalogo = criarCatalogoFerramentasProtegidas(fontes());
  const repositorio = repositorioExecucao();
  let sessaoValida = false;
  const executor = criarExecutorFerramentasProtegidas({
    catalogo,
    repositorio,
    resolvedorSessao: { async resolver() { return sessaoValida ? { expiraEm: new Date(Date.now() + 60_000), referenciaHash: "h", usuarioId: "usuario-1" } : null; } },
  });
  const base = { argumentosJson: "{}", chamadaId: "c", contextoSeguro: contexto, execucaoId: contexto.execucaoId };
  assert.equal((await executor.executar({ ...base, nome: "nao_cadastrada" })).status, "bloqueada");
  assert.equal((await executor.executar({ ...base, nome: "alterar_preco" })).status, "bloqueada");
  assert.equal((await executor.executar({ ...base, argumentosJson: '{"limite":1,"token":"segredo"}', nome: "listar_pedidos_cliente" })).status, "bloqueada");
  assert.equal((await executor.executar({ ...base, argumentosJson: '{"limite":1}', nome: "listar_pedidos_cliente" })).status, "autenticacao_necessaria");
  sessaoValida = true;
  const retorno = await executor.executar({ ...base, argumentosJson: '{"limite":1}', nome: "listar_pedidos_cliente" });
  assert.equal(retorno.status, "concluida");
  assert.ok(!JSON.stringify(contexto).match(/cookie|password|senha|token/i));
});

test("propriedade é aplicada pela fonte e recurso alheio é não enumerável", async () => {
  const executor = criarExecutorFerramentasProtegidas({
    catalogo: criarCatalogoFerramentasProtegidas(fontes()),
    repositorio: repositorioExecucao(),
    resolvedorSessao: { async resolver() { return { expiraEm: new Date(Date.now() + 60_000), referenciaHash: "h", usuarioId: "dono-real" }; } },
  });
  const executar = (id: string) => executor.executar({ argumentosJson: JSON.stringify({ referencia_pedido: id }), chamadaId: "c", contextoSeguro: { ...contexto, usuarioIdEsperado: "dono-real" }, execucaoId: contexto.execucaoId, nome: "consultar_pedido_cliente" });
  assert.equal((await executar("33333333-3333-4333-8333-333333333332")).status, "nao_encontrada");
  const proprio = await executar("33333333-3333-4333-8333-333333333331");
  assert.equal(proprio.status, "concluida");
  assert.equal(usuariosConsultados.at(-1), "dono-real");
  assert.doesNotMatch(JSON.stringify(proprio), /dono-real/);
});

test("sessão expirada e identidade divergente são recusadas no servidor", async () => {
  const catalogo = criarCatalogoFerramentasProtegidas(fontes());
  const executarCom = async (expiraEm: Date, usuarioId: string) => criarExecutorFerramentasProtegidas({
    catalogo,
    repositorio: repositorioExecucao(),
    resolvedorSessao: { async resolver() { return { expiraEm, referenciaHash: "h", usuarioId }; } },
  }).executar({ argumentosJson: '{"limite":1}', chamadaId: "c", contextoSeguro: contexto, execucaoId: contexto.execucaoId, nome: "listar_pedidos_cliente" });
  assert.equal((await executarCom(new Date(0), "usuario-1")).status, "autenticacao_necessaria");
  assert.equal((await executarCom(new Date(Date.now() + 60_000), "usuario-alheio")).status, "nao_autorizada");
});

class RepositorioConfirmacoesFake implements RepositorioConfirmacoesFerramentas {
  confirmacoes: ConfirmacaoFerramenta[] = [];
  operacoes = new Map<string, { status: string; resultado?: ResultadoFerramentaProtegida }>();
  auditorias: unknown[] = [];
  falharAuditoria = false;
  async buscar(id: string) { return this.confirmacoes.find((item) => item.id === id) ?? null; }
  async criar(d: Parameters<RepositorioConfirmacoesFerramentas["criar"]>[0]) { const item: ConfirmacaoFerramenta = { ...d, id: `conf-${this.confirmacoes.length + 1}`, status: "pendente" }; this.confirmacoes.push(item); return item; }
  async invalidarDivergentes(d: Parameters<RepositorioConfirmacoesFerramentas["invalidarDivergentes"]>[0]) { let n = 0; for (const c of this.confirmacoes) if (c.conversaId === d.conversaId && ["pendente", "confirmada"].includes(c.status) && c.hashParametros !== d.hashParametros) { c.status = "invalidada"; n++; } return n; }
  async expirar(agora: Date) { let n = 0; for (const c of this.confirmacoes) if (["pendente", "confirmada"].includes(c.status) && c.expiraEm <= agora) { c.status = "expirada"; n++; } return n; }
  async confirmarUnica(d: Parameters<RepositorioConfirmacoesFerramentas["confirmarUnica"]>[0]) { const itens = this.confirmacoes.filter((c) => c.conversaId === d.conversaId && c.usuarioId === d.usuarioId && c.referenciaSessaoHash === d.referenciaSessaoHash && c.status === "pendente" && c.expiraEm > d.agora); if (itens.length !== 1) return null; itens[0].status = "confirmada"; return itens[0]; }
  async cancelarPendentes(d: Parameters<RepositorioConfirmacoesFerramentas["cancelarPendentes"]>[0]) { const itens = this.confirmacoes.filter((c) => c.conversaId === d.conversaId && c.usuarioId === d.usuarioId && ["pendente", "confirmada"].includes(c.status)); itens.forEach((c) => c.status = "cancelada"); return itens.length; }
  async consumir(d: Parameters<RepositorioConfirmacoesFerramentas["consumir"]>[0]) { const c = this.confirmacoes.find((x) => x.id === d.confirmacaoId && x.hashParametros === d.hashParametros && x.status === "confirmada"); if (!c) return false; c.status = "consumida"; return true; }
  async reivindicarOperacao(d: Parameters<RepositorioConfirmacoesFerramentas["reivindicarOperacao"]>[0]) { const anterior = this.operacoes.get(d.chaveIdempotencia); if (anterior?.status === "concluida") return { tipo: "concluida" as const, resultado: anterior.resultado! }; if (anterior?.status === "resultado_incerto") return { tipo: "resultado_incerto" as const }; if (anterior) return { tipo: "em_processamento" as const }; this.operacoes.set(d.chaveIdempotencia, { status: "processando" }); return { operacaoId: d.chaveIdempotencia, tipo: "adquirida" as const }; }
  async concluirOperacao(d: Parameters<RepositorioConfirmacoesFerramentas["concluirOperacao"]>[0]) { this.operacoes.set(d.operacaoId, { resultado: d.resultado, status: "concluida" }); }
  async falharOperacao(d: Parameters<RepositorioConfirmacoesFerramentas["falharOperacao"]>[0]) { this.operacoes.set(d.operacaoId, { status: d.resultadoIncerto ? "resultado_incerto" : "falha_sem_execucao" }); }
  async auditar(evento: string, dados: Record<string, unknown>) { if (this.falharAuditoria) throw new Error("AUDITORIA_INDISPONIVEL"); this.auditorias.push({ dados, evento }); }
}

const vinculo: VinculoOperacaoConfirmada = {
  acao: "acao_teste", conversaId: contexto.conversaId, execucaoId: contexto.execucaoId,
  ferramenta: "ferramenta_confirmada_teste", parametrosEssenciais: { valor: 1 },
  recursoId: "recurso-1", recursoTipo: "pedido", referenciaSessaoHash: "sessao-hash", usuarioId: "usuario-1",
};

test("confirmação é exata, curta, inequívoca, cancelável e invalidada por mudança", async () => {
  const repo = new RepositorioConfirmacoesFake();
  let instante = new Date("2026-08-01T12:00:00Z");
  const gestor = criarGestorConfirmacoesFerramentas({ agora: () => instante, repositorio: repo, validadeEmMs: 60_000 });
  const primeira = await gestor.solicitar(vinculo);
  assert.equal(await gestor.responder({ conversaId: vinculo.conversaId, referenciaSessaoHash: vinculo.referenciaSessaoHash, resposta: "talvez", usuarioId: vinculo.usuarioId }), null);
  assert.equal((await gestor.responder({ conversaId: vinculo.conversaId, referenciaSessaoHash: vinculo.referenciaSessaoHash, resposta: "SIM", usuarioId: vinculo.usuarioId }))?.id, primeira.id);
  await gestor.solicitar({ ...vinculo, parametrosEssenciais: { valor: 2 } });
  assert.equal(primeira.status, "invalidada");
  assert.equal(await gestor.cancelar({ conversaId: vinculo.conversaId, usuarioId: vinculo.usuarioId }), 1);
  const expira = await gestor.solicitar(vinculo);
  instante = new Date(instante.getTime() + 60_001);
  assert.equal(await gestor.responder({ conversaId: vinculo.conversaId, referenciaSessaoHash: vinculo.referenciaSessaoHash, resposta: "sim", usuarioId: vinculo.usuarioId }), null);
  assert.equal(expira.status, "expirada");
});

test("execução revalida, consome uma vez e preserva idempotência e incerteza", async () => {
  const repo = new RepositorioConfirmacoesFake();
  const gestor = criarGestorConfirmacoesFerramentas({ repositorio: repo, validadeEmMs: 60_000 });
  const c = await gestor.solicitar(vinculo); c.status = "confirmada";
  let efeitos = 0;
  const dados = { chaveIdempotencia: "idem-1", confirmacao: c, execucaoId: vinculo.execucaoId, vinculoAtual: vinculo,
    revalidar: async () => "autorizada" as const,
    executarEfeito: async () => { efeitos++; return { dados: { referencia: "ok" }, status: "concluida" as const }; },
  };
  assert.equal((await gestor.executar(dados)).status, "concluida");
  assert.equal((await gestor.executar(dados)).status, "ja_executada");
  assert.equal(efeitos, 1);
  const c2 = await gestor.solicitar(vinculo); c2.status = "confirmada";
  const inelegivel = await gestor.executar({ ...dados, chaveIdempotencia: "idem-2", confirmacao: c2, revalidar: async () => "nao_elegivel" as const });
  assert.equal(inelegivel.status, "nao_elegivel");
  const c3 = await gestor.solicitar(vinculo); c3.status = "confirmada";
  const incerto = await gestor.executar({ ...dados, chaveIdempotencia: "idem-3", confirmacao: c3, executarEfeito: async () => { throw new ErroResultadoIncerto(); } });
  assert.equal(incerto.status, "resultado_incerto");
  const repetido = await gestor.executar({ ...dados, chaveIdempotencia: "idem-3", confirmacao: { ...c3, status: "confirmada" } });
  assert.equal(repetido.status, "resultado_incerto");
});

test("indisponibilidade da auditoria impede efeito protegido", async () => {
  const repo = new RepositorioConfirmacoesFake();
  const gestor = criarGestorConfirmacoesFerramentas({ repositorio: repo, validadeEmMs: 60_000 });
  const confirmacao = await gestor.solicitar(vinculo);
  confirmacao.status = "confirmada";
  repo.falharAuditoria = true;
  let efeitos = 0;
  const resultado = await gestor.executar({
    chaveIdempotencia: "auditoria-indisponivel", confirmacao, execucaoId: vinculo.execucaoId,
    executarEfeito: async () => { efeitos += 1; return { dados: null, status: "concluida" }; },
    revalidar: async () => "autorizada", vinculoAtual: vinculo,
  });
  assert.equal(resultado.status, "falha_sem_execucao");
  assert.equal(efeitos, 0);
});
