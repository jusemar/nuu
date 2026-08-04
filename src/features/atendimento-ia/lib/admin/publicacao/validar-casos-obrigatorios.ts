import type {
  BloqueioPublicacao,
  EntradaElegibilidadePublicacao,
} from "../../../types/admin/publicacao";
export function validarCasosObrigatorios(
  casos: EntradaElegibilidadePublicacao["casosObrigatorios"],
  resultados: EntradaElegibilidadePublicacao["resultados"],
): BloqueioPublicacao[] {
  const validos = new Set(
    resultados
      .filter((r) => r.status === "concluida")
      .map((r) => r.casoTesteVersaoId),
  );
  const obrigatorios = casos.filter(
    (c) => c.obrigatorio || c.bloqueiaPublicacao || c.criticidade === "critica",
  );
  const bloqueios: BloqueioPublicacao[] = [];
  if (
    obrigatorios.some((c) => !validos.has(c.id) && c.criticidade === "critica")
  )
    bloqueios.push("caso_critico_obrigatorio_ausente");
  if (obrigatorios.some((c) => !validos.has(c.id)))
    bloqueios.push("conjunto_obrigatorio_incompleto");
  return bloqueios;
}
