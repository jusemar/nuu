"use client";

import { useEffect, useState } from "react";

const FRASES_ASSISTENTE = [
  "Oi! Que bom ter você por aqui.",
  "Já ajudei muita gente a encontrar o que precisava.",
  "Posso explicar tudo com calma, sem pressão.",
  "Se preferir falar com uma pessoa, é só me dizer. Estou à sua disposição!",
] as const;

const INTERVALO_DIGITACAO_MS = 34;
const TEMPO_LEITURA_MS = 3_400;
const TEMPO_LEITURA_ULTIMA_FRASE_MS = 4_800;

/**
 * Balão exclusivamente visual. A pausa no hover não interfere no formulário
 * nem no fluxo real de atendimento.
 */
export function BalaoFrasesAssistente() {
  const [indice, setIndice] = useState(0);
  const [quantidadeCaracteres, setQuantidadeCaracteres] = useState(0);
  const [pausado, setPausado] = useState(false);
  const frase = FRASES_ASSISTENTE[indice];

  useEffect(() => {
    if (pausado) return;

    if (quantidadeCaracteres < frase.length) {
      const temporizador = window.setTimeout(
        () => setQuantidadeCaracteres((valor) => valor + 1),
        INTERVALO_DIGITACAO_MS,
      );
      return () => window.clearTimeout(temporizador);
    }

    const temporizador = window.setTimeout(
      () => {
        setIndice((valor) => (valor + 1) % FRASES_ASSISTENTE.length);
        setQuantidadeCaracteres(0);
      },
      indice === FRASES_ASSISTENTE.length - 1
        ? TEMPO_LEITURA_ULTIMA_FRASE_MS
        : TEMPO_LEITURA_MS,
    );

    return () => window.clearTimeout(temporizador);
  }, [frase, indice, pausado, quantidadeCaracteres]);

  return (
    <div
      className="relative animate-[assistente-flutuar_5s_ease-in-out_infinite] rounded-2xl border border-sky-100 bg-white/95 px-3.5 py-2.5 shadow-[0_12px_35px_-18px_rgba(12,68,124,0.45)] sm:px-4"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-2 -left-2 size-4 rotate-45 border-b border-l border-sky-100 bg-white"
      />
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {frase}
      </span>
      <p
        aria-hidden="true"
        className="min-h-10 text-xs leading-relaxed font-normal text-slate-700 sm:text-sm"
      >
        {frase.slice(0, quantidadeCaracteres)}
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-3.5 w-px bg-sky-500/70 align-middle motion-safe:animate-pulse"
        />
      </p>
    </div>
  );
}
