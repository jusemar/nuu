/** Evita que o salvamento de outra aba reenvie uma configuração logística antiga. */
export function omitirLogisticaInalterada<
  T extends {
    entrega?: object;
    dimensoesFreteExterno?: object;
  },
>(dadosAtuais: T, dadosCarregados: T): T {
  const dadosParaSalvar = { ...dadosAtuais };

  if (
    JSON.stringify(dadosAtuais.entrega) ===
    JSON.stringify(dadosCarregados.entrega)
  ) {
    delete dadosParaSalvar.entrega;
  }
  if (
    JSON.stringify(dadosAtuais.dimensoesFreteExterno) ===
    JSON.stringify(dadosCarregados.dimensoesFreteExterno)
  ) {
    delete dadosParaSalvar.dimensoesFreteExterno;
  }

  return dadosParaSalvar;
}
