export function avaliarCriteriosDeterministicos(
  resposta: string,
  criterios: string[],
) {
  const normalizada = resposta.toLocaleLowerCase();
  const detalhes = criterios.map((criterio) => ({
    criterio,
    atendido: normalizada.includes(criterio.toLocaleLowerCase()),
  }));
  return { detalhes, aprovado: detalhes.every((item) => item.atendido) };
}
