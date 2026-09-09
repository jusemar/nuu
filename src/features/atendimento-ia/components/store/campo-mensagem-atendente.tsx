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
        visualHome ? "relative max-w-6xl" : "max-w-4xl",
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
            "bg-card border-border shadow-elevation-2 relative isolate overflow-visible rounded-2xl border px-4 pt-24 pb-3 sm:px-6 sm:pt-28 md:min-h-40 md:px-6 md:py-3.5 lg:px-8",
        )}
      >
        {visualHome ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          >
            <span className="bg-primary-light/65 absolute -top-20 left-12 size-48 rounded-full blur-2xl" />
            <span className="bg-success-light/70 absolute right-16 -bottom-28 size-64 rounded-full blur-3xl" />
            <span className="bg-primary/15 absolute top-7 right-[36%] size-2 rounded-full" />
            <span className="bg-success/20 absolute right-[28%] bottom-7 size-1.5 rounded-full" />
          </div>
        ) : null}

        {visualHome ? (
          <div className="relative z-10">
            <div className="pointer-events-none absolute inset-x-0 -top-48 h-44 sm:-top-52 sm:h-48 md:-top-24 md:left-0 md:h-60 md:w-80 lg:w-96">
              <div className="pointer-events-auto absolute top-8 right-0 left-[48%] z-30 sm:left-48 md:top-8 md:right-auto md:left-44 md:w-32 lg:left-48 lg:w-44">
                <BalaoFrasesAssistente />
              </div>
              <div className="absolute -bottom-1 -left-3 z-20 h-44 w-44 motion-safe:animate-[assistente-respirar_5.5s_ease-in-out_infinite] max-[359px]:h-40 max-[359px]:w-40 sm:-bottom-2 sm:-left-1 sm:h-48 sm:w-48 md:-bottom-8 md:-left-6 md:h-60 md:w-60 lg:-left-9 lg:h-64 lg:w-64">
                <Image
                  src="/images/mascote-nooo-webp.webp"
                  alt="Mascote Nooo apontando para o campo da assistente"
                  fill
                  sizes="(max-width: 640px) 176px, (max-width: 1024px) 192px, 256px"
                  className="object-contain"
                />
                {/* O brilho acompanha a imagem e permanece na ponta do dedo. */}
                <span
                  aria-hidden="true"
                  className="bg-info absolute top-[47%] left-[89%] size-2 rounded-full shadow-[0_0_12px_4px_var(--info)] motion-safe:animate-pulse"
                />
                <span
                  aria-hidden="true"
                  className="border-info/50 absolute top-[49%] left-[94%] w-8 border-t border-dashed md:w-24 lg:w-36"
                />
              </div>
            </div>

            <div className="relative z-20 min-w-0 md:ml-80 lg:ml-96">
              <div className="text-muted-foreground mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                <span>Assistente Nooo</span>
                <span aria-hidden="true">•</span>
                <span className="text-success-dark inline-flex items-center gap-1 tracking-normal normal-case">
                  <span className="bg-success shadow-success/15 size-2 rounded-full shadow-[0_0_0_3px]" />
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

              <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                <Headphones className="size-3.5 shrink-0" aria-hidden="true" />
                Atendimento por pessoa disponível. É só solicitar!
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
  const temApoio = apoio.trim().length > 0;
  const idsDescricao = [temApoio ? idApoio : null, erro ? idErro : null]
    .filter(Boolean)
    .join(" ");

  return (
    <form className={cn(visualHome ? "relative" : "mt-4")} onSubmit={aoEnviar}>
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
          aria-describedby={idsDescricao || undefined}
          aria-invalid={Boolean(erro)}
          disabled={enviando}
          rows={visualHome ? 2 : 4}
          className={cn(
            "bg-card resize-none px-4 text-base shadow-sm",
            visualHome
              ? "border-input shadow-elevation-1 focus-visible:border-ring min-h-20 rounded-xl pt-3 pr-14 pb-8 focus-visible:ring-2 sm:min-h-20 sm:px-4 sm:pt-3 sm:pr-14"
              : "min-h-32 rounded-2xl pt-4 pb-16 sm:min-h-36 sm:px-5 sm:pt-5",
          )}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Enviar mensagem e abrir atendimento"
          disabled={!mensagemValida || enviando}
          className={cn(
            "bg-primary hover:bg-primary-hover shadow-elevation-1 absolute rounded-full transition-transform active:scale-95",
            visualHome
              ? "right-2.5 bottom-2.5 size-9"
              : "right-3 bottom-3 size-11 sm:right-4 sm:bottom-4",
          )}
        >
          <ArrowUp className="size-5" aria-hidden="true" strokeWidth={2.25} />
        </Button>
      </div>

      <div
        className={cn(
          "flex px-1",
          visualHome
            ? "pointer-events-none absolute bottom-2 left-3 justify-start"
            : "mt-2 min-h-5 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        {temApoio ? (
          <p id={idApoio} className="text-muted-foreground text-xs sm:text-sm">
            {apoio}
          </p>
        ) : null}
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
