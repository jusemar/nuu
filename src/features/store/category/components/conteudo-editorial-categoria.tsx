import React from "react";

import {
  possuiConteudoHtmlEditorial,
  sanitizarHtmlEditorialCategoria,
} from "../lib/sanitizar-html-editorial-categoria";
import type { FaqPublicaCategoria } from "../queries/buscar-faqs-publicas-categoria";

type ConteudoEditorialCategoriaProps = {
  descricaoInferior: string | null;
  faqs: FaqPublicaCategoria[];
};

/**
 * Server Component: o HTML editorial e todas as respostas já saem no documento inicial.
 * Details/summary preserva a interação sem exigir JavaScript no cliente.
 */
export function ConteudoEditorialCategoria({
  descricaoInferior,
  faqs,
}: ConteudoEditorialCategoriaProps) {
  const descricaoSanitizada = sanitizarHtmlEditorialCategoria(
    descricaoInferior?.trim() ?? "",
  );
  const possuiDescricao = possuiConteudoHtmlEditorial(descricaoSanitizada);
  const possuiFaqs = faqs.length > 0;

  if (!possuiDescricao && !possuiFaqs) return null;

  return (
    <section className="bg-white py-8 md:py-12">
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        {possuiDescricao ? (
          <div
            className="max-w-none text-gray-700 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:mb-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:p-3 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: descricaoSanitizada }}
          />
        ) : null}

        {possuiFaqs ? (
          <div>
            <h2 className="mb-5 text-2xl font-bold text-gray-900">
              Perguntas frequentes
            </h2>
            <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white px-5 sm:px-6">
              {faqs.map((faq) => (
                <details key={faq.id} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-gray-900 marker:content-none">
                    {faq.pergunta}
                    <span aria-hidden="true" className="text-xl text-gray-500">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 leading-relaxed whitespace-pre-line text-gray-600">
                    {faq.resposta}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
