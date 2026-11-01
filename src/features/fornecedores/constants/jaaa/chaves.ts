export const chavesJaaa = {
  todas: ["atendimento-jaaa"] as const,
  identidades: (f: unknown) => [...chavesJaaa.todas, "identidades", f],
  produtos: (f: unknown) => [...chavesJaaa.todas, "produtos", f],
  configuracao: (id: string) => [...chavesJaaa.todas, "configuracao", id],
  proprio: () => [...chavesJaaa.todas, "proprio"],
  publico: (id: string) => [...chavesJaaa.todas, "publico", id],
};
