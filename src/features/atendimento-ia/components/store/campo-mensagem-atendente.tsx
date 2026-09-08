"use client";

import { ArrowUp, Headphones } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO } from "../../constants/atendimento-storage";
import { salvarHandoffAtendimento } from "../../lib/handoff-atendimento";
import {
  type ContextoAtendimento,
  mensagemAtendenteSchema,
} from "../../schemas/mensagem-atendente.schema";
import { BalaoFrasesAssistente } from "./balao-frases-assistente";

type PropriedadesCampoMensagemAtendente = {
  titulo: string;
  placeholder: string;
  apoio: string;
  contexto: ContextoAtendimento;
  className?: string;
  visual?: "padrao" | "home-mascote";
};

export function CampoMensagemAtendente({
  titulo,
  placeholder,
  apoio,
  contexto,
  className,
  visual = "padrao",
}: PropriedadesCampoMensagemAtendente) {
  const router = useRouter();
  const enviandoRef = useRef(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const mensagemValida = mensagemAtendenteSchema.safeParse(mensagem).success;
  const visualHome = visual === "home-mascote";
  const idTitulo = `titulo-atendente-${contexto.tipo}`;
  const idMensagem = `mensagem-atendente-${contexto.tipo}`;
  const idApoio = `apoio-atendente-${contexto.tipo}`;
  const idErro = `erro-atendente-${contexto.tipo}`;

  function enviarMensagem(evento?: FormEvent<HTMLFormElement>) {
    evento?.preventDefault();

    if (enviandoRef.current) return;

    const resultado = mensagemAtendenteSchema.safeParse(mensagem);
    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message ?? "Revise sua mensagem.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    setErro(null);

    try {
      salvarHandoffAtendimento({
        versao: 1,
        mensagem: resultado.data,
        contexto,
      });
      router.push("/atendimento");
    } catch {
      enviandoRef.current = false;
      setEnviando(false);
      setErro("Não foi possível abrir o atendimento. Tente novamente.");
    }
  }

  function tratarTecla(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key !== "Enter" || evento.shiftKey) return;

    evento.preventDefault();
    enviarMensagem();
  }

  return (
    <section
      aria-labelledby={idTitulo}
      className={cn(
        "mx-auto w-full",
        visualHome ? "max-w-6xl" : "max-w-4xl",
        className,
      )}
    >
      <h2
        id={idTitulo}
        className={cn(
          visualHome
            ? "sr-only"
            : "text-foreground text-center text-xl font-bold tracking-tight text-balance sm:text-2xl",
        )}
      >
        {titulo}
      </h2>

      <div
        className={cn(
          visualHome &&
            "relative isolate overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-white via-sky-50/80 to-blue-50/90 px-4 pt-5 pb-4 shadow-[0_18px_50px_-30px_rgba(12,68,124,0.55)] sm:px-6 sm:py-5 lg:min-h-64 lg:overflow-visible lg:px-8",
        )}
      >
        {visualHome ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          >
            <span className="absolute -top-16 left-16 size-44 rounded-full bg-sky-200/25 blur-2xl" />
            <span className="absolute right-16 -bottom-24 size-64 rounded-full bg-blue-200/25 blur-3xl" />
            <span className="absolute top-8 right-[35%] size-2 rounded-full bg-sky-300/45" />
            <span className="absolute right-[30%] bottom-8 size-1.5 rounded-full bg-blue-300/40" />
          </div>
        ) : null}

        {visualHome ? (
          <div className="relative z-10 grid gap-3.5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center lg:gap-7">
            <div className="relative mx-auto h-40 w-full max-w-72 sm:h-44 lg:h-56 lg:max-w-none">
              <div className="absolute top-0 right-0 z-20 w-44 sm:w-52 lg:-top-2 lg:-right-8 lg:w-56">
                <BalaoFrasesAssistente />
              </div>
              <div className="absolute -bottom-5 -left-5 z-10 h-48 w-52 motion-safe:animate-[assistente-respirar_5.5s_ease-in-out_infinite] sm:-left-3 sm:h-52 sm:w-56 lg:-bottom-9 lg:-left-10 lg:h-72 lg:w-72">
                <Image
                  src="/images/mascote-nooo-webp.webp"
                  alt="Mascote Nooo apontando para o campo da assistente"
                  fill
                  sizes="(max-width: 640px) 208px, (max-width: 1024px) 224px, 288px"
                  className="object-contain"
                />
              </div>
              <span className="absolute right-1 bottom-11 z-20 size-3 rounded-full bg-cyan-300 shadow-[0_0_18px_7px_rgba(34,211,238,0.45)] motion-safe:animate-pulse sm:right-4 lg:-right-1 lg:bottom-20" />
            </div>

            <div className="relative z-20 min-w-0 rounded-2xl bg-white/45 p-3 backdrop-blur-[2px] sm:p-4 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-slate-600 uppercase">
                <span>Assistente Nooo</span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1 tracking-normal text-emerald-700 normal-case">
                  <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.13)]" />
                  disponível
                </span>
              </div>

              <FormularioMensagem
                visualHome
                idMensagem={idMensagem}
                idApoio={idApoio}
                idErro={idErro}
                mensagem={mensagem}
                erro={erro}
                enviando={enviando}
                mensagemValida={mensagemValida}
                placeholder={placeholder}
                apoio={apoio}
                aoEnviar={enviarMensagem}
                aoDigitar={(valor) => {
                  setMensagem(valor);
                  if (erro) setErro(null);
                }}
                aoPressionarTecla={tratarTecla}
              />

              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Headphones className="size-3.5 shrink-0" aria-hidden="true" />
                Atendimento humano também está disponível quando você quiser.
              </p>
            </div>
          </div>
        ) : (
          <FormularioMensagem
            idMensagem={idMensagem}
            idApoio={idApoio}
            idErro={idErro}
            mensagem={mensagem}
            erro={erro}
            enviando={enviando}
            mensagemValida={mensagemValida}
            placeholder={placeholder}
            apoio={apoio}
            aoEnviar={enviarMensagem}
            aoDigitar={(valor) => {
              setMensagem(valor);
              if (erro) setErro(null);
            }}
            aoPressionarTecla={tratarTecla}
          />
        )}
      </div>
    </section>
  );
}

type PropriedadesFormularioMensagem = {
  visualHome?: boolean;
  idMensagem: string;
  idApoio: string;
  idErro: string;
  mensagem: string;
  erro: string | null;
  enviando: boolean;
  mensagemValida: boolean;
  placeholder: string;
  apoio: string;
  aoEnviar: (evento?: FormEvent<HTMLFormElement>) => void;
  aoDigitar: (valor: string) => void;
  aoPressionarTecla: (evento: KeyboardEvent<HTMLTextAreaElement>) => void;
};

/** Mantém um único formulário e uma única ligação com o fluxo de handoff. */
function FormularioMensagem({
  visualHome = false,
  idMensagem,
  idApoio,
  idErro,
  mensagem,
  erro,
  enviando,
  mensagemValida,
  placeholder,
  apoio,
  aoEnviar,
  aoDigitar,
  aoPressionarTecla,
}: PropriedadesFormularioMensagem) {
  return (
    <form className={cn(!visualHome && "mt-4")} onSubmit={aoEnviar}>
      <label className="sr-only" htmlFor={idMensagem}>
        Mensagem para o Atendente IA
      </label>
      <div className="relative">
        <Textarea
          id={idMensagem}
          value={mensagem}
          onChange={(evento) => aoDigitar(evento.target.value)}
          onKeyDown={aoPressionarTecla}
          placeholder={placeholder}
          maxLength={LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO}
          aria-describedby={`${idApoio}${erro ? ` ${idErro}` : ""}`}
          aria-invalid={Boolean(erro)}
          disabled={enviando}
          rows={visualHome ? 2 : 4}
          className={cn(
            "bg-card resize-none px-4 text-base shadow-sm",
            visualHome
              ? "min-h-24 rounded-2xl border-sky-100 pt-3.5 pr-16 pb-10 shadow-[0_10px_30px_-20px_rgba(12,68,124,0.45)] focus-visible:border-sky-300 focus-visible:ring-sky-200/60 sm:min-h-24 sm:px-5 sm:pt-4 sm:pr-16"
              : "min-h-32 rounded-2xl pt-4 pb-16 sm:min-h-36 sm:px-5 sm:pt-5",
          )}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Enviar mensagem e abrir atendimento"
          disabled={!mensagemValida || enviando}
          className={cn(
            "absolute rounded-full bg-[#0C447C] shadow-md transition-transform hover:bg-[#0A3A6A] active:scale-95",
            visualHome
              ? "right-3 bottom-3 size-10"
              : "right-3 bottom-3 size-11 sm:right-4 sm:bottom-4",
          )}
        >
          <ArrowUp className="size-5" aria-hidden="true" strokeWidth={2.25} />
        </Button>
      </div>

      <div className="mt-2 flex min-h-5 flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <p id={idApoio} className="text-muted-foreground text-xs sm:text-sm">
          {apoio}
        </p>
        <p className="text-muted-foreground text-xs">
          {mensagem.length}/{LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO}
        </p>
      </div>

      {erro ? (
        <p
          id={idErro}
          role="alert"
          className="text-destructive mt-1 px-1 text-sm"
        >
          {erro}
        </p>
      ) : null}
    </form>
  );
}
