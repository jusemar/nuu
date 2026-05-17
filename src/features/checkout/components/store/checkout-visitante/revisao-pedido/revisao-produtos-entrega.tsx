import { PackageCheck, Truck, Trash2 } from "lucide-react";
import Image from "next/image";

import { formatarPrecoCarrinho } from "@/features/carrinho";

import type { ResumoCheckoutCalculado } from "../../../../types/checkout.types";

type RevisaoProdutosEntregaProps = {
  resumoCheckout: ResumoCheckoutCalculado | null;
  onRemoverItem: (itemId: string) => void;
};

export function RevisaoProdutosEntrega({
  resumoCheckout,
  onRemoverItem,
}: RevisaoProdutosEntregaProps) {
  return (
    <section className="border-border bg-card shadow-card rounded-2xl border p-6 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <PackageCheck className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Produtos e entrega</h2>
            <p className="text-muted-foreground text-xs">
              Confira a modalidade e o frete escolhidos na página do produto.
            </p>
          </div>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase">
          Revisão
        </span>
      </div>

      <div className="space-y-3">
        {resumoCheckout?.itens.map((item) => {
          const totalPix = item.pix.valorEmCentavos * item.quantidade;
          const totalCartao = item.cartao.valorEmCentavos * item.quantidade;
          const freteTexto =
            item.frete.valorEmCentavos === 0
              ? "Grátis"
              : formatarPrecoCarrinho(item.frete.valorEmCentavos);

          return (
            <article
              key={item.id}
              className="border-border bg-background hover:border-primary/30 overflow-hidden rounded-2xl border transition-colors"
            >
              <div className="grid grid-cols-[72px_1fr_auto] gap-3 p-4">
                <div className="bg-muted border-border relative flex size-[72px] shrink-0 items-center justify-center rounded-xl border">
                  <Image
                    fill
                    alt={item.nome}
                    className="object-contain p-2"
                    sizes="80px"
                    src={item.imagemUrl || "/produto-sem-foto.webp"}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-foreground truncate text-sm font-semibold">
                        {item.nome}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span
                          className="font-semibold"
                          style={{
                            color: item.modalidadeDetalhes.badgeColor,
                          }}
                        >
                          {item.modalidadeDetalhes.titulo}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          Produto: {item.prazoModalidade}
                        </span>
                      </div>
                    </div>

                    <span className="border-border bg-card text-foreground rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
                      Qte: {item.quantidade}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                    <div className="text-muted-foreground flex min-w-0 items-center gap-1.5">
                      <Truck className="size-3.5 shrink-0" />
                      <span className="text-foreground truncate font-medium">
                        {item.frete.nome}
                      </span>
                      <span>·</span>
                      <span className="truncate">{item.frete.prazo}</span>
                    </div>
                    <span
                      className={
                        item.frete.valorEmCentavos === 0
                          ? "shrink-0 font-semibold text-emerald-600"
                          : "text-foreground shrink-0 font-semibold"
                      }
                    >
                      {freteTexto}
                    </span>
                  </div>
                </div>

                <div />
              </div>

              <div className="border-border bg-card grid grid-cols-[1fr_1fr_48px] border-t">
                <div className="border-border border-r px-4 py-3">
                  <span className="block text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                    Pix
                  </span>
                  <span className="text-foreground mt-1 block text-sm font-bold">
                    {formatarPrecoCarrinho(totalPix)}
                  </span>
                </div>

                <div className="border-border border-r px-4 py-3">
                  <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                    Cartão
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm font-bold">
                    {formatarPrecoCarrinho(totalCartao)}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={`Excluir ${item.nome}`}
                  className="text-muted-foreground flex items-center justify-center transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={() => onRemoverItem(item.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
