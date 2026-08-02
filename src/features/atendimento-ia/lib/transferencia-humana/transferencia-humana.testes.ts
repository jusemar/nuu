import assert from "node:assert/strict";
import test from "node:test";

import type { ConfirmacaoFerramenta, RepositorioConfirmacoesFerramentas } from "../../types/confirmacoes-ferramentas";
import type { IdentidadeEntradaAtendimento } from "../../types/entrada-mensagem";
import type { RepositorioTransferenciaHumana, TransferenciaWhatsapp } from "../../types/transferencia-humana";
import { criarFluxoTransferenciaWhatsapp, criarIdentificadorSeguroAtendimento, deveOferecerTransferencia } from "./fluxo-transferencia-whatsapp";
import { gerarLinkWhatsappOficial, hashSeguro, normalizarWhatsappOficial, sanitizarResumoTransferencia } from "./gerar-link-whatsapp";

class ConfirmacoesFake implements RepositorioConfirmacoesFerramentas {
  itens: ConfirmacaoFerramenta[] = [];
  operacoes = new Map<string, { resultado?: Record<string, unknown>; status: string }>();
  async buscar(id: string) { return this.itens.find((item) => item.id === id) ?? null; }
  async criar(dados: Parameters<RepositorioConfirmacoesFerramentas["criar"]>[0]) { const existente = this.itens.find((i) => i.hashParametros === dados.hashParametros && ["pendente", "confirmada"].includes(i.status)); if (existente) return existente; const item = { ...dados, id: `c-${this.itens.length + 1}`, status: "pendente" as const }; this.itens.push(item); return item; }
  async invalidarDivergentes(dados: Parameters<RepositorioConfirmacoesFerramentas["invalidarDivergentes"]>[0]) { let total = 0; this.itens.forEach((i) => { if (i.conversaId === dados.conversaId && i.hashParametros !== dados.hashParametros && ["pendente", "confirmada"].includes(i.status)) { i.status = "invalidada"; total++; } }); return total; }
  async expirar(instante: Date) { let total = 0; this.itens.forEach((i) => { if (i.expiraEm <= instante && ["pendente", "confirmada"].includes(i.status)) { i.status = "expirada"; total++; } }); return total; }
  async confirmarUnica(dados: Parameters<RepositorioConfirmacoesFerramentas["confirmarUnica"]>[0]) { const itens = this.itens.filter((i) => i.conversaId === dados.conversaId && i.referenciaSessaoHash === dados.referenciaSessaoHash && i.usuarioId === dados.usuarioId && i.status === "pendente" && i.expiraEm > dados.agora); if (itens.length !== 1) return null; itens[0].status = "confirmada"; return itens[0]; }
  async cancelarPendentes(dados: Parameters<RepositorioConfirmacoesFerramentas["cancelarPendentes"]>[0]) { const itens = this.itens.filter((i) => i.conversaId === dados.conversaId && i.usuarioId === dados.usuarioId && ["pendente", "confirmada"].includes(i.status)); itens.forEach((i) => i.status = "cancelada"); return itens.length; }
  async consumir(dados: Parameters<RepositorioConfirmacoesFerramentas["consumir"]>[0]) { const item = this.itens.find((i) => i.id === dados.confirmacaoId && i.hashParametros === dados.hashParametros && i.status === "confirmada"); if (!item) return false; item.status = "consumida"; return true; }
  async reivindicarOperacao(dados: Parameters<RepositorioConfirmacoesFerramentas["reivindicarOperacao"]>[0]) { const item = this.operacoes.get(dados.chaveIdempotencia); if (item?.status === "concluida") return { resultado: item.resultado as never, tipo: "concluida" as const }; if (item?.status === "resultado_incerto") return { tipo: "resultado_incerto" as const }; if (item) return { tipo: "em_processamento" as const }; this.operacoes.set(dados.chaveIdempotencia, { status: "processando" }); return { operacaoId: dados.chaveIdempotencia, tipo: "adquirida" as const }; }
  async concluirOperacao(dados: Parameters<RepositorioConfirmacoesFerramentas["concluirOperacao"]>[0]) { this.operacoes.set(dados.operacaoId, { resultado: dados.resultado, status: "concluida" }); }
  async falharOperacao(dados: Parameters<RepositorioConfirmacoesFerramentas["falharOperacao"]>[0]) { this.operacoes.set(dados.operacaoId, { status: dados.resultadoIncerto ? "resultado_incerto" : "falha_sem_execucao" }); }
  async auditar() {}
}

class TransferenciasFake implements RepositorioTransferenciaHumana {
  itens: TransferenciaWhatsapp[] = [];
  auditorias: string[] = [];
  async buscar(id: string, identidade: IdentidadeEntradaAtendimento) { return this.itens.find((i) => i.id === id && i.usuarioId === identidade.usuarioId && i.referenciaSessaoHash === hashSessao(identidade.identificadorSessao)) ?? null; }
  async criarOferta(d: Parameters<RepositorioTransferenciaHumana["criarOferta"]>[0]) { const existente = this.itens.find((i) => i.conversaId === d.conversaId && i.motivo === d.motivo); if (existente) return existente; const item: TransferenciaWhatsapp = { confirmadoEm: null, conversaId: d.conversaId, execucaoId: d.execucaoId, expiraEm: null, hashResumo: null, id: `t-${this.itens.length + 1}`, motivo: d.motivo, ofertaConfirmadaEm: null, referenciaConfirmacaoId: null, referenciaDestinatarioHash: null, referenciaSessaoHash: d.referenciaSessaoHash, resumo: null, status: "oferecido", usuarioId: d.identidade.usuarioId }; this.itens.push(item); return item; }
  async registrarAceiteOferta(d: Parameters<RepositorioTransferenciaHumana["registrarAceiteOferta"]>[0]) { const i = this.itens.find((x) => x.id === d.id && x.status === "oferecido"); if (!i) return false; i.ofertaConfirmadaEm = d.instante; return true; }
  async prepararResumo(d: Parameters<RepositorioTransferenciaHumana["prepararResumo"]>[0]) { const i = this.itens.find((x) => x.id === d.id); if (!i) return false; i.expiraEm = d.expiraEm; i.hashResumo = d.hashResumo; i.resumo = d.resumo; i.status = "resumo_preparado"; i.referenciaConfirmacaoId = null; return true; }
  async atualizarDestinatario(d: Parameters<RepositorioTransferenciaHumana["atualizarDestinatario"]>[0]) { const i = this.itens.find((x) => x.id === d.id); if (!i) return false; i.referenciaDestinatarioHash = d.referenciaDestinatarioHash; return true; }
  async registrarConfirmacao(d: Parameters<RepositorioTransferenciaHumana["registrarConfirmacao"]>[0]) { const i = this.itens.find((x) => x.id === d.id); if (!i) return false; i.confirmadoEm = d.confirmadoEm; i.referenciaConfirmacaoId = d.referenciaConfirmacaoId; return true; }
  async registrarReferenciaConfirmacao(d: Parameters<RepositorioTransferenciaHumana["registrarReferenciaConfirmacao"]>[0]) { const i = this.itens.find((x) => x.id === d.id); if (!i) return false; i.referenciaConfirmacaoId = d.referenciaConfirmacaoId; return true; }
  async transicionar(d: Parameters<RepositorioTransferenciaHumana["transicionar"]>[0]) { const i = this.itens.find((x) => x.id === d.id && d.de.includes(x.status)); if (!i) return false; i.status = d.para; return true; }
  async auditar(evento: string) { this.auditorias.push(evento); }
}

function hashSessao(valor: string) { return hashSeguro(valor); }

const identidadeAnonima: IdentidadeEntradaAtendimento = { identificadorSessao: "sessao-anonima", usuarioId: null };
const identidadeAutenticada: IdentidadeEntradaAtendimento = { identificadorSessao: "sessao-auth", usuarioId: "usuario-1" };
const resumoBase = {
  fatos_verificados: ["Produto publicado localizado no catálogo."],
  identificador_seguro_atendimento: "ATD-12345678",
  informacoes_declaradas: ["Cliente declarou que precisa de ajuda adicional."],
  interpretacao_necessidade: "Cliente precisa de orientação da equipe.",
  motivo: "decisao_ou_acao_humana" as const,
  necessidade_principal: "Validar uma solicitação com a equipe.",
  pendencia_validacao_humana: "A equipe precisa analisar a solicitação.",
  produto_ou_pedido_relacionado: "Produto público",
};

function criarCenario(numero = "5511999999999", identidade = identidadeAnonima) {
  const repositorio = new TransferenciasFake();
  const confirmacoes = new ConfirmacoesFake();
  let numeroAtual = numero;
  const fluxo = criarFluxoTransferenciaWhatsapp({
    obterWhatsappOficial: () => numeroAtual,
    repositorio,
    repositorioConfirmacoes: confirmacoes,
    validarDadosParticulares: async ({ identidade: atual }) => Boolean(atual.usuarioId),
    validadeEmMs: 60_000,
  });
  return { confirmacoes, fluxo, identidade, repositorio, setNumero: (valor: string) => { numeroAtual = valor; } };
}

test("implementa todos os motivos e evita encaminhamento prematuro", () => {
  const motivos = ["solicitacao_cliente", "informacao_nao_confirmavel", "ferramenta_autorizada_ausente", "decisao_ou_acao_humana", "falha_conflito_ou_resultado_incerto", "insatisfacao_persistente", "situacao_sensivel"] as const;
  motivos.forEach((motivo) => assert.equal(deveOferecerTransferencia({ capacidadesSegurasDisponiveis: false, motivo }), true));
  assert.equal(deveOferecerTransferencia({ capacidadesSegurasDisponiveis: true, motivo: "informacao_nao_confirmavel" }), false);
  assert.equal(deveOferecerTransferencia({ capacidadesSegurasDisponiveis: true, motivo: "solicitacao_cliente" }), true);
});

test("normaliza somente WhatsApp brasileiro oficial e codifica caracteres", () => {
  assert.equal(normalizarWhatsappOficial("5531988421694"), "5531988421694");
  assert.equal(normalizarWhatsappOficial("+55 (11) 99999-9999"), "5511999999999");
  assert.equal(normalizarWhatsappOficial("https://malicioso.test"), null);
  assert.equal(normalizarWhatsappOficial("11999999999"), null);
  const link = gerarLinkWhatsappOficial("5511999999999", { ...resumoBase, necessidade_principal: "Troca de peça — ação humana & revisão" });
  assert.match(link, /^https:\/\/wa\.me\/5511999999999\?text=/);
  assert.match(decodeURIComponent(link), /Troca de peça — ação humana & revisão/);
});

test("remove links e rejeita credenciais e resumo excessivo", () => {
  const limpo = sanitizarResumoTransferencia({ ...resumoBase, informacoes_declaradas: ["Veja https://malicioso.test, email cliente@exemplo.com, CPF 123.456.789-00, telefone (11) 99999-9999"] });
  assert.deepEqual(limpo.informacoes_declaradas, ["Veja [link removido] email cli***@exemplo.com, CPF 123.***.***-00, telefone (11) *****-****"]);
  assert.throws(() => sanitizarResumoTransferencia({ ...resumoBase, informacoes_declaradas: ["token secreto abc"] }), /RESUMO_CONTEM_DADO_PROIBIDO/);
  assert.throws(() => sanitizarResumoTransferencia({ ...resumoBase, necessidade_principal: "x".repeat(301) }));
});

test("fluxo exige oferta aceita, revisão e confirmação específica", async () => {
  const c = criarCenario();
  const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "oferta-1", conversaId: "conv-1", execucaoId: "exec-1", identidade: c.identidade, mensagemId: null, motivo: "decisao_ou_acao_humana" });
  assert.ok(oferta);
  assert.equal(await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: resumoBase, transferenciaId: oferta.id }), null);
  assert.equal(await c.fluxo.responderOferta({ aceitar: true, identidade: c.identidade, transferenciaId: oferta.id }), true);
  const preparado = await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: resumoBase, transferenciaId: oferta.id });
  assert.ok(preparado);
  assert.equal(await c.fluxo.confirmarResumo({ identidade: c.identidade, resposta: "talvez", transferenciaId: oferta.id }), false);
  assert.equal(await c.fluxo.confirmarResumo({ identidade: c.identidade, resposta: "sim", transferenciaId: oferta.id }), true);
});

test("recusa e cancelamento respeitam o cliente sem encerrar a conversa", async () => {
  const c = criarCenario();
  const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "oferta-2", conversaId: "conv-2", execucaoId: "exec-2", identidade: c.identidade, mensagemId: null, motivo: "solicitacao_cliente" });
  assert.ok(oferta);
  assert.equal(await c.fluxo.responderOferta({ aceitar: false, identidade: c.identidade, transferenciaId: oferta.id }), true);
  assert.equal(c.repositorio.itens[0].status, "recusado");
  assert.equal(c.repositorio.itens[0].conversaId, "conv-2");
});

test("alteração de resumo invalida confirmação e exige nova revisão", async () => {
  const c = criarCenario();
  const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "oferta-3", conversaId: "conv-3", execucaoId: "exec-3", identidade: c.identidade, mensagemId: null, motivo: "decisao_ou_acao_humana" }); assert.ok(oferta);
  await c.fluxo.responderOferta({ aceitar: true, identidade: c.identidade, transferenciaId: oferta.id });
  await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: resumoBase, transferenciaId: oferta.id });
  const anterior = c.confirmacoes.itens[0];
  await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: { ...resumoBase, necessidade_principal: "Necessidade corrigida." }, transferenciaId: oferta.id });
  assert.equal(anterior.status, "invalidada");
  assert.equal(c.confirmacoes.itens.length, 2);
});

test("anônimo não inclui dados particulares e autenticado depende de validação", async () => {
  const anonimo = criarCenario();
  const ofertaA = await anonimo.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "a", conversaId: "ca", execucaoId: "ea", identidade: anonimo.identidade, mensagemId: null, motivo: "decisao_ou_acao_humana" }); assert.ok(ofertaA);
  await anonimo.fluxo.responderOferta({ aceitar: true, identidade: anonimo.identidade, transferenciaId: ofertaA.id });
  assert.equal(await anonimo.fluxo.prepararResumo({ contemDadosParticulares: true, identidade: anonimo.identidade, resumo: resumoBase, transferenciaId: ofertaA.id }), null);
  const autenticado = criarCenario("5511999999999", identidadeAutenticada);
  const ofertaB = await autenticado.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "b", conversaId: "cb", execucaoId: "eb", identidade: autenticado.identidade, mensagemId: null, motivo: "decisao_ou_acao_humana" }); assert.ok(ofertaB);
  await autenticado.fluxo.responderOferta({ aceitar: true, identidade: autenticado.identidade, transferenciaId: ofertaB.id });
  assert.ok(await autenticado.fluxo.prepararResumo({ contemDadosParticulares: true, identidade: autenticado.identidade, resumo: resumoBase, transferenciaId: ofertaB.id }));
});

test("gera link após confirmação, reabre idempotentemente e registra abertura separada", async () => {
  const c = criarCenario();
  const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "oferta-4", conversaId: "conv-4", execucaoId: "exec-4", identidade: c.identidade, mensagemId: null, motivo: "decisao_ou_acao_humana" }); assert.ok(oferta);
  await c.fluxo.responderOferta({ aceitar: true, identidade: c.identidade, transferenciaId: oferta.id });
  await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: resumoBase, transferenciaId: oferta.id });
  await c.fluxo.confirmarResumo({ identidade: c.identidade, resposta: "sim", transferenciaId: oferta.id });
  const primeiro = await c.fluxo.gerarLink({ chaveIdempotencia: "link-1", identidade: c.identidade, transferenciaId: oferta.id });
  const repetido = await c.fluxo.gerarLink({ chaveIdempotencia: "link-1", identidade: c.identidade, transferenciaId: oferta.id });
  assert.equal(primeiro.status, "link_gerado");
  assert.equal(repetido.link, primeiro.link);
  assert.equal(c.confirmacoes.operacoes.size, 1);
  assert.equal(c.repositorio.itens[0].status, "link_gerado");
  assert.equal(await c.fluxo.registrarAbertura({ identidade: c.identidade, transferenciaId: oferta.id }), true);
  assert.equal(c.repositorio.itens[0].status, "whatsapp_aberto");
});

test("ausência, invalidade e troca do destinatário nunca produzem falso sucesso", async () => {
  for (const numero of ["", "11999999999"]) {
    const c = criarCenario(numero);
    const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: `of-${numero}`, conversaId: `cv-${numero}`, execucaoId: `ex-${numero}`, identidade: c.identidade, mensagemId: null, motivo: "decisao_ou_acao_humana" }); assert.ok(oferta);
    await c.fluxo.responderOferta({ aceitar: true, identidade: c.identidade, transferenciaId: oferta.id });
    await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: resumoBase, transferenciaId: oferta.id });
    await c.fluxo.confirmarResumo({ identidade: c.identidade, resposta: "sim", transferenciaId: oferta.id });
    const resultado = await c.fluxo.gerarLink({ chaveIdempotencia: "x", identidade: c.identidade, transferenciaId: oferta.id });
    assert.equal(resultado.link, null);
    assert.notEqual(resultado.status, "link_gerado");
  }
});

test("identidade ou sessão diferente não acessa nem modifica transferência", async () => {
  const c = criarCenario();
  const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "iso", conversaId: "conv-iso", execucaoId: "exec-iso", identidade: c.identidade, mensagemId: null, motivo: "solicitacao_cliente" }); assert.ok(oferta);
  assert.equal(await c.fluxo.responderOferta({ aceitar: true, identidade: { identificadorSessao: "outra", usuarioId: null }, transferenciaId: oferta.id }), false);
});

test("identificador seguro não expõe sessão, usuário ou credencial", () => {
  const id = criarIdentificadorSeguroAtendimento();
  assert.match(id, /^ATD-[A-F0-9]{8}$/);
  assert.doesNotMatch(id, /sessao|usuario|token|cookie|senha/i);
});

test("confirmação expirada não autoriza e registra estado comprovável", async () => {
  let instante = new Date("2026-08-01T12:00:00.000Z");
  const repositorio = new TransferenciasFake();
  const confirmacoes = new ConfirmacoesFake();
  const fluxo = criarFluxoTransferenciaWhatsapp({
    agora: () => instante,
    obterWhatsappOficial: () => "5511999999999",
    repositorio,
    repositorioConfirmacoes: confirmacoes,
    validarDadosParticulares: async () => false,
    validadeEmMs: 30_000,
  });
  const oferta = await fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "expira", conversaId: "conv-expira", execucaoId: "exec-expira", identidade: identidadeAnonima, mensagemId: null, motivo: "solicitacao_cliente" }); assert.ok(oferta);
  await fluxo.responderOferta({ aceitar: true, identidade: identidadeAnonima, transferenciaId: oferta.id });
  await fluxo.prepararResumo({ contemDadosParticulares: false, identidade: identidadeAnonima, resumo: { ...resumoBase, motivo: "solicitacao_cliente" }, transferenciaId: oferta.id });
  instante = new Date(instante.getTime() + 30_001);
  assert.equal(await fluxo.confirmarResumo({ identidade: identidadeAnonima, resposta: "sim", transferenciaId: oferta.id }), false);
  assert.equal(repositorio.itens[0].status, "expirado");
});

test("mais de uma confirmação pendente torna resposta genérica ambígua", async () => {
  const c = criarCenario();
  const motivos = ["solicitacao_cliente", "situacao_sensivel"] as const;
  for (const [indice, motivo] of motivos.entries()) {
    const numero = indice + 1;
    const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: `amb-${numero}`, conversaId: "conv-amb", execucaoId: `exec-amb-${numero}`, identidade: c.identidade, mensagemId: null, motivo }); assert.ok(oferta);
    await c.fluxo.responderOferta({ aceitar: true, identidade: c.identidade, transferenciaId: oferta.id });
    await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: { ...resumoBase, motivo, necessidade_principal: `Necessidade ${numero}` }, transferenciaId: oferta.id });
  }
  assert.equal(await c.fluxo.confirmarResumo({ identidade: c.identidade, resposta: "sim", transferenciaId: c.repositorio.itens[0].id }), false);
});

test("mudança do destinatário oficial invalida vínculo confirmado", async () => {
  const c = criarCenario();
  const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "dest", conversaId: "conv-dest", execucaoId: "exec-dest", identidade: c.identidade, mensagemId: null, motivo: "solicitacao_cliente" }); assert.ok(oferta);
  await c.fluxo.responderOferta({ aceitar: true, identidade: c.identidade, transferenciaId: oferta.id });
  await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: { ...resumoBase, motivo: "solicitacao_cliente" }, transferenciaId: oferta.id });
  await c.fluxo.confirmarResumo({ identidade: c.identidade, resposta: "sim", transferenciaId: oferta.id });
  c.setNumero("5521999999999");
  const resultado = await c.fluxo.gerarLink({ chaveIdempotencia: "dest-link", identidade: c.identidade, transferenciaId: oferta.id });
  assert.equal(resultado.link, null);
  assert.equal(resultado.status, "falha_ao_gerar_link");
});

test("cancelamento consome a autorização e impede geração posterior", async () => {
  const c = criarCenario();
  const oferta = await c.fluxo.oferecer({ capacidadesSegurasDisponiveis: false, chaveIdempotencia: "canc", conversaId: "conv-canc", execucaoId: "exec-canc", identidade: c.identidade, mensagemId: null, motivo: "solicitacao_cliente" }); assert.ok(oferta);
  await c.fluxo.responderOferta({ aceitar: true, identidade: c.identidade, transferenciaId: oferta.id });
  await c.fluxo.prepararResumo({ contemDadosParticulares: false, identidade: c.identidade, resumo: { ...resumoBase, motivo: "solicitacao_cliente" }, transferenciaId: oferta.id });
  await c.fluxo.confirmarResumo({ identidade: c.identidade, resposta: "sim", transferenciaId: oferta.id });
  assert.equal(await c.fluxo.cancelar({ identidade: c.identidade, transferenciaId: oferta.id }), true);
  assert.equal((await c.fluxo.gerarLink({ chaveIdempotencia: "canc-link", identidade: c.identidade, transferenciaId: oferta.id })).link, null);
});
