import type {
  CategoriaFidelidade,
  ConfiguracaoFidelidadeMock,
  RegraCategoriaFidelidade,
} from "../types/programa-fidelidade.types";

export const CONFIGURACAO_FIDELIDADE_INICIAL: ConfiguracaoFidelidadeMock = {
  ativo: true,
  nomePublico: "Clube de Vantagens",
  valorGastoPadrao: "1,00",
  pontosPadrao: "1",
  pontosConversao: "100",
  valorCredito: "10,00",
  minimoResgate: "100",
  tipoValidade: "nao_expiram",
  diasValidade: "365",
};

export const CATEGORIAS_DEMONSTRACAO: CategoriaFidelidade[] = [
  { id: "demonstracao-racao", nome: "Ração" },
  { id: "demonstracao-informatica", nome: "Informática" },
  { id: "demonstracao-autopecas", nome: "Autopeças" },
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
      valorGasto: "1,00",
      pontos: racao ? "2" : informatica ? "0,5" : "1",
    };
  });
}

export const RECURSOS_FUTUROS = [
  "Avaliação de produto",
  "Indicação de cliente",
  "Aniversário",
  "Check-in diário",
  "Campanhas de pontos extras",
  "Níveis Bronze, Prata e Ouro",
  "Bônus por produto",
] as const;
