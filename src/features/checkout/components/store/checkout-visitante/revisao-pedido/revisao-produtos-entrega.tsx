import Image from "next/image";

import { formatarPrecoCarrinho } from "@/features/carrinho";

import type { ResumoCheckoutCalculado } from "../../../../types/checkout.types";

type RevisaoProdutosEntregaProps = {
  resumoCheckout: ResumoCheckoutCalculado | null;
};

export function RevisaoProdutosEntrega({
  resumoCheckout,
}: RevisaoProdutosEntregaProps) {
  function formatarDataPromocao(data: Date | string | null) {
    if (!data) return null;

    return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
  }

  return (
    <section className="border-border bg-card shadow-card rounded-2xl border p-6 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Produtos e entrega</h2>
          <p className="text-muted-foreground text-xs">
            Confira a modalidade e o frete escolhidos na página do produto.
          </p>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase">
          Revisão
        </span>
      </div>

      <div className="space-y-3">
        {resumoCheckout?.itens.map((item) => {
          const parcelamentoDestaque = item.cartao.parcelamentos[0];
          const promocaoTerminaEm = formatarDataPromocao(
            item.modalidadeDetalhes.promocaoTerminaEm,
          );

          return (
            <article
              key={item.id}
              className="border-border bg-background rounded-xl border p-3"
            >
              <div className="flex gap-3">
                <div className="bg-muted relative flex size-20 shrink-0 items-center justify-center rounded-lg">
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
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Quantidade: {item.quantidade}
                      </p>
                    </div>
                    <span className="bg-accent text-accent-foreground rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
                      {item.modalidadeDetalhes.icone} {item.modalidade}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="border-border bg-card rounded-lg border px-3 py-2">
                      <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                        Modalidade
                      </span>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-foreground text-xs font-semibold">
                          {item.modalidadeDetalhes.titulo}
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            background: item.modalidadeDetalhes.badgeBg,
                            color: item.modalidadeDetalhes.badgeColor,
                          }}
                        >
                          {item.modalidadeDetalhes.badge}
                        </span>
                      </div>

                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div>
                          <dt className="text-muted-foreground">Prazo</dt>
                          <dd className="text-foreground font-medium">
                            {item.prazoModalidade}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Garantia</dt>
                          <dd className="text-foreground font-medium">
                            {item.modalidadeDetalhes.garantia}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Tipo</dt>
                          <dd className="text-foreground font-medium">
                            {item.modalidadeDetalhes.tipo}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="border-border bg-card rounded-lg border px-3 py-2">
                      <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                        Frete escolhido
                      </span>
                      <span className="text-foreground mt-0.5 block text-xs font-medium">
                        {item.frete.nome} · {item.frete.prazo}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {item.frete.valorEmCentavos === 0
                          ? "Grátis"
                          : formatarPrecoCarrinho(item.frete.valorEmCentavos)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Pix {item.pix.valor}
                    </span>
                    <span className="border-border bg-card text-foreground rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                      Cartão {item.cartao.valor}
                      {parcelamentoDestaque
                        ? ` · ${parcelamentoDestaque.parcelas}x ${parcelamentoDestaque.valor}`
                        : ""}
                    </span>
                    {item.modalidadeDetalhes.possuiPromocao &&
                    item.modalidadeDetalhes.precoPromocional ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Promo {item.modalidadeDetalhes.precoPromocional}
                        {promocaoTerminaEm ? ` até ${promocaoTerminaEm}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
