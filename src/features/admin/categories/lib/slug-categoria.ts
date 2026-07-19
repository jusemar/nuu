export const SLUG_CATEGORIA_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizarSlugCategoria(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validarSlugCategoria(slug: string) {
  const valor = slug.trim();
  if (!valor) return "Slug é obrigatório.";
  if (!SLUG_CATEGORIA_REGEX.test(valor)) {
    return "Use apenas letras minúsculas, números e hífens, sem espaços ou acentos.";
  }
  return null;
}
