import React from "react";

import { serializarJsonLd } from "@/lib/seo/serializar-json-ld";

import { montarBreadcrumbListCategoria } from "../lib/dados-estruturados-categoria";
import type { CategoriaBreadcrumb } from "../queries/buscar-categoria-publica";

type DadosEstruturadosCategoriaProps = {
  breadcrumb: CategoriaBreadcrumb[];
};

/** Responsável único pelos dados estruturados da página pública de categoria. */
export function DadosEstruturadosCategoria({
  breadcrumb,
}: DadosEstruturadosCategoriaProps) {
  const breadcrumbList = montarBreadcrumbListCategoria(breadcrumb);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializarJsonLd(breadcrumbList) }}
    />
  );
}
