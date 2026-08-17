import type {
  CategoriaFidelidade,
  ConfiguracaoFidelidade,
  RegraCategoriaFidelidade,
} from "../types/programa-fidelidade.types";

export const CONFIGURACAO_FIDELIDADE_INICIAL: ConfiguracaoFidelidade = {
  ativo: true,
  nomePublico: "Clube Patinhas",
  pontosPorReal: 1,
  pontosConversao: 100,
  valorCredito: 10,
  minimoResgate: 200,
  mesesValidade: 12,
};

export const CATEGORIAS_DEMONSTRACAO: CategoriaFidelidade[] = [
  {
    id: "demonstracao-racao",
    nome: "Ração",
    grupo: "Alimentação",
    produtos: 184,
    ativa: true,
    pontosUltimos30Dias: 148920,
  },
  {
    id: "demonstracao-informatica",
    nome: "Informática",
    grupo: "Tecnologia",
    produtos: 312,
    ativa: true,
    pontosUltimos30Dias: 39750,
  },
  {
    id: "demonstracao-autopecas",
    nome: "Autopeças",
    grupo: "Outros",
    produtos: 68,
    ativa: true,
    pontosUltimos30Dias: 12260,
  },
];

export function criarRegrasDemonstracao(
  categorias: CategoriaFidelidade[],
): RegraCategoriaFidelidade[] {
  return categorias.map((categoria) => {
    const nome = categoria.nome.toLocaleLowerCase("pt-BR");
    const racao = nome.includes("ração") || nome.includes("racao");
    const informatica =
      nome.includes("informática") || nome.includes("informatica");

    return {
      categoriaId: categoria.id,
      personalizada: racao || informatica,
      pontosPorReal: racao ? 2 : informatica ? 0.5 : 1,
      ativa: categoria.ativa,
    };
  });
}

export const RECURSOS_FUTUROS = [
  {
    titulo: "Avaliação de produto",
    descricao: "Pontos por avaliação aprovada",
    icone: "estrela",
  },
  {
    titulo: "Indicação de cliente",
    descricao: "Bônus para quem indica e para quem entra",
    icone: "usuarios",
  },
  {
    titulo: "Aniversário",
    descricao: "Pontos em dobro no mês do cliente",
    icone: "presente",
  },
  {
    titulo: "Check-in diário",
    descricao: "Sequência diária com recompensas",
    icone: "calendario",
  },
  {
    titulo: "Campanhas de pontos extras",
    descricao: "Multiplicadores por período",
    icone: "foguete",
  },
  {
    titulo: "Níveis Bronze, Prata e Ouro",
    descricao: "Benefícios progressivos por faixa",
    icone: "medalha",
  },
  {
    titulo: "Bônus por produto",
    descricao: "Regra pontual em produtos específicos",
    icone: "etiqueta",
  },
] as const;

export const TENDENCIA_PONTOS_MOCK = [
  { mes: "Set", pontos: 312000 },
  { mes: "Out", pontos: 348000 },
  { mes: "Nov", pontos: 421000 },
  { mes: "Dez", pontos: 512000 },
  { mes: "Jan", pontos: 398000 },
  { mes: "Fev", pontos: 452000 },
];
