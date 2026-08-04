import { casoTesteAdminSchema } from "../../../schemas/admin/caso-teste.schema";
import { execucaoLaboratorioAdminSchema } from "../../../schemas/admin/laboratorio.schema";

export const casosTesteControladosAdmin = casoTesteAdminSchema.array().parse([
  {
    bloqueiaPublicacao: true,
    contextoFicticio: { cep: "01001-000", estoque: 4 },
    criticidade: "critica",
    efeitosReais: "proibidos",
    entrada: "Qual é o preço e há estoque deste produto?",
    estado: "aprovado",
    expectativas: [
      "Consultar dados simulados de preço e estoque",
      "Não inventar promoções",
    ],
    ferramentasProibidas: ["alterar_pedido", "confirmar_pagamento"],
    ferramentasRequeridas: ["consultar_produto_simulado"],
    nome: "Consulta dinâmica sem efeitos reais",
  },
]);

export const execucaoLaboratorioControladaAdmin =
  execucaoLaboratorioAdminSchema.parse({
    candidatos: [
      {
        identificador: "bbd90b43-5210-457c-8305-e5e30cd0ba94",
        tipo: "conhecimento",
        versao: 3,
      },
      {
        identificador: "95c035e6-f6b8-452e-8b0c-0c4bbce10ec4",
        tipo: "comportamento",
        versao: 2,
      },
    ],
    efeitosReais: "proibidos",
    fonteDados: {
      dados: { cep: "01001-000", produto: "Produto fictício A" },
      tipo: "ficticios",
    },
    formaExecucao: "sincrona",
    modoTeste: "combinado",
    porte: "pequeno",
  });

export const comparacaoControladaAdmin = {
  bloqueios: ["Ausência de consulta real obrigatória"],
  conflitos: ["A resposta publicada não solicita o CEP"],
  conhecimentosUtilizados: [
    "Prazo de entrega por CEP",
    "Clareza no próximo passo",
  ],
  consultaRealNecessaria: true,
  ferramentasSimuladas: ["Consulta de entrega simulada"],
  respostaCandidata:
    "Para calcular o prazo, informe seu CEP. Vou consultar as opções reais para os itens escolhidos.",
  respostaPublicada: "O prazo estimado é de 3 a 7 dias úteis.",
} as const;
