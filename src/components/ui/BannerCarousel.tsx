'use client';

interface Banner {
  mobileSrc: string;
  desktopSrc: string;
  alt: string;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const imagemPrincipal = banners[0]?.desktopSrc ?? '/banner-promocao.webp';

  return (
    <section className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[1fr_300px]">
      <div className="relative min-h-[210px] overflow-hidden rounded-xl bg-gradient-to-br from-[#0A4F8A] via-[#0B6CB5] to-[#0873C4]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-14 -right-10 h-64 w-64 rounded-full bg-cyan-300/15" />
          <div className="absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-amber-300/15" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#0A4F8A]/80 to-transparent" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-center px-5 py-4 md:px-8">
          <div className="mb-2 inline-flex w-fit items-center rounded bg-amber-400/20 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] text-amber-200 uppercase">
            Oferta especial
          </div>

          <h2 className="font-sora mb-1 text-2xl leading-tight font-black text-white md:text-[28px]">
            Nome do produto aqui
          </h2>

          <div className="mb-2 flex items-end gap-2">
            <span className="text-xs text-blue-200 line-through">De R$ 599,00</span>
            <span className="font-sora text-2xl leading-none font-black text-amber-200 md:text-3xl">
              R$ 399,00
            </span>
          </div>
          <p className="mb-3 text-[11px] text-blue-100/90">
            ou 12x de R$ 33,25 sem juros
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold text-sky-100">
              Frete gratis
            </span>
            <span className="rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold text-sky-100">
              12x sem juros
            </span>
            <span className="rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold text-sky-100">
              Entrega hoje
            </span>
          </div>

          <a
            href="#"
            className="inline-flex w-fit items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-[#1C0A00] transition-opacity hover:opacity-90"
          >
            Comprar agora
          </a>
        </div>

        <div className="absolute right-2 bottom-0 z-10 hidden h-full w-[170px] items-end justify-center md:flex">
          <img
            src={imagemPrincipal}
            alt={banners[0]?.alt ?? 'Produto em destaque'}
            className="h-[188px] w-[148px] object-contain"
          />
        </div>
      </div>

      <aside className="relative min-h-[210px] overflow-hidden rounded-xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] p-5">
        <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-green-400/20" />
        <div className="relative z-10">
          <div className="mb-2 inline-flex w-fit items-center rounded bg-green-700/10 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] text-green-900 uppercase">
            Participe
          </div>
          <h3 className="font-sora mb-2 text-lg leading-tight font-black text-green-900">
            Como participar
            <br />
            do sorteio
          </h3>
          <div className="space-y-1.5 text-[11px] text-green-800">
            <p>1. Faça uma compra acima de R$ 150</p>
            <p>2. Cadastre seu cupom no site</p>
            <p>3. Aguarde o sorteio dia 30/08</p>
          </div>
          <a
            href="#"
            className="mt-4 inline-flex w-fit items-center rounded-md bg-green-600 px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            Saiba mais
          </a>
        </div>
      </aside>
    </section>
  );
}
