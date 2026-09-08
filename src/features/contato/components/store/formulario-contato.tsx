"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import Script from "next/script";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { enviarMensagemContato } from "../../actions/enviar-mensagem-contato";
import { LIMITES_FORMULARIO_CONTATO } from "../../schemas/formulario-contato.schema";
import { ESTADO_INICIAL_ENVIO_CONTATO } from "../../types/estado-envio-contato";

declare global {
  interface Window {
    turnstile?: {
      render: (
        elemento: HTMLElement,
        opcoes: {
          sitekey: string;
          action: string;
          theme: "light";
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      reset: (identificador: string) => void;
      remove: (identificador: string) => void;
    };
  }
}

function MensagemCampo({ id, mensagem }: { id: string; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p id={id} className="text-destructive mt-1.5 text-sm" role="alert">
      {mensagem}
    </p>
  );
}

function BotaoEnviar({ liberado }: { liberado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending || !liberado}
      className="w-full sm:w-auto"
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Send aria-hidden="true" />
      )}
      {pending ? "Enviando..." : "Enviar mensagem"}
    </Button>
  );
}

export function FormularioContato() {
  const [estado, executarAction] = useActionState(
    enviarMensagemContato,
    ESTADO_INICIAL_ENVIO_CONTATO,
  );
  const [scriptPronto, setScriptPronto] = useState(false);
  const [token, setToken] = useState("");
  const formularioRef = useRef<HTMLFormElement>(null);
  const recipienteTurnstileRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    if (
      !scriptPronto ||
      !siteKey ||
      !window.turnstile ||
      !recipienteTurnstileRef.current ||
      widgetRef.current
    ) {
      return;
    }

    widgetRef.current = window.turnstile.render(
      recipienteTurnstileRef.current,
      {
        sitekey: siteKey,
        action: "contato",
        theme: "light",
        callback: setToken,
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      },
    );

    return () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [scriptPronto, siteKey]);

  useEffect(() => {
    if (!["sucesso", "turnstile", "erro"].includes(estado.status)) return;
    if (estado.status === "sucesso") formularioRef.current?.reset();
    setToken("");
    if (widgetRef.current && window.turnstile) {
      window.turnstile.reset(widgetRef.current);
    }
  }, [estado]);

  const ehSucesso = estado.status === "sucesso";

  return (
    <section aria-labelledby="titulo-formulario-contato">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptPronto(true)}
        onReady={() => setScriptPronto(true)}
      />
      <Card className="mx-auto w-full max-w-4xl border-sky-100 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle
            id="titulo-formulario-contato"
            className="text-2xl sm:text-3xl"
          >
            Envie uma mensagem
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Preencha os dados abaixo e nossa equipe responderá o mais breve
            possível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formularioRef}
            action={executarAction}
            className="space-y-5"
          >
            <div
              className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden"
              aria-hidden="true"
            >
              <Label htmlFor="website">Não preencha este campo</Label>
              <Input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  autoComplete="name"
                  maxLength={LIMITES_FORMULARIO_CONTATO.nome}
                  aria-invalid={Boolean(estado.erros?.nome)}
                  aria-describedby={
                    estado.erros?.nome ? "erro-nome" : undefined
                  }
                  className="mt-2 h-11"
                  required
                />
                <MensagemCampo id="erro-nome" mensagem={estado.erros?.nome} />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={LIMITES_FORMULARIO_CONTATO.email}
                  aria-invalid={Boolean(estado.erros?.email)}
                  aria-describedby={
                    estado.erros?.email ? "erro-email" : undefined
                  }
                  className="mt-2 h-11"
                  required
                />
                <MensagemCampo id="erro-email" mensagem={estado.erros?.email} />
              </div>
            </div>

            <div>
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                name="assunto"
                maxLength={LIMITES_FORMULARIO_CONTATO.assunto}
                aria-invalid={Boolean(estado.erros?.assunto)}
                aria-describedby={
                  estado.erros?.assunto ? "erro-assunto" : undefined
                }
                className="mt-2 h-11"
                required
              />
              <MensagemCampo
                id="erro-assunto"
                mensagem={estado.erros?.assunto}
              />
            </div>

            <div>
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                name="mensagem"
                rows={6}
                maxLength={LIMITES_FORMULARIO_CONTATO.mensagem}
                aria-invalid={Boolean(estado.erros?.mensagem)}
                aria-describedby={
                  estado.erros?.mensagem ? "erro-mensagem" : "limite-mensagem"
                }
                className="mt-2 min-h-36 resize-y"
                required
              />
              <div className="mt-1.5 flex flex-wrap justify-between gap-2">
                <MensagemCampo
                  id="erro-mensagem"
                  mensagem={estado.erros?.mensagem}
                />
                <p
                  id="limite-mensagem"
                  className="text-muted-foreground ml-auto text-xs"
                >
                  Até {LIMITES_FORMULARIO_CONTATO.mensagem} caracteres
                </p>
              </div>
            </div>

            <input type="hidden" name="turnstileToken" value={token} />
            <div className="flex min-h-[70px] justify-center overflow-hidden sm:justify-start">
              {siteKey ? (
                <div ref={recipienteTurnstileRef} />
              ) : (
                <p className="text-destructive text-sm" role="alert">
                  A verificação de segurança está temporariamente indisponível.
                </p>
              )}
            </div>

            {estado.mensagem ? (
              <div
                className={
                  ehSucesso
                    ? "border-success/30 bg-success/5 text-success-dark flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
                    : "border-destructive/20 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm"
                }
                role={ehSucesso ? "status" : "alert"}
                aria-live="polite"
              >
                {ehSucesso ? (
                  <CheckCircle2
                    className="size-5 shrink-0"
                    aria-hidden="true"
                  />
                ) : null}
                {estado.mensagem}
              </div>
            ) : null}

            <BotaoEnviar liberado={Boolean(token && siteKey)} />
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
