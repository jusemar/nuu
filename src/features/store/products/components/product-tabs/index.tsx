// ==========================================
// COMPONENTE: ProductTabs
// ==========================================
// Responsabilidade: Mostrar abas de navegação (Descrição, Especificações, Avaliações, Entrega)

"use client";

import { useState } from "react";
import { Stars } from "@/components/ui/stars"; // 🆕 IMPORT DO COMPONENTE GLOBAL
import type {
  Avaliacao,
  Especificacao,
  ModalidadeInfo,
} from "../../types/product.types";
import { sanitizeProductRichText } from "../../utils/rich-text";

interface ProductTabsProps {
  descricao: string;
  especificacoes: Especificacao[];
  avaliacoes: Avaliacao[];
  rating: number;
  totalAvaliacoes: number;
  modalidades: Record<string, ModalidadeInfo>;
}

export function ProductTabs({
  descricao,
  especificacoes,
  avaliacoes,
  rating,
  totalAvaliacoes,
  modalidades,
}: ProductTabsProps) {
  const [abaAtiva, setAbaAtiva] = useState<
    "descricao" | "especificacoes" | "avaliacoes" | "entrega"
  >("descricao");

  return (
    <div className="mt-16">
      {/* Menu de abas */}
      <div className="border-surface-border mb-7 flex gap-7 overflow-x-auto border-b">
        {[
          { id: "descricao", label: "Descrição" },
          { id: "especificacoes", label: "Especificações" },
          { id: "avaliacoes", label: "Avaliações" },
          { id: "entrega", label: "Entrega" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id as any)}
            className={`border-b-2 pb-2.5 text-sm font-semibold whitespace-nowrap transition-all ${abaAtiva === tab.id ? "text-primary border-primary" : "text-text-hint hover:text-text-muted border-transparent"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      <div className="max-w-2xl">
        {/* ABA: DESCRIÇÃO */}
        {abaAtiva === "descricao" && (
          <div className="flex animate-[fadeUp_0.3s_ease] flex-col gap-3">
            <div
              className="product-rich-text text-text-muted text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeProductRichText(descricao),
              }}
            />
          </div>
        )}

        {/* ABA: ESPECIFICAÇÕES */}
        {abaAtiva === "especificacoes" && (
          <div className="border-surface-border max-w-lg animate-[fadeUp_0.3s_ease] overflow-hidden rounded-xl border bg-white">
            {especificacoes.map((esp, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white"} ${i !== especificacoes.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
              >
                <span className="text-text-muted text-sm">{esp.label}</span>
                <span className="text-text-primary text-sm font-semibold">
                  {esp.valor}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ABA: AVALIAÇÕES */}
        {abaAtiva === "avaliacoes" && (
          <div className="flex max-w-2xl animate-[fadeUp_0.3s_ease] flex-col gap-3.5">
            {/* Resumo das avaliações */}
            <div className="border-surface-border flex flex-wrap items-center gap-7 rounded-xl border bg-white p-5">
              <div className="flex-shrink-0 text-center">
                <div className="text-text-primary text-5xl leading-none font-extrabold">
                  {rating}
                </div>
                <Stars rating={rating} size="lg" />{" "}
                {/* 🆕 USA O COMPONENTE IMPORTADO */}
                <div className="text-text-hint mt-1 text-xs">
                  {totalAvaliacoes.toLocaleString("pt-BR")} avaliações
                </div>
              </div>
              <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((estrela) => (
                  <div
                    key={estrela}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="text-text-muted w-4">{estrela}</span>
                    <span className="text-accent">★</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div
                        className="bg-accent h-full rounded-full"
                        style={{
                          width: `${estrela === 5 ? 82 : estrela === 4 ? 11 : estrela === 3 ? 4 : estrela === 2 ? 2 : 1}%`,
                        }}
                      />
                    </div>
                    <span className="text-text-hint min-w-[30px] text-right">
                      {estrela === 5
                        ? "82%"
                        : estrela === 4
                          ? "11%"
                          : estrela === 3
                            ? "4%"
                            : estrela === 2
                              ? "2%"
                              : "1%"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de avaliações */}
            {avaliacoes.map((av, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#F3F4F6] bg-white p-4"
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <div
                    className="text-primary flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: av.cor }}
                  >
                    {av.iniciais}
                  </div>
                  <div className="flex-1">
                    <div className="text-text-primary text-sm font-bold">
                      {av.nome}
                    </div>
                    <div className="text-text-hint text-xs">{av.data}</div>
                  </div>
                  <Stars rating={av.estrelas} />{" "}
                  {/* 🆕 USA O COMPONENTE IMPORTADO */}
                </div>
                <p className="text-text-muted text-sm leading-relaxed">
                  {av.comentario}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ABA: ENTREGA */}
        {abaAtiva === "entrega" && (
          <div className="flex max-w-lg animate-[fadeUp_0.3s_ease] flex-col gap-2">
            {Object.entries(modalidades).map(([key, mod]) => (
              <div
                key={key}
                className="border-surface-border flex items-center gap-3 rounded-xl border bg-white p-3"
              >
                <span className="text-xl">{mod.icon}</span>
                <div className="flex-1">
                  <div className="text-text-primary text-sm font-bold">
                    {mod.label}
                  </div>
                  <div className="text-text-hint mt-0.5 text-xs">
                    Enviado por: {mod.envia}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-text-primary text-sm font-bold">
                    {mod.prazo}
                  </div>
                  <div className="text-text-hint text-xs">
                    Garantia: {mod.garantia}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-surface-border text-text-muted rounded-xl border bg-[#F9FAFB] p-3 text-xs leading-relaxed">
              <strong className="text-text-primary">Política:</strong> Prazos a
              partir da confirmação do pagamento. Frete grátis acima de R$ 299
              no estoque próprio.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
