import { comportamentoTomAdminSchema } from "../../../schemas/admin/comportamento.schema";
import { conhecimentoAdminSchema } from "../../../schemas/admin/conhecimento.schema";

/** Dados temporários seguem exatamente os contratos que futuramente receberão dados reais. */
export const conhecimentosControladosAdmin = conhecimentoAdminSchema
  .array()
  .parse([
    {
      categoria: "Empresa",
      conteudo:
        "A Nuu atende clientes pelos canais oficiais informados no site. Dados variáveis devem ser consultados nas fontes reais da loja.",
      estado: "publicado",
      origem: "Documento institucional aprovado",
      resumoAlteracao: "Versão publicada usada como referência visual.",
      tipo: "institucional",
      titulo: "Canais oficiais de atendimento",
    },
    {
      categoria: "Empresa",
      conteudo:
        "As políticas institucionais são apresentadas somente quando publicadas e nunca substituem consultas de preço, estoque, promoção, entrega ou pedido.",
      estado: "em_revisao",
      origem: "Proposta da equipe de atendimento",
      resumoAlteracao: "Texto aguardando validação de outra pessoa.",
      tipo: "institucional",
      titulo: "Limites das informações institucionais",
    },
    {
      categoria: "Perguntas e respostas",
      conteudo: {
        condicoes: [
          { campo: "necessita_dado_real", operador: "igual", valor: true },
        ],
        consultasDadosReais: ["entrega"],
        observacoesInternas:
          "Confirmar que a ferramenta de entrega foi simulada antes da revisão.",
        perguntaPrincipal: "Qual é o prazo de entrega?",
        respostaPrincipal:
          "O prazo depende do CEP e dos itens escolhidos. Vou consultar as opções reais de entrega para informar corretamente.",
        variacoes: [
          "Quando meu pedido pode chegar?",
          "Em quanto tempo vocês entregam?",
        ],
      },
      estado: "rascunho",
      origem: "Dúvida recorrente sanitizada",
      resumoAlteracao:
        "FAQ criada para orientar a consulta obrigatória de entrega.",
      tipo: "pergunta_resposta",
      titulo: "Prazo de entrega por CEP",
    },
  ]);

export const comportamentoControladoAdmin = comportamentoTomAdminSchema.parse({
  blocosEditaveis: [
    {
      conteudo: "Explique o próximo passo com frases diretas e acolhedoras.",
      identificador: "clareza_proximo_passo",
      titulo: "Clareza no próximo passo",
    },
    {
      conteudo:
        "Declare limites e consulte a fonte real quando a informação variar.",
      identificador: "tratamento_incerteza",
      titulo: "Tratamento de incerteza",
    },
  ],
  estado: "rascunho",
  exemplosEvitar: ["Inventar disponibilidade para encerrar a conversa."],
  exemplosPositivos: ["Vou consultar a disponibilidade real para você."],
  parametros: {
    concisao: "equilibrada",
    formalidade: "informal_respeitosa",
    tratamentoIncerteza: "consultar_fonte",
  },
  resumoAlteracao: "Ajuste visual de clareza sem modificar o núcleo protegido.",
  versaoNucleoProtegido: "nucleo-seguranca-v1",
});
