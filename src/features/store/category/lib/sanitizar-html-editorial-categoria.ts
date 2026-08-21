import sanitizeHtml from "sanitize-html";

/**
 * Política explícita para o HTML persistido pelo editor de categorias.
 * O h1 fica reservado ao nome da categoria e atributos não listados são removidos.
 */
const opcoesHtmlEditorial: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "strong",
    "b",
    "em",
    "i",
    "s",
    "blockquote",
    "code",
    "pre",
    "br",
    "hr",
    "a",
    "span",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
    span: ["style"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i],
      "font-family": [/^[\w\s,'-]+$/],
      "font-size": [/^(?:1[0-9]|2[048]|36|48)px$/],
      "text-align": [/^(?:left|center|right|justify)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto", "tel"],
    img: ["http", "https"],
  },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true,
  transformTags: {
    a: (_nomeTag, atributos) => ({
      tagName: "a",
      attribs:
        atributos.target === "_blank"
          ? { ...atributos, rel: "noopener noreferrer" }
          : atributos,
    }),
  },
};

export function sanitizarHtmlEditorialCategoria(html: string): string {
  return sanitizeHtml(html, opcoesHtmlEditorial).trim();
}

/** Evita renderizar wrappers gerados pelo editor, como `<p></p>`, sem conteúdo. */
export function possuiConteudoHtmlEditorial(htmlSanitizado: string): boolean {
  const texto = sanitizeHtml(htmlSanitizado, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/gi, " ")
    .trim();

  return texto.length > 0 || /<img\s/i.test(htmlSanitizado);
}
