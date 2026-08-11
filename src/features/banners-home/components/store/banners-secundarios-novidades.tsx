import type { BannersHomeAtivos } from "../../types/banners-home.types";
import { BannerSecundarioDireito } from "./banner-secundario-direito";

type BannersSecundariosNovidadesProps = {
  banners: Pick<
    BannersHomeAtivos,
    "novidadesSecundarioEsquerdo" | "novidadesSecundarioDireito"
  >;
};

const classesSlot =
  "min-h-[150px] sm:min-h-[170px] lg:min-h-0 lg:flex-1";

/** Mantém os dois espaços originais mesmo quando uma posição está inativa. */
export function BannersSecundariosNovidades({
  banners,
}: BannersSecundariosNovidadesProps) {
  const posicoes = [
    banners.novidadesSecundarioEsquerdo,
    banners.novidadesSecundarioDireito,
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {posicoes.map((banner, indice) =>
        banner ? (
          <BannerSecundarioDireito
            key={banner.id}
            banner={banner}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={classesSlot}
          />
        ) : (
          <div
            key={indice === 0 ? "slot-esquerdo" : "slot-direito"}
            aria-hidden="true"
            className={`${classesSlot} rounded-xl border border-dashed border-border/60 bg-muted/20`}
          />
        ),
      )}
    </div>
  );
}
