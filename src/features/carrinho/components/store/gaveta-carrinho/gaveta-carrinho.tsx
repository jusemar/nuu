"use client";

import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useCarrinho } from "../../../hooks/use-carrinho";
import { useGavetaCarrinho } from "../../../hooks/use-gaveta-carrinho";
import { CabecalhoGavetaCarrinho } from "./cabecalho-gaveta-carrinho";
import { CarrinhoVazio } from "./carrinho-vazio";
import { EsqueletoCarrinho } from "./esqueleto-carrinho";
import { ListaItensCarrinho } from "./lista-itens-carrinho";
import { ResumoCarrinho } from "./resumo-carrinho";

export function GavetaCarrinho() {
  const gaveta = useGavetaCarrinho();
  const carrinho = useCarrinho();

  return (
    // O componente concentra só a experiência visual; regras e persistência ficam no hook/lib.
    <Sheet open={gaveta.aberta} onOpenChange={gaveta.setAberta}>
      <SheetTrigger asChild>
        <Button
          aria-label="Abrir carrinho"
          className="relative size-9 rounded-md"
          size="icon"
          type="button"
          variant="ghost"
        >
          <ShoppingCart className="size-5" />

          {carrinho.totais.quantidadeTotal > 0 ? (
            <Badge className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-600 p-0 text-[10px] font-semibold text-white hover:bg-red-600">
              {carrinho.totais.quantidadeTotal}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent
        className="w-[calc(100vw-16px)] gap-0 overflow-hidden rounded-l-lg border-zinc-200 p-0 shadow-2xl sm:max-w-[440px] dark:border-zinc-800"
        side="right"
      >
        <CabecalhoGavetaCarrinho
          quantidadeTotal={carrinho.totais.quantidadeTotal}
        />

        {carrinho.carregando ? (
          <EsqueletoCarrinho />
        ) : carrinho.carrinhoVazio ? (
          <CarrinhoVazio onContinuarComprando={gaveta.fechar} />
        ) : (
          <>
            <ListaItensCarrinho
              itemAtualizandoId={carrinho.itemAtualizandoId}
              itens={carrinho.itens}
              onAumentarQuantidade={carrinho.aumentarQuantidade}
              onDiminuirQuantidade={carrinho.diminuirQuantidade}
              onRemoverItem={carrinho.removerItem}
            />

            <ResumoCarrinho
              subtotalEmCentavos={carrinho.totais.subtotalEmCentavos}
              onContinuarComprando={gaveta.fechar}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
