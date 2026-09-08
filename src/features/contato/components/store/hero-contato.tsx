import Image from "next/image";

export function HeroContato() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-blue-50 px-6 pt-7 shadow-sm sm:px-8 sm:pt-8 lg:grid lg:min-h-[340px] lg:grid-cols-2 lg:items-center lg:px-12 lg:py-10">
      <div className="relative z-20 max-w-xl pb-5 sm:pb-6 lg:pb-0">
        <h1 className="text-primary text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Fale com a Nooo
        </h1>
        <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
          Estamos aqui para ajudar você. Escolha a melhor forma de atendimento.
        </p>
      </div>

      <div className="relative z-10 mx-auto min-h-[250px] w-full max-w-[400px] sm:min-h-[300px] lg:absolute lg:inset-y-0 lg:right-5 lg:w-[48%] lg:max-w-[520px]">
        <div
          className="absolute top-[16%] right-[2%] size-36 rounded-full bg-sky-200/45 sm:size-44 lg:right-[5%] lg:size-52"
          aria-hidden="true"
        />
        <div
          className="absolute right-[34%] bottom-[4%] size-24 rounded-full bg-blue-200/35 sm:size-32 lg:size-36"
          aria-hidden="true"
        />
        <div
          className="absolute top-[7%] right-[31%] size-14 rounded-full bg-cyan-100/80 sm:size-20"
          aria-hidden="true"
        />

        <div className="absolute top-1 left-0 z-30 max-w-[190px] rounded-xl rounded-br-sm border border-slate-100 bg-white/95 px-3.5 py-2.5 text-xs leading-snug font-medium text-slate-700 shadow-md shadow-slate-900/10 sm:top-4 sm:left-2 sm:max-w-[215px] sm:px-4 sm:py-3 sm:text-sm lg:top-7 lg:left-0">
          <span className="text-primary block font-bold">Olá!</span>
          <span>Como podemos ajudar você hoje?</span>
          <span
            className="absolute -right-2 bottom-4 size-4 rotate-45 border-t border-r border-slate-100 bg-white"
            aria-hidden="true"
          />
        </div>

        <Image
          src="/images/contato/robo-nooo.webp"
          alt="Robô assistente da Nooo sorrindo e cumprimentando"
          fill
          priority
          sizes="(max-width: 1023px) 90vw, 53vw"
          className="z-20 object-contain object-right-bottom drop-shadow-[0_18px_22px_rgba(15,63,110,0.16)]"
        />
      </div>
    </section>
  );
}
