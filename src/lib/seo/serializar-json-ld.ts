/**
 * Serializa dados estruturados sem permitir que conteúdo persistido encerre a
 * tag `<script>`. O escape cobre também os separadores Unicode problemáticos em
 * alguns interpretadores JavaScript antigos.
 */
export function serializarJsonLd(dados: unknown): string {
  return JSON.stringify(dados)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
