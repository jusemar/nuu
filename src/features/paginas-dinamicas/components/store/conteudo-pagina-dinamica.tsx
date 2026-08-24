import React, { type ReactNode } from "react";

import {
  enderecoLinkSchema,
  type NoConteudo,
} from "../../schemas/conteudo-pagina-dinamica.schema";

type Propriedades = { conteudo: NoConteudo };

function renderizarFilhos(no: NoConteudo, chave: string): ReactNode {
  return no.content?.map((filho, indice) =>
    renderizarNo(filho, `${chave}-${indice}`),
  );
}

function aplicarMarcas(no: NoConteudo, conteudo: ReactNode, chave: string) {
  return (no.marks ?? []).reduce<ReactNode>((atual, marca, indice) => {
    if (marca.type === "bold")
      return <strong key={`${chave}-b-${indice}`}>{atual}</strong>;
    if (marca.type === "italic")
      return <em key={`${chave}-i-${indice}`}>{atual}</em>;
    if (marca.type === "link") {
      const href = enderecoLinkSchema.safeParse(marca.attrs.href);
      if (!href.success) return atual;
      const novaAba = marca.attrs.target === "_blank";
      return (
        <a
          key={`${chave}-a-${indice}`}
          href={href.data}
          target={novaAba ? "_blank" : undefined}
          rel={novaAba ? "noopener noreferrer" : undefined}
          className="text-primary decoration-primary/40 hover:decoration-primary underline underline-offset-4"
        >
          {atual}
        </a>
      );
    }
    return atual;
  }, conteudo);
}

function renderizarNo(no: NoConteudo, chave: string): ReactNode {
  if (no.type === "text") return aplicarMarcas(no, no.text ?? "", chave);
  const filhos = renderizarFilhos(no, chave);
  if (no.type === "doc") return <div className="space-y-5">{filhos}</div>;
  if (no.type === "paragraph")
    return (
      <p key={chave} className="leading-7">
        {filhos}
      </p>
    );
  if (no.type === "heading") {
    const nivel = no.attrs?.level;
    if (nivel === 1)
      return (
        <h2 key={chave} className="mt-8 text-2xl font-semibold tracking-tight">
          {filhos}
        </h2>
      );
    if (nivel === 2)
      return (
        <h3 key={chave} className="mt-7 text-xl font-semibold tracking-tight">
          {filhos}
        </h3>
      );
    return (
      <h4 key={chave} className="mt-6 text-lg font-semibold">
        {filhos}
      </h4>
    );
  }
  if (no.type === "bulletList")
    return (
      <ul key={chave} className="list-disc space-y-2 pl-6">
        {filhos}
      </ul>
    );
  if (no.type === "orderedList") {
    const inicio = typeof no.attrs?.start === "number" ? no.attrs.start : 1;
    return (
      <ol key={chave} start={inicio} className="list-decimal space-y-2 pl-6">
        {filhos}
      </ol>
    );
  }
  if (no.type === "listItem") return <li key={chave}>{filhos}</li>;
  return null;
}

export function ConteudoPaginaDinamica({ conteudo }: Propriedades) {
  return <>{renderizarNo(conteudo, "conteudo")}</>;
}
