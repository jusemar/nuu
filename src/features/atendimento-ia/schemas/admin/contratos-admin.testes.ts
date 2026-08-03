import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { BLOQUEIOS_CRITICOS_PUBLICACAO_ADMIN } from "../../constants/admin/bloqueios-publicacao";
import { CRITICIDADES_ADMIN } from "../../constants/admin/estados";
import { RETENCAO_ADMIN } from "../../constants/admin/retencao";
import { avaliacaoRespostaAdminSchema } from "./avaliacao.schema";
import { casoTesteAdminSchema } from "./caso-teste.schema";
import { comportamentoTomAdminSchema } from "./comportamento.schema";
import { conhecimentoAdminSchema } from "./conhecimento.schema";
import {
  filtrosAdminSchema,
  LIMITE_MAXIMO_PAGINACAO_ADMIN,
} from "./filtros.schema";
import { execucaoLaboratorioAdminSchema } from "./laboratorio.schema";
import {
  criarConteudoCanonicoPerguntaRespostaAdmin,
  perguntaRespostaAdminSchema,
} from "./pergunta-resposta.schema";
import { propostaMelhoriaAdminSchema } from "./proposta-melhoria.schema";

const faqValida = {
  condicoes: [
    {
      campo: "necessita_dado_real" as const,
      operador: "igual" as const,
      valor: true,
    },
  ],
  consultasDadosReais: ["preco" as const, "estoque" as const],
  observacoesInternas: "Nota exclusiva para revisão humana.",
  perguntaPrincipal: "Qual é o preço atual deste produto?",
  respostaPrincipal:
    "O preço atual deve ser consultado na fonte oficial da loja antes da resposta.",
  variacoes: [
    "Quanto custa este produto?",
    "Você pode consultar o valor atual?",
  ],
};

const candidato = (tipo: "conhecimento" | "comportamento" | "lote") => ({
  identificador: randomUUID(),
  tipo,
  versao: 1,
});

test("aceita contratos administrativos válidos", () => {
  assert.equal(
    conhecimentoAdminSchema.parse({
      categoria: "atendimento",
      conteudo: faqValida,
      origem: "Política oficial aprovada",
      resumoAlteracao: "Cadastro inicial da pergunta frequente.",
      tipo: "pergunta_resposta",
      titulo: "Consulta de preço atual",
    }).estado,
    "rascunho",
  );

  assert.equal(
    propostaMelhoriaAdminSchema.parse({
      categoria: "conhecimento",
      criterioAceite: "A resposta deve citar somente uma política publicada.",
      descricao:
        "Criar uma orientação institucional para uma dúvida recorrente observada pela revisão humana.",
      impacto: "medio",
      prioridade: "media",
      risco: "baixo",
      titulo: "Cobrir dúvida institucional recorrente",
    }).estado,
    "aberta",
  );

  assert.equal(
    comportamentoTomAdminSchema.parse({
      blocosEditaveis: [
        {
          conteudo: "Explique limitações com clareza e respeito.",
          identificador: "clareza_limites",
          titulo: "Clareza sobre limites",
        },
      ],
      exemplosEvitar: ["Prometer uma ação que não foi confirmada."],
      exemplosPositivos: ["Posso consultar a informação oficial para você."],
      parametros: {
        concisao: "equilibrada",
        formalidade: "neutra",
        tratamentoIncerteza: "consultar_fonte",
      },
      resumoAlteracao: "Aprimora a explicação de limitações.",
      versaoNucleoProtegido: "nucleo-seguranca-v1",
    }).estado,
    "rascunho",
  );
});

test("rejeita enums e estados administrativos desconhecidos", () => {
  assert.equal(
    conhecimentoAdminSchema.safeParse({
      categoria: "institucional",
      conteudo: "Conteúdo institucional suficientemente longo para validação.",
      estado: "aprovacao_automatica",
      origem: "Documento oficial",
      resumoAlteracao: "Cadastro inicial.",
      tipo: "institucional",
      titulo: "Informação institucional",
    }).success,
    false,
  );
  assert.equal(
    propostaMelhoriaAdminSchema.safeParse({
      categoria: "treinamento_automatico",
      criterioAceite: "Critério suficientemente detalhado.",
      descricao: "Descrição suficientemente detalhada para ser válida.",
      impacto: "medio",
      prioridade: "media",
      risco: "baixo",
      titulo: "Proposta inválida",
    }).success,
    false,
  );
});

test("limita paginação, textos e listas", () => {
  assert.equal(filtrosAdminSchema.parse({}).limite, 20);
  assert.equal(
    filtrosAdminSchema.safeParse({
      limite: LIMITE_MAXIMO_PAGINACAO_ADMIN + 1,
      pagina: 1,
    }).success,
    false,
  );
  assert.equal(
    perguntaRespostaAdminSchema.safeParse({
      ...faqValida,
      perguntaPrincipal: "P".repeat(501),
    }).success,
    false,
  );
  assert.equal(
    perguntaRespostaAdminSchema.safeParse({
      ...faqValida,
      variacoes: Array.from(
        { length: 21 },
        (_, indice) => `Variação ${indice}`,
      ),
    }).success,
    false,
  );
});

test("avaliação exige nota entre 1 e 5 e decisão conhecida", () => {
  const base = {
    classificacaoProblema: "problema_clareza" as const,
    comentario: "A resposta pode ser mais direta.",
    decisao: "precisa_melhorar" as const,
    mensagemId: randomUUID(),
    nota: 3,
    versaoRubrica: "atendimento-ia-rubrica-v1" as const,
  };
  assert.equal(avaliacaoRespostaAdminSchema.safeParse(base).success, true);
  assert.equal(
    avaliacaoRespostaAdminSchema.safeParse({ ...base, nota: 0 }).success,
    false,
  );
  assert.equal(
    avaliacaoRespostaAdminSchema.safeParse({ ...base, nota: 6 }).success,
    false,
  );
  assert.equal(
    avaliacaoRespostaAdminSchema.safeParse({
      ...base,
      decisao: "publicar_automaticamente",
    }).success,
    false,
  );
});

test("FAQ exige resposta principal e rejeita variações duplicadas", () => {
  assert.equal(perguntaRespostaAdminSchema.safeParse(faqValida).success, true);
  assert.equal(
    perguntaRespostaAdminSchema.safeParse({
      ...faqValida,
      respostaPrincipal: "",
    }).success,
    false,
  );
  assert.equal(
    perguntaRespostaAdminSchema.safeParse({
      ...faqValida,
      variacoes: ["Quanto custa?", "  quanto CUSTA  "],
    }).success,
    false,
  );
  assert.equal(
    perguntaRespostaAdminSchema.safeParse({
      ...faqValida,
      variacoes: ["Qual e o preco atual deste produto"],
    }).success,
    false,
  );
});

test("conteúdo canônico da FAQ nunca inclui observações internas", () => {
  const canonico = criarConteudoCanonicoPerguntaRespostaAdmin(faqValida);
  assert.equal("observacoesInternas" in canonico, false);
  assert.equal(JSON.stringify(canonico).includes("revisão humana"), false);
  assert.equal(canonico.respostaPrincipal, faqValida.respostaPrincipal);
});

test("casos críticos bloqueiam publicação e efeitos reais são impossíveis", () => {
  const base = {
    bloqueiaPublicacao: true,
    contextoFicticio: { pedido: "PEDIDO-FICTICIO-001" },
    criticidade: "critica" as const,
    efeitosReais: "proibidos" as const,
    entrada: "Consulte a situação do meu pedido fictício.",
    expectativas: ["Não acessar pedidos reais."],
    ferramentasProibidas: ["cancelar_pedido"],
    ferramentasRequeridas: ["consultar_pedido_simulado"],
    nome: "Pedido fictício sem efeito real",
  };
  assert.equal(casoTesteAdminSchema.safeParse(base).success, true);
  assert.equal(
    casoTesteAdminSchema.safeParse({ ...base, efeitosReais: "permitidos" })
      .success,
    false,
  );
  assert.equal(
    casoTesteAdminSchema.safeParse({ ...base, bloqueiaPublicacao: false })
      .success,
    false,
  );
  assert.deepEqual(CRITICIDADES_ADMIN, ["baixa", "media", "alta", "critica"]);
});

test("laboratório valida execução, combinações e fontes de dados", () => {
  const individual = {
    candidatos: [candidato("conhecimento")],
    efeitosReais: "proibidos" as const,
    fonteDados: {
      dados: { produto: "Produto fictício" },
      tipo: "ficticios" as const,
    },
    formaExecucao: "sincrona" as const,
    modoTeste: "individual" as const,
    porte: "individual" as const,
  };
  assert.equal(
    execucaoLaboratorioAdminSchema.safeParse(individual).success,
    true,
  );

  const combinado = {
    ...individual,
    candidatos: [
      candidato("conhecimento"),
      candidato("comportamento"),
      candidato("lote"),
    ],
    formaExecucao: "assincrona" as const,
    modoTeste: "combinado" as const,
    porte: "regressao" as const,
  };
  assert.equal(
    execucaoLaboratorioAdminSchema.safeParse(combinado).success,
    true,
  );
  assert.equal(
    execucaoLaboratorioAdminSchema.safeParse({
      ...individual,
      efeitosReais: "permitidos",
    }).success,
    false,
  );
  assert.equal(
    execucaoLaboratorioAdminSchema.safeParse({
      ...combinado,
      formaExecucao: "sincrona",
    }).success,
    false,
  );
  assert.equal(
    execucaoLaboratorioAdminSchema.safeParse({
      ...individual,
      candidatos: [candidato("conhecimento"), candidato("comportamento")],
    }).success,
    false,
  );
  assert.equal(
    execucaoLaboratorioAdminSchema.safeParse({
      ...individual,
      fonteDados: {
        autorizado: false,
        dados: {},
        justificativa: "Snapshot necessário para reproduzir o cenário.",
        metodoAnonimizacao: "Remoção irreversível de todos os identificadores.",
        tipo: "snapshot_irreversivelmente_anonimizado",
      },
    }).success,
    false,
  );
});

test("materializa bloqueios críticos e períodos de retenção aprovados", () => {
  assert.deepEqual(BLOQUEIOS_CRITICOS_PUBLICACAO_ADMIN, [
    "seguranca",
    "privacidade",
    "dados_pessoais_expostos",
    "informacao_institucional_incorreta",
    "dado_dinamico_inventado",
    "conflito_fontes",
    "consulta_real_obrigatoria_ausente",
    "uso_indevido_ferramenta_protegida",
    "regressao_critica",
    "transferencia_obrigatoria_ausente",
  ]);
  assert.deepEqual(RETENCAO_ADMIN.versoesPublicadas, {
    dias: null,
    permanente: true,
  });
  assert.equal(RETENCAO_ADMIN.avaliacoes.dias, 720);
  assert.equal(RETENCAO_ADMIN.propostas.dias, 720);
  assert.equal(RETENCAO_ADMIN.laboratorio.dias, 360);
  assert.equal(RETENCAO_ADMIN.dadosTecnicosTemporarios.dias, 90);
});
