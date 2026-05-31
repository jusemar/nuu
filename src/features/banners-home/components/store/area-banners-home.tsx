import {
  bannerHomePrincipalFallback,
  bannerHomeSecundarioFallback,
} from "../../lib/banners-home-fallback";
import type { BannersHomeAtivos } from "../../types/banners-home.types";
import { CarrosselBannerPrincipal } from "./carrossel-banner-principal";
import { BannerSecundarioDireito } from "./banner-secundario-direito";

type AreaBannersHomeProps = {
  banners: BannersHomeAtivos;
};

export function AreaBannersHome({ banners }: AreaBannersHomeProps) {
  const bannersPrincipais =
    banners.principalEsquerdo.length > 0
      ? banners.principalEsquerdo
      : [bannerHomePrincipalFallback];

  return (
    <div className="grid grid-cols-1 items-stretch gap-3 p-3 lg:grid-cols-[1fr_300px]">
      <CarrosselBannerPrincipal banners={bannersPrincipais} />
      <BannerSecundarioDireito
        banner={banners.secundarioDireito ?? bannerHomeSecundarioFallback}
      />
    </div>
  );
}
