import Image from "next/image";

export function HeroContato() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-blue-50 px-6 pt-10 shadow-sm sm:px-10 sm:pt-12 lg:grid lg:min-h-[430px] lg:grid-cols-2 lg:items-center lg:px-14 lg:py-14">
      <div className="relative z-20 max-w-xl pb-8 sm:pb-10 lg:pb-0">
        <h1 className="text-primary text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Fale com a Nooo
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg text-base leading-relaxed sm:text-lg">
          Estamos aqui para ajudar você. Escolha a melhor forma de atendimento.
        </p>
      </div>

      <div className="relative z-10 mx-auto min-h-[330px] w-full max-w-[500px] sm:min-h-[390px] lg:absolute lg:inset-y-0 lg:right-4 lg:w-[53%] lg:max-w-[650px]">
        <div
          className="absolute top-[16%] right-[2%] size-44 rounded-full bg-sky-200/45 sm:size-56 lg:right-[5%] lg:size-64"
          aria-hidden="true"
        />
        <div
          className="absolute right-[34%] bottom-[4%] size-28 rounded-full bg-blue-200/35 sm:size-40 lg:size-48"
          aria-hidden="true"
        />
        <div
          className="absolute top-[7%] right-[31%] size-16 rounded-full bg-cyan-100/80 sm:size-24"
          aria-hidden="true"
        />

        <div className="absolute top-1 left-0 z-30 max-w-[220px] rounded-2xl rounded-br-sm border border-slate-100 bg-white/95 px-4 py-3 text-sm leading-snug font-medium text-slate-700 shadow-lg shadow-slate-900/10 sm:top-5 sm:left-2 sm:max-w-[250px] sm:px-5 sm:py-4 sm:text-base lg:top-10 lg:left-0">
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
