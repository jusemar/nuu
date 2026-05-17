// ==========================================
// COMPONENTE: ProductInfo (ATUALIZADO - ESTADO GLOBAL)
// ==========================================
// Responsabilidade: Mostrar informações do produto (coluna do meio)
//
// O QUE MUDOU:
//   - Removido estado interno de modalidade (useState local)
//   - Agora recebe modalidade do pai via props (estado global)
//   - Quando clica em modalidade, chama callback do pai (onTrocarModalidade)
//   - Integrado com PricingModalities (componente filho)
//
// FLUXO:
//   1. Recebe modalidadesDisponiveis, modalidadeAtiva, onTrocarModalidade do pai
//   2. Renderiza PricingModalities com essas props
//   3. Clique no PricingModalities → chama onTrocarModalidade → pai atualiza → BuyBox atualiza

"use client";

import { useState } from "react";

import { Stars } from "@/components/ui/stars";
import type { PrecosProdutoPorModalidade } from "@/features/precificacao";

import type {
  Cor,
  Modalidade,
  PrecoModalidade,
  Tamanho,
} from "../../types/product.types";
import { PricingModalities } from "../PricingModalities";
import { ChatVendedor } from "../chat-vendedor";

// ==========================================
// INTERFACE ATUALIZADA (estado global)
// ==========================================
interface ProductInfoProps {
  // Dados básicos do produto
  nome: string;
  marca: string;
  sku: string;
  rating: number;
  totalAvaliacoes: number;
  vendedor: string;
  vendedorRating: number;
  descricao: string;
  cores: Record<Cor, string>;
  tamanhos: Tamanho[];
  corInicial?: Cor;

  // === ESTADO GLOBAL DE MODALIDADES (NOVO) ===
  // Antes: ProductInfo gerenciava sozinho (estado local)
  // Agora: Recebe do ProductDetailsPage (orquestrador)
  modalidadesDisponiveis: PrecoModalidade[]; // Todas as modalidades do DB
  modalidadeAtiva: PrecoModalidade; // Qual está selecionada agora
  onTrocarModalidade: (tipo: Modalidade) => void; // Callback para trocar
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductInfo({
  nome,
  marca,
  sku,
  rating,
  totalAvaliacoes,
  vendedor,
  vendedorRating,
  descricao,
  cores,
  tamanhos,
  corInicial = "preto",
  // === NOVAS PROPS (estado global) ===
  modalidadesDisponiveis,
  modalidadeAtiva,
  onTrocarModalidade,
  precosCalculadosPorModalidade,
}: ProductInfoProps) {
  // -----------------------------------------
  // ESTADOS LOCAIS (mantidos - não afetam outros componentes)
  // -----------------------------------------
  // Cor selecionada (independente por produto)
  const [corSel, setCorSel] = useState<Cor>(corInicial);

  // Tamanho selecionado
  const [tamSel, setTamSel] = useState<Tamanho | null>(null);

  // -----------------------------------------
  // DADOS AUXILIARES
  // -----------------------------------------
  // Descrição de cada tamanho em centímetros
  const tamDesc: Record<Tamanho, string> = {
    "38": "23.5cm",
    "39": "24.5cm",
    "40": "25cm",
    "41": "25.5cm",
    "42": "26cm",
    "43": "27cm",
    "44": "27.5cm",
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div className="flex flex-col gap-4">
      {/* -----------------------------------------
          LINHA 1: MARCA + SKU
          ----------------------------------------- */}
      <div className="flex items-center gap-2">
        <span className="text-text-hint text-[11px] font-bold tracking-widest uppercase">
          {marca}
        </span>
        <span className="bg-surface-border-mid h-1 w-1 rounded-full" />
        <span className="text-text-hint text-[11px]">SKU: {sku}</span>
      </div>

      {/* -----------------------------------------
          LINHA 2: NOME DO PRODUTO
          ----------------------------------------- */}
      <h1 className="text-text-primary text-[26px] leading-tight font-extrabold tracking-tight">
        {nome}
      </h1>

      {/* -----------------------------------------
          LINHA 3: RATING + AVALIAÇÕES + VENDEDOR
          ----------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Stars rating={rating} size="lg" />
        <span className="text-[13px] font-bold">{rating}</span>
        <a href="#" className="text-text-muted text-xs underline">
          {totalAvaliacoes.toLocaleString("pt-BR")} avaliações
        </a>
        <span className="bg-surface-border-mid h-1 w-1 rounded-full" />
        <span className="text-text-muted text-xs">
          Vendido por{" "}
          <a href="#" className="text-primary font-semibold no-underline">
            {vendedor}
          </a>
        </span>
        <span className="bg-success-light text-success inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold">
          {vendedorRating}% positivo
        </span>
      </div>

      {/* DIVISOR */}
      <div className="bg-surface-border h-px w-full" />

      {/* -----------------------------------------
          DESCRIÇÃO DO PRODUTO
          ----------------------------------------- */}
      <p className="text-text-muted text-[13px] leading-relaxed">{descricao}</p>

      {/* DIVISOR */}
      <div className="bg-surface-border h-px w-full" />

      {/* -----------------------------------------
          SELETOR DE COR
          ----------------------------------------- */}
      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="text-text-primary text-xs font-bold tracking-wider uppercase">
            Cor
          </span>
          <span className="text-text-muted text-xs font-medium capitalize">
            {corSel}
          </span>
        </div>

        <div className="flex gap-2">
          {(Object.keys(cores) as Cor[]).map((cor) => (
            <button
              key={cor}
              onClick={() => setCorSel(cor)}
              title={cor}
              className={`h-7 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 transition-all ${
                corSel === cor
                  ? "outline-primary outline outline-2 outline-offset-2"
                  : ""
              }`}
              style={{
                backgroundColor: cores[cor],
                borderColor: cores[cor] === "#f5f5f0" ? "#D1D5DB" : cores[cor],
              }}
            />
          ))}
        </div>
      </div>

      {/* -----------------------------------------
          SELETOR DE TAMANHO
          ----------------------------------------- */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-text-primary text-xs font-bold tracking-wider uppercase">
              Tamanho
            </span>
            {tamSel && (
              <span className="text-text-muted text-xs">
                — {tamDesc[tamSel]}
              </span>
            )}
          </div>
          <a href="#" className="text-primary text-xs underline">
            Guia de tamanhos
          </a>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tamanhos.map((t) => (
            <button
              key={t}
              onClick={() => t !== "40" && setTamSel(t)}
              className={`flex h-[38px] min-w-[42px] items-center justify-center rounded-lg border-[1.5px] bg-white px-2 text-[13px] font-semibold transition-all ${
                tamSel === t
                  ? "border-primary bg-primary text-white"
                  : t === "40"
                    ? "border-surface-border text-text-primary cursor-not-allowed line-through opacity-35"
                    : "border-surface-border text-text-primary hover:border-primary-mid"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="text-text-hint mt-1.5 text-[11px]">
          Tam. 40 indisponível
        </div>
      </div>

      {/* DIVISOR */}
      <div className="bg-surface-border h-px w-full" />

      {/* -----------------------------------------
          MODALIDADE DE PREÇO (ATUALIZADO - ESTADO GLOBAL)
          ----------------------------------------- */}
      {/* 
        ANTES: ProductInfo tinha estado interno e renderizava seu próprio seletor
        AGORA: Usa PricingModalities com props do pai (estado global)
        RESULTADO: Clique aqui atualiza o BuyBox (coluna 3) automaticamente
      */}
      <PricingModalities
        modalidades={modalidadesDisponiveis}
        modalidadeAtiva={modalidadeAtiva}
        onSelecionarModalidade={onTrocarModalidade}
        precosCalculadosPorModalidade={precosCalculadosPorModalidade}
      />

      {/* DIVISOR */}
      <div className="bg-surface-border h-px w-full" />

      {/* -----------------------------------------
          CHAT COM VENDEDOR
          ----------------------------------------- */}
      <ChatVendedor
        vendedorNome={vendedor}
        status="online"
        tempoResposta="Responde em minutos"
        onClick={() => {
          console.log("Abrir chat com:", vendedor);
        }}
      />
    </div>
  );
}
