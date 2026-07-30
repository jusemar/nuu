"use client";

import { ArrowUp } from "lucide-react";
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

type PropriedadesCampoMensagemAtendente = {
  titulo: string;
  placeholder: string;
  apoio: string;
  contexto: ContextoAtendimento;
  className?: string;
};

export function CampoMensagemAtendente({
  titulo,
  placeholder,
  apoio,
  contexto,
  className,
}: PropriedadesCampoMensagemAtendente) {
  const router = useRouter();
  const enviandoRef = useRef(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const mensagemValida = mensagemAtendenteSchema.safeParse(mensagem).success;

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
      aria-labelledby={`titulo-atendente-${contexto.tipo}`}
      className={cn("mx-auto w-full max-w-4xl", className)}
    >
      <h2
        id={`titulo-atendente-${contexto.tipo}`}
        className="text-foreground text-center text-xl font-bold tracking-tight text-balance sm:text-2xl"
      >
        {titulo}
      </h2>

      <form className="mt-4" onSubmit={enviarMensagem}>
        <label
          className="sr-only"
          htmlFor={`mensagem-atendente-${contexto.tipo}`}
        >
          Mensagem para o Atendente IA
        </label>
        <div className="relative">
          <Textarea
            id={`mensagem-atendente-${contexto.tipo}`}
            value={mensagem}
            onChange={(evento) => {
              setMensagem(evento.target.value);
              if (erro) setErro(null);
            }}
            onKeyDown={tratarTecla}
            placeholder={placeholder}
            maxLength={LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO}
            aria-describedby={`apoio-atendente-${contexto.tipo}${
              erro ? ` erro-atendente-${contexto.tipo}` : ""
            }`}
            aria-invalid={Boolean(erro)}
            disabled={enviando}
            rows={4}
            className="bg-card min-h-32 resize-none rounded-2xl px-4 pt-4 pb-16 text-base shadow-sm sm:min-h-36 sm:px-5 sm:pt-5"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar mensagem e abrir atendimento"
            disabled={!mensagemValida || enviando}
            className="absolute right-3 bottom-3 size-11 rounded-full sm:right-4 sm:bottom-4"
          >
            <ArrowUp className="size-5" aria-hidden="true" strokeWidth={2.25} />
          </Button>
        </div>

        <div className="mt-2 flex min-h-5 flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p
            id={`apoio-atendente-${contexto.tipo}`}
            className="text-muted-foreground text-xs sm:text-sm"
          >
            {apoio}
          </p>
          <p className="text-muted-foreground text-xs">
            {mensagem.length}/{LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO}
          </p>
        </div>

        {erro ? (
          <p
            id={`erro-atendente-${contexto.tipo}`}
            role="alert"
            className="text-destructive mt-1 px-1 text-sm"
          >
            {erro}
          </p>
        ) : null}
      </form>
    </section>
  );
}
