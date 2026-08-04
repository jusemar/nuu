export const POLITICA_AMOSTRAGEM_OBSERVABILIDADE = {
  agregados: "todos",
  eventosCriticos: "todos",
  limiteDetalhesSanitizados: 100,
  ordenacao: "criado_em_desc_id_desc",
} as const;

export function deveAmostrarEvento(severidade: string, posicao: number) {
  return (
    severidade === "critico" ||
    posicao < POLITICA_AMOSTRAGEM_OBSERVABILIDADE.limiteDetalhesSanitizados
  );
}
