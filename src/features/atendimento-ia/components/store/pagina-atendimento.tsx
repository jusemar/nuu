"use client";

import {
  ArrowLeft,
  ArrowUp,
  Bot,
  LoaderCircle,
  RotateCcw,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Footer } from "@/components/common/footer";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/features/header";

import {
  CHAVE_CONVERSA_ATENDIMENTO,
  LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO,
} from "../../constants/atendimento-storage";
import {
  enviarMensagemChat,
  ErroChatAtendimento,
  recuperarHistoricoChat,
} from "../../lib/cliente-chat-atendimento";
import { consumirHandoffAtendimento } from "../../lib/handoff-atendimento";
import { mensagemAtendenteSchema } from "../../schemas/mensagem-atendente.schema";
import type {
  MensagemChatAtendimento,
  TransferenciaChatAtendimento,
} from "../../types/chat";
import { CartaoTransferenciaWhatsapp } from "./cartao-transferencia-whatsapp";

type TentativaPendente = { chaveIdempotencia: string; mensagem: string };

export function PaginaAtendimento() {
  const fimConversaRef = useRef<HTMLDivElement>(null);
  const inicioExecutadoRef = useRef(false);
  const tentativaRef = useRef<TentativaPendente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [conversaId, setConversaId] = useState<string | undefined>();
  const [digitada, setDigitada] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChatAtendimento[]>([]);
  const [processando, setProcessando] = useState(false);
  const [transferencia, setTransferencia] =
    useState<TransferenciaChatAtendimento | null>(null);

  const enviar = useCallback(
    async (texto: string, repetir = false, conversaAlvo = conversaId) => {
      const validacao = mensagemAtendenteSchema.safeParse(texto);
      if (!validacao.success || processando) {
        if (!validacao.success)
          setErro(validacao.error.issues[0]?.message ?? "Revise sua mensagem.");
        return;
      }

      const tentativa =
        repetir && tentativaRef.current
          ? tentativaRef.current
          : {
              chaveIdempotencia: crypto.randomUUID(),
              mensagem: validacao.data,
            };
      tentativaRef.current = tentativa;
      setProcessando(true);
      setErro(null);
      if (!repetir) {
        setMensagens((atuais) => [
          ...atuais,
          {
            autor: "cliente",
            conteudo: tentativa.mensagem,
            id: tentativa.chaveIdempotencia,
          },
        ]);
      }

      try {
        const resultado = await enviarMensagemChat({
          chaveIdempotencia: tentativa.chaveIdempotencia,
          conversaId: conversaAlvo,
          mensagem: tentativa.mensagem,
        });
        setConversaId(resultado.conversaId);
        window.sessionStorage.setItem(
          CHAVE_CONVERSA_ATENDIMENTO,
          resultado.conversaId,
        );
        setMensagens((atuais) =>
          atuais.some((item) => item.id === resultado.mensagem.id)
            ? atuais
            : [...atuais, resultado.mensagem],
        );
        setTransferencia(resultado.transferencia);
        setDigitada("");
        tentativaRef.current = null;
      } catch (falha) {
        if (
          falha instanceof ErroChatAtendimento &&
          falha.codigo === "CONVERSA_INDISPONIVEL"
        ) {
          setConversaId(undefined);
          window.sessionStorage.removeItem(CHAVE_CONVERSA_ATENDIMENTO);
        }
        setDigitada(tentativa.mensagem);
        setErro(
          falha instanceof ErroChatAtendimento
            ? falha.message
            : "Não foi possível concluir o atendimento. Tente novamente.",
        );
      } finally {
        setProcessando(false);
      }
    },
    [conversaId, processando],
  );

  useEffect(() => {
    if (inicioExecutadoRef.current) return;
    inicioExecutadoRef.current = true;
    const conversaSalva =
      window.sessionStorage.getItem(CHAVE_CONVERSA_ATENDIMENTO) ?? undefined;
    const handoff = consumirHandoffAtendimento();
    async function iniciar() {
      let conversaRecuperada = conversaSalva;
      if (conversaSalva) {
        try {
          const historico = await recuperarHistoricoChat(conversaSalva);
          setMensagens(historico.mensagens);
          setConversaId(historico.conversaId);
        } catch (falha) {
          if (
            falha instanceof ErroChatAtendimento &&
            falha.codigo === "CONVERSA_INDISPONIVEL"
          ) {
            conversaRecuperada = undefined;
            setConversaId(undefined);
            window.sessionStorage.removeItem(CHAVE_CONVERSA_ATENDIMENTO);
          } else {
            setErro("Não foi possível recuperar o histórico desta conversa.");
          }
        }
      }
      setConversaId(conversaRecuperada);
      setCarregando(false);
      if (handoff) await enviar(handoff.mensagem, false, conversaRecuperada);
    }
    void iniciar();
  }, [enviar]);

  useEffect(() => {
    fimConversaRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [mensagens, processando, erro]);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void enviar(digitada);
  }

  function aoPressionarTecla(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      void enviar(digitada);
    }
  }

  const entradaValida = mensagemAtendenteSchema.safeParse(digitada).success;

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
                Atendimento virtual da loja
              </p>
            </div>
          </div>

          <section
            aria-label="Conversa com o Atendente IA"
            aria-busy={processando}
            className="flex min-h-[55vh] flex-1 flex-col gap-4 py-6"
          >
            {carregando ? (
              <p className="text-muted-foreground text-sm" role="status">
                Preparando a conversa…
              </p>
            ) : null}
            {!carregando && mensagens.length === 0 ? (
              <div className="text-muted-foreground m-auto max-w-md text-center text-sm">
                Envie uma pergunta sobre produtos, preços, disponibilidade,
                entrega ou informações da loja.
              </div>
            ) : null}
            {mensagens.map((mensagem) => (
              <div
                key={mensagem.id}
                className={
                  mensagem.autor === "cliente"
                    ? "ml-auto flex max-w-[88%] items-end gap-2 sm:max-w-[75%]"
                    : "flex max-w-[88%] items-end gap-2 sm:max-w-[75%]"
                }
              >
                {mensagem.autor === "assistente_ia" ? (
                  <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Bot className="size-4" aria-hidden="true" />
                  </span>
                ) : null}
                <div
                  className={
                    mensagem.autor === "cliente"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap sm:text-base"
                      : "bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap sm:text-base"
                  }
                >
                  {mensagem.conteudo}
                </div>
                {mensagem.autor === "cliente" ? (
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            ))}
            {processando ? (
              <div
                className="text-muted-foreground flex items-center gap-2 text-sm"
                role="status"
                aria-live="polite"
              >
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                O Atendente IA está preparando a resposta…
              </div>
            ) : null}
            {transferencia ? (
              <CartaoTransferenciaWhatsapp
                explicacao={transferencia.explicacao}
                link={transferencia.link}
                resumo={transferencia.resumo}
                resumoParaPreparar={{
                  informacoesDeclaradas: mensagens
                    .filter((item) => item.autor === "cliente")
                    .slice(-1)
                    .map((item) => item.conteudo.slice(0, 300)),
                  interpretacaoNecessidade: (
                    mensagens.filter((item) => item.autor === "cliente").at(-1)
                      ?.conteudo ?? transferencia.explicacao
                  ).slice(0, 300),
                  necessidadePrincipal: (
                    mensagens.filter((item) => item.autor === "cliente").at(-1)
                      ?.conteudo ?? transferencia.explicacao
                  ).slice(0, 300),
                  pendenciaValidacaoHumana: transferencia.explicacao.slice(
                    0,
                    300,
                  ),
                  produtoRelacionado: null,
                }}
                status={transferencia.status}
                transferenciaId={transferencia.id}
              />
            ) : null}
            <div ref={fimConversaRef} />
          </section>

          <form
            className="bg-background sticky bottom-0 border-t py-4"
            onSubmit={aoEnviar}
          >
            <label htmlFor="mensagem-chat-atendimento" className="sr-only">
              Mensagem para o Atendente IA
            </label>
            <div className="relative">
              <Textarea
                id="mensagem-chat-atendimento"
                value={digitada}
                onChange={(evento) => {
                  setDigitada(evento.target.value);
                  if (erro) setErro(null);
                }}
                onKeyDown={aoPressionarTecla}
                disabled={processando}
                maxLength={LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO}
                placeholder="Digite sua mensagem…"
                rows={3}
                aria-invalid={Boolean(erro)}
                aria-describedby={erro ? "erro-chat-atendimento" : undefined}
                className="min-h-24 resize-none rounded-2xl pr-16 pb-10"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!entradaValida || processando}
                aria-label="Enviar mensagem"
                className="absolute right-3 bottom-3 rounded-full"
              >
                <ArrowUp aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-2 flex min-h-6 items-start justify-between gap-3 px-1">
              <div>
                {erro ? (
                  <p
                    id="erro-chat-atendimento"
                    className="text-destructive text-sm"
                    role="alert"
                  >
                    {erro}
                  </p>
                ) : null}
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">
                {digitada.length}/{LIMITE_CARACTERES_MENSAGEM_ATENDIMENTO}
              </span>
            </div>
            {erro && tentativaRef.current ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={processando}
                onClick={() =>
                  void enviar(tentativaRef.current?.mensagem ?? digitada, true)
                }
              >
                <RotateCcw aria-hidden="true" />
                Tentar novamente
              </Button>
            ) : null}
          </form>
        </div>
      </Container>
      <Footer />
    </div>
  );
}
