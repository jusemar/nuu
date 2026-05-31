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

import { Stars } from "@/components/ui/stars";
import type { PrecosProdutoPorModalidade } from "@/features/precificacao";

import type {
  AtributoProdutoLoja,
  Modalidade,
  PrecoModalidade,
  VarianteProdutoLoja,
} from "../../types/product.types";
import { PricingModalities } from "../PricingModalities";
import { ChatVendedor } from "../chat-vendedor";
import { ProductVariantSelector } from "../product-variant-selector";

// ==========================================
// INTERFACE ATUALIZADA (estado global)
// ==========================================
interface ProductInfoProps {
  // Dados básicos do produto
  nome: string;
  marca?: string | null;
  sku: string;
  rating?: number;
  totalAvaliacoes?: number;
  vendedor?: string;
  vendedorRating?: number;
  descricao: string;

  // === ESTADO GLOBAL DE MODALIDADES (NOVO) ===
  // Antes: ProductInfo gerenciava sozinho (estado local)
  // Agora: Recebe do ProductDetailsPage (orquestrador)
  modalidadesDisponiveis: PrecoModalidade[]; // Todas as modalidades do DB
  modalidadeAtiva: PrecoModalidade; // Qual está selecionada agora
  onTrocarModalidade: (tipo: Modalidade) => void; // Callback para trocar
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade;
  productKind?: string | null;
  variantAttributes?: AtributoProdutoLoja[];
  variants?: VarianteProdutoLoja[];
  selectedVariant?: VarianteProdutoLoja | null;
  onSelectVariant?: (variant: VarianteProdutoLoja) => void;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductInfo({
  nome,
  marca,
  sku,
  rating = 0,
  totalAvaliacoes = 0,
  vendedor,
  vendedorRating = 0,
  descricao,
  // === NOVAS PROPS (estado global) ===
  modalidadesDisponiveis,
  modalidadeAtiva,
  onTrocarModalidade,
  precosCalculadosPorModalidade,
  productKind,
  variantAttributes = [],
  variants = [],
  selectedVariant = null,
  onSelectVariant,
}: ProductInfoProps) {
  const hasRealVariants =
    productKind === "variable" &&
    variants.length > 0 &&
    Boolean(onSelectVariant);
  const isVariableProduct = productKind === "variable";
  const mostrarAvaliacoes =
    rating > 0 || totalAvaliacoes > 0 || Boolean(vendedor?.trim());

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
        <span className="text-text-hint text-[11px]">
          SKU: {selectedVariant?.sku || sku}
        </span>
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
      {mostrarAvaliacoes ? (
        <div className="flex flex-wrap items-center gap-2.5">
          {rating > 0 ? (
            <>
              <Stars rating={rating} size="lg" />
              <span className="text-[13px] font-bold">{rating}</span>
            </>
          ) : null}
          {totalAvaliacoes > 0 ? (
            <a href="#" className="text-text-muted text-xs underline">
              {totalAvaliacoes.toLocaleString("pt-BR")} avaliações
            </a>
          ) : null}
          {vendedor?.trim() ? (
            <>
              <span className="bg-surface-border-mid h-1 w-1 rounded-full" />
              <span className="text-text-muted text-xs">
                Vendido por{" "}
                <a href="#" className="text-primary font-semibold no-underline">
                  {vendedor}
                </a>
              </span>
              {vendedorRating > 0 ? (
                <span className="bg-success-light text-success inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {vendedorRating}% positivo
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {/* DIVISOR */}
      <div className="bg-surface-border h-px w-full" />

      {/* -----------------------------------------
          DESCRIÇÃO DO PRODUTO
          ----------------------------------------- */}
      <p className="text-text-muted text-[13px] leading-relaxed">{descricao}</p>

      {/* DIVISOR */}
      <div className="bg-surface-border h-px w-full" />

      {hasRealVariants ? (
        <ProductVariantSelector
          attributes={variantAttributes}
          variants={variants}
          selectedVariant={selectedVariant}
          onSelectVariant={onSelectVariant!}
        />
      ) : isVariableProduct ? (
        <p className="text-text-muted text-[13px]">
          Este produto está sem variantes disponíveis no momento.
        </p>
      ) : (
        null
      )}

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
      {!isVariableProduct && modalidadesDisponiveis.length > 0 ? (
        <PricingModalities
          modalidades={modalidadesDisponiveis}
          modalidadeAtiva={modalidadeAtiva}
          onSelecionarModalidade={onTrocarModalidade}
          precosCalculadosPorModalidade={precosCalculadosPorModalidade}
        />
      ) : null}

      {/* DIVISOR */}
      <div className="bg-surface-border h-px w-full" />

      {/* -----------------------------------------
          CHAT COM VENDEDOR
          ----------------------------------------- */}
      <ChatVendedor
        vendedorNome={vendedor || "Atendimento da loja"}
        status="online"
        tempoResposta="Responde em minutos"
        onClick={() => {
          console.log("Abrir chat com:", vendedor);
        }}
      />
    </div>
  );
}
