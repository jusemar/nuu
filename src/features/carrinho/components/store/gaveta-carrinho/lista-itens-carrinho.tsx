import { ScrollArea } from "@/components/ui/scroll-area";

import type { ItemCarrinho as ItemCarrinhoTipo } from "../../../types/carrinho.types";
import { ItemCarrinho } from "./item-carrinho";

type ListaItensCarrinhoProps = {
  itens: ItemCarrinhoTipo[];
  itemAtualizandoId: string | null;
  onAumentarQuantidade: (itemId: string) => void;
  onDiminuirQuantidade: (itemId: string) => void;
  onRemoverItem: (itemId: string) => void;
};

export function ListaItensCarrinho({
  itens,
  itemAtualizandoId,
  onAumentarQuantidade,
  onDiminuirQuantidade,
  onRemoverItem,
}: ListaItensCarrinhoProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-3 px-5 py-4">
        {itens.map((item) => (
          <ItemCarrinho
            key={item.id}
            atualizando={itemAtualizandoId === item.id}
            item={item}
            onAumentar={() => onAumentarQuantidade(item.id)}
            onDiminuir={() => onDiminuirQuantidade(item.id)}
            onRemover={() => onRemoverItem(item.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
