import sanitizeHtml from "sanitize-html";

/** Remove marcação e caracteres de controle sem destruir quebras de linha úteis. */
export function sanitizarTextoContato(valor: string) {
  return sanitizeHtml(valor, { allowedTags: [], allowedAttributes: {} })
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}
