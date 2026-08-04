export function podeEditarComportamento(estado: string) {
  return estado === "rascunho";
}
export function exigeNovaVersaoComportamento(estado: string) {
  return ["em_revisao", "publicado", "desativado"].includes(estado);
}
