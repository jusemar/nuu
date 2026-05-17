"use client";

import { useRef, useState } from "react";

import type { PrecosProdutoPorModalidade } from "@/features/precificacao";

import type { Modalidade, PrecoModalidade } from "../../types/product.types";

interface PricingModalitiesProps {
  modalidades: PrecoModalidade[];
  modalidadeAtiva: PrecoModalidade;
  onSelecionarModalidade: (tipo: Modalidade) => void;
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade;
}

const configPorTipo: Record<
  string,
  { icon: string; badge: string; badgeBg: string; badgeColor: string }
> = {
  stock: {
    icon: "🏭",
    badge: "Estoque Próprio",
    badgeBg: "#E8F5E9",
    badgeColor: "#2E7D32",
  },
  pre_sale: {
    icon: "⏳",
    badge: "Pré-venda",
    badgeBg: "#FFF3E0",
    badgeColor: "#ED6C02",
  },
  dropshipping: {
    icon: "📦",
    badge: "Dropshipping",
    badgeBg: "#E3F2FD",
    badgeColor: "#0288D1",
  },
  order_basis: {
    icon: "📋",
    badge: "Sob Encomenda",
    badgeBg: "#F3E5F5",
    badgeColor: "#7B1FA2",
  },
};

export function PricingModalities({
  modalidades,
  modalidadeAtiva,
  onSelecionarModalidade,
  precosCalculadosPorModalidade,
}: PricingModalitiesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setIsOpen(true), 150);
  }

  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  function handleSelect(tipo: Modalidade) {
    onSelecionarModalidade(tipo);
    setIsOpen(false);
  }

  const configAtiva =
    configPorTipo[modalidadeAtiva.type] || configPorTipo.stock;
  const precoAtivoCalculado =
    precosCalculadosPorModalidade[modalidadeAtiva.type];

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-text-primary text-xs font-bold tracking-wider uppercase">
          Modalidade de preço
        </span>
      </div>

      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div
          className="border-primary hover:border-primary-mid flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] bg-white p-3 shadow-[0_0_0_1px_#0C447C] transition-all"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="text-xl">{configAtiva.icon}</span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-bold">
                {modalidadeAtiva.pricingModalDescription ||
                  modalidadeAtiva.type}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: configAtiva.badgeBg,
                  color: configAtiva.badgeColor,
                }}
              >
                {configAtiva.badge}
              </span>
            </div>
            <div className="text-text-hint mt-0.5 text-[11px]">
              {modalidadeAtiva.deliveryDays || "Consulte prazo"} · 12 meses ·
              por Brasil
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-text-primary text-[13px] font-bold">
              {precoAtivoCalculado?.pix.valor}
            </div>
            <div className="text-success-dark text-[10px] font-semibold">
              no PIX
            </div>
          </div>

          <div
            className="text-text-hint ml-1 text-xs transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </div>
        </div>

        <div className="text-text-hint mt-1.5 hidden items-center gap-1 text-[11px] select-none md:flex">
          <span>↕</span> Passe o mouse para ver outras modalidades
        </div>
        <div className="text-text-hint mt-1.5 flex items-center gap-1 text-[11px] select-none md:hidden">
          <span>↕</span> Toque para ver outras modalidades de preço
        </div>

        {isOpen ? (
          <div className="mt-2 flex animate-[slideDown_0.2s_ease] flex-col gap-1.5">
            {modalidades
              .filter((mod) => mod.type !== modalidadeAtiva.type)
              .map((mod) => {
                const config = configPorTipo[mod.type] || configPorTipo.stock;
                const precoCalculado = precosCalculadosPorModalidade[mod.type];

                return (
                  <div
                    key={mod.type}
                    className="border-surface-border hover:border-primary-mid hover:bg-primary-light flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] bg-white p-3 transition-all"
                    onClick={() => handleSelect(mod.type)}
                  >
                    <span className="text-lg">{config.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[13px] font-bold">
                          {mod.pricingModalDescription || mod.type}
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            background: config.badgeBg,
                            color: config.badgeColor,
                          }}
                        >
                          {config.badge}
                        </span>
                      </div>
                      <div className="text-text-hint mt-0.5 text-[11px]">
                        {mod.deliveryDays || "Consulte prazo"} · 12 meses
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-text-primary text-sm font-extrabold">
                        {precoCalculado?.pix.valor}{" "}
                        <span className="text-text-muted text-[10px] font-medium">
                          PIX
                        </span>
                      </div>
                      <div className="text-text-muted text-[11px]">
                        {precoCalculado?.cartao.valor} cartão
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
