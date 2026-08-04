export function podeEditarVersaoConhecimento(estado: string) {
  return estado === "rascunho";
}
export function deveCriarNovaVersaoConhecimento(estado: string) {
  return estado === "publicado" || estado === "em_revisao";
}
