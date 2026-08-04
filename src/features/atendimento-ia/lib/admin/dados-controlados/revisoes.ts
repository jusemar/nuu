import { VERSAO_RUBRICA_AVALIACAO_ADMIN } from "../../../constants/admin/rubricas";
import { avaliacaoRespostaAdminSchema } from "../../../schemas/admin/avaliacao.schema";
import { propostaMelhoriaAdminSchema } from "../../../schemas/admin/proposta-melhoria.schema";

export const avaliacaoControladaAdmin = avaliacaoRespostaAdminSchema.parse({
  classificacaoProblema: "consulta_real_omitida",
  comentario:
    "A resposta deveria informar que o prazo depende de consulta real.",
  criterios: [
    { criterio: "correcao", nota: 3 },
    { criterio: "uso_ferramentas", nota: 2 },
  ],
  decisao: "precisa_melhorar",
  mensagemId: "1ee6fa56-e955-48dd-8a2d-a62c1c12ba32",
  nota: 3,
  versaoRubrica: VERSAO_RUBRICA_AVALIACAO_ADMIN,
});

export const propostaControladaAdmin = propostaMelhoriaAdminSchema.parse({
  categoria: "pergunta_resposta",
  criterioAceite:
    "A resposta deve solicitar CEP e consultar a fonte real de entrega.",
  descricao:
    "Criar uma orientação publicada para dúvidas de prazo sem fixar uma informação dinâmica.",
  estado: "aberta",
  impacto: "alto",
  prioridade: "alta",
  risco: "medio",
  titulo: "Orientar consulta de prazo de entrega",
});

/** A conversa é fictícia e já chega como projeção sanitizada para esta etapa visual. */
export const revisoesControladasAdmin = [
  {
    id: "revisao-controlada-001",
    assunto: "Prazo de entrega",
    canal: "Site",
    cliente: "Cliente 0142",
    recebidaEm: "Hoje, 10:32",
    pergunta: "Se eu comprar hoje, quando chega?",
    resposta:
      "O prazo pode variar. Para informar corretamente, preciso consultar o CEP e os itens.",
    respostaCorrigida:
      "Informe seu CEP e os itens desejados para eu consultar as opções reais de entrega.",
  },
] as const;
