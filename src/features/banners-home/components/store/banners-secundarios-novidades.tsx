import type { BannersHomeAtivos } from "../../types/banners-home.types";
import { BannerSecundarioDireito } from "./banner-secundario-direito";

type BannersSecundariosNovidadesProps = {
  banners: Pick<
    BannersHomeAtivos,
    "novidadesSecundarioEsquerdo" | "novidadesSecundarioDireito"
  >;
};

const classesSlot = "min-h-[150px] sm:min-h-[170px] lg:min-h-0 lg:flex-1";

/** Renderiza somente campanhas ativas, sem expor slots vazios ao cliente. */
export function BannersSecundariosNovidades({
  banners,
}: BannersSecundariosNovidadesProps) {
  const bannersAtivos = [
    banners.novidadesSecundarioEsquerdo,
    banners.novidadesSecundarioDireito,
  ].filter((banner) => banner !== null);

  if (bannersAtivos.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {bannersAtivos.map((banner) => (
        <BannerSecundarioDireito
          key={banner.id}
          banner={banner}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={classesSlot}
        />
      ))}
    </div>
  );
}
