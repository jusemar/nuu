import { Bot, MessageCircleMore, Sparkles } from "lucide-react";

export function HeroContato() {
  return (
    <section className="from-primary via-primary to-primary-hover relative overflow-hidden rounded-3xl bg-gradient-to-br px-6 py-10 text-white shadow-lg sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-14 lg:py-14">
      <div className="relative z-10 max-w-2xl">
        <span className="bg-warning text-warning-foreground inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Atendimento Nooo
        </span>
        <h1 className="mt-5 text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
          Fale com a Nooo
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          Estamos aqui para ajudar você. Escolha a melhor forma de atendimento.
        </p>
      </div>

      <div className="relative mx-auto mt-10 flex min-h-56 w-full max-w-sm items-end justify-center lg:mt-0">
        <div className="absolute top-0 right-0 left-2 rounded-2xl rounded-br-sm bg-white p-4 text-sm font-semibold text-slate-800 shadow-lg sm:left-0">
          <MessageCircleMore
            className="text-primary mr-2 inline size-5"
            aria-hidden="true"
          />
          Olá! Como podemos ajudar você hoje?
        </div>
        <div className="bg-warning relative flex size-36 items-center justify-center rounded-[2.5rem] border-8 border-white/20 shadow-2xl sm:size-40">
          <Bot
            className="text-primary size-20 sm:size-24"
            aria-hidden="true"
            strokeWidth={1.7}
          />
          <span
            className="absolute -right-2 -bottom-2 size-8 rounded-full border-4 border-white bg-emerald-500"
            aria-hidden="true"
          />
        </div>
        <div
          className="bg-warning/20 absolute -right-8 bottom-8 size-24 rounded-full blur-2xl"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
