"use client";

import { ArrowLeft, Bot, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Footer } from "@/components/common/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Header } from "@/features/header";

import { consumirHandoffAtendimento } from "../../lib/handoff-atendimento";
import type { HandoffAtendimento } from "../../schemas/mensagem-atendente.schema";

export function PaginaAtendimento() {
  const consumoIniciadoRef = useRef(false);
  const [handoff, setHandoff] = useState<HandoffAtendimento | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // O ref evita uma segunda leitura durante verificações de efeito do React.
    if (consumoIniciadoRef.current) return;
    consumoIniciadoRef.current = true;

    setHandoff(consumirHandoffAtendimento());
    setCarregando(false);
  }, []);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />

      <Container as="main" className="flex flex-1 flex-col py-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
          <div className="flex items-center gap-3 border-b pb-5">
            <Button asChild variant="ghost" size="icon">
              <Link href="/" aria-label="Voltar para a home">
                <ArrowLeft aria-hidden="true" />
              </Link>
            </Button>
            <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">Atendente IA</h1>
              <p className="text-muted-foreground text-sm">
                Experiência visual em preparação
              </p>
            </div>
          </div>

          <section
            aria-label="Conversa com o Atendente IA"
            className="flex flex-1 flex-col py-6"
          >
            {carregando ? (
              <p className="text-muted-foreground text-sm" role="status">
                Preparando a conversa…
              </p>
            ) : handoff ? (
              <>
                {handoff.contexto.tipo === "produto" ? (
                  <p className="text-muted-foreground mb-4 text-sm">
                    Contexto:{" "}
                    <span className="text-foreground font-medium">
                      {handoff.contexto.produto.nome}
                    </span>
                  </p>
                ) : null}

                <div className="ml-auto flex max-w-[88%] items-end gap-2 sm:max-w-[75%]">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap sm:text-base">
                    {handoff.mensagem}
                  </div>
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </>
            ) : (
              <Card className="mx-auto mt-4 w-full max-w-xl">
                <CardContent className="text-center">
                  <h2 className="font-semibold">Nenhuma mensagem iniciada</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Comece pela home ou por uma página de produto para trazer
                    sua primeira pergunta até aqui.
                  </p>
                  <Button asChild className="mt-5">
                    <Link href="/">Ir para a home</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {!carregando && handoff ? (
              <Card className="border-primary/20 bg-primary/5 mt-8">
                <CardContent className="flex gap-3">
                  <Bot
                    className="text-primary mt-0.5 size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-sm font-semibold">
                      Integração ainda não ativa
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      Sua mensagem chegou a esta experiência visual, mas o
                      Atendente IA ainda não está conectado para responder.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </div>
      </Container>

      <Footer />
    </div>
  );
}
