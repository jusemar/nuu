import { PackageCheck, Trash2 } from "lucide-react";
import Image from "next/image";

import { formatarPrecoCarrinho } from "@/features/carrinho";
import { IndicadorFreteGratisProgressivo } from "@/features/promocoes/components/store/indicador-frete-gratis-progressivo";
import type { ResultadoFreteGratisProgressivo } from "@/features/promocoes/services";

import { montarGruposVisuaisCheckout } from "../../../../lib/resumo-checkout/montar-grupos-visuais-checkout";
import type {
  ItemResumoCheckout,
  ResumoCheckoutCalculado,
  SelecaoEntregaGrupoCheckout,
} from "../../../../types/checkout.types";

type RevisaoProdutosEntregaProps = {
  resumoCheckout: ResumoCheckoutCalculado | null;
  freteGratisProgressivo?: ResultadoFreteGratisProgressivo | null;
  onRemoverItem: (itemId: string) => void;
  selecoesEntrega: SelecaoEntregaGrupoCheckout[];
  mostrarErrosSelecao: boolean;
  onSelecionarEntrega: (selecao: SelecaoEntregaGrupoCheckout) => void;
  cepEntrega: string;
};

function formatarPrazo(opcao: {
  descricao: string | null;
  prazoMinimoEmDiasUteis: number | null;
  prazoMaximoEmDiasUteis: number | null;
}) {
  if (opcao.descricao) return opcao.descricao;
  const minimo = opcao.prazoMinimoEmDiasUteis;
  const maximo = opcao.prazoMaximoEmDiasUteis;
  if (minimo === null && maximo === null) return "Prazo sob consulta";
  if (minimo === maximo || maximo === null) return `${minimo} dias úteis`;
  return `${minimo ?? maximo} a ${maximo} dias úteis`;
}

function CartaoProdutoCheckout({
  item,
  onRemoverItem,
}: {
  item: ItemResumoCheckout;
  onRemoverItem: (itemId: string) => void;
}) {
  const totalPix = item.pix.valorEmCentavos * item.quantidade;
  const totalCartao = item.cartao.valorEmCentavos * item.quantidade;
  const temAtributosVariante =
    item.atributosVariante && Object.keys(item.atributosVariante).length > 0;

  return (
    <article className="border-border bg-background hover:border-primary/30 overflow-hidden rounded-2xl border transition-colors">
      <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:p-4">
        <div className="bg-muted border-border relative flex size-16 shrink-0 items-center justify-center rounded-xl border sm:size-[72px]">
          <Image
            fill
            alt={item.nome}
            className="object-contain p-2"
            sizes="(max-width: 640px) 64px, 72px"
            src={item.imagemUrl || "/produto-sem-foto.webp"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <h3 className="text-foreground truncate text-sm font-semibold">
                {item.nome}
              </h3>
              {temAtributosVariante ? (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px]">
                  {Object.entries(item.atributosVariante ?? {})
                    .map(([nome, valor]) => `${nome}: ${valor}`)
                    .join(" • ")}
                </p>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                {!temAtributosVariante ? (
                  <>
                    <span
                      className="font-semibold"
                      style={{ color: item.modalidadeDetalhes.badgeColor }}
                    >
                      {item.modalidadeDetalhes.titulo}
                    </span>
                    <span className="text-muted-foreground">·</span>
                  </>
                ) : null}
                <span className="text-muted-foreground">
                  Produto: {item.prazoModalidade}
                </span>
              </div>
            </div>

            <span className="border-border bg-card text-foreground shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold whitespace-nowrap sm:px-2.5 sm:text-[11px]">
              Qte: {item.quantidade}
            </span>
          </div>

        </div>
      </div>

      <div className="border-border bg-card grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] border-t sm:grid-cols-[1fr_1fr_48px]">
        <div className="border-border min-w-0 border-r px-3 py-3 sm:px-4">
          <span className="block text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
            Pix
          </span>
          <span className="text-foreground mt-1 block truncate text-sm font-bold">
            {formatarPrecoCarrinho(totalPix)}
          </span>
        </div>
        <div className="border-border min-w-0 border-r px-3 py-3 sm:px-4">
          <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
            Cartão
          </span>
          <span className="text-muted-foreground mt-1 block truncate text-sm font-bold">
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
}

export function RevisaoProdutosEntrega({
  resumoCheckout,
  freteGratisProgressivo,
  onRemoverItem,
  selecoesEntrega,
  mostrarErrosSelecao,
  onSelecionarEntrega,
  cepEntrega,
}: RevisaoProdutosEntregaProps) {
  const gruposVisuais = montarGruposVisuaisCheckout(
    resumoCheckout?.gruposLogisticos ?? [],
  );

  return (
    <section className="border-border bg-card shadow-card rounded-2xl border p-4 sm:p-6 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <PackageCheck className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Produtos e entrega</h2>
            <p className="text-muted-foreground text-xs">
              Confira os produtos e escolha a forma de entrega.
            </p>
          </div>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase">
          Revisão
        </span>
      </div>

      <IndicadorFreteGratisProgressivo
        resultado={freteGratisProgressivo}
        formatarPreco={formatarPrecoCarrinho}
      />

      <div className="space-y-5">
        {gruposVisuais.map((grupo) => {
          const cotacao = resumoCheckout?.cotacoesEntrega.find(
            (atual) => atual.chaveGrupo === grupo.chave,
          );
          const selecao = selecoesEntrega.find(
            (atual) => atual.chaveGrupo === grupo.chave,
          );

          return (
          <section
            key={grupo.chave}
            aria-label={grupo.titulo ?? grupo.descricao ?? "Produtos do pedido"}
            className="min-w-0 space-y-3"
          >
            {grupo.titulo || grupo.descricao ? (
              <header className="border-border bg-muted/40 rounded-xl border px-4 py-3">
                {grupo.titulo ? (
                  <h3 className="text-foreground text-sm font-semibold">
                    {grupo.titulo}
                  </h3>
                ) : null}
                {grupo.descricao ? (
                  <p
                    className={
                      grupo.titulo
                        ? "text-muted-foreground mt-0.5 text-xs"
                        : "text-foreground text-sm font-medium"
                    }
                  >
                    {grupo.descricao}
                  </p>
                ) : null}
              </header>
            ) : null}

            <div className="min-w-0 space-y-3">
              {grupo.itens.map((item) => (
                <CartaoProdutoCheckout
                  key={item.id}
                  item={item}
                  onRemoverItem={onRemoverItem}
                />
              ))}
            </div>

            <fieldset className="min-w-0 space-y-2">
              <legend className="mb-2 text-sm font-semibold">
                Forma de entrega
              </legend>
              {cotacao?.opcoes.map((opcao) => {
                const selecionada = selecao?.identificador === opcao.identificador;
                return (
                  <label
                    key={opcao.identificador}
                    className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors sm:p-4 ${
                      selecionada
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-1 size-4 shrink-0 accent-current"
                      checked={selecionada}
                      name={`entrega-${grupo.chave}`}
                      onChange={() =>
                        onSelecionarEntrega({
                          ...opcao,
                          chaveGrupo: grupo.chave,
                          cep: cepEntrega,
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {opcao.nome}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                        {formatarPrazo(opcao)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold">
                      {opcao.valorEmCentavos === 0
                        ? "Grátis"
                        : formatarPrecoCarrinho(opcao.valorEmCentavos)}
                    </span>
                  </label>
                );
              })}
              {cotacao?.mensagemErro ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  {cotacao.mensagemErro}
                </p>
              ) : null}
              {mostrarErrosSelecao && cotacao?.opcoes.length && !selecao ? (
                <p className="text-destructive text-xs font-medium">
                  Selecione uma forma de entrega para esta entrega.
                </p>
              ) : null}
            </fieldset>
          </section>
          );
        })}
      </div>
    </section>
  );
}
