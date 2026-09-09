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
      className="bg-popover text-popover-foreground shadow-elevation-3 border-border relative animate-[assistente-flutuar_5s_ease-in-out_infinite] rounded-3xl rounded-bl-md border px-3 py-2.5"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <span
        aria-hidden="true"
        className="bg-border absolute bottom-4 -left-6 h-6 w-7 [clip-path:polygon(100%_0,100%_100%,0_85%)]"
      />
      <span
        aria-hidden="true"
        className="bg-popover absolute bottom-[17px] -left-[22px] h-[22px] w-[26px] [clip-path:polygon(100%_0,100%_100%,0_85%)]"
      />
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {frase}
      </span>
      <p
        aria-hidden="true"
        className="text-foreground min-h-10 text-xs leading-relaxed font-normal"
      >
        {frase.slice(0, quantidadeCaracteres)}
        <span
          aria-hidden="true"
          className="bg-primary/65 ml-0.5 inline-block h-3.5 w-px align-middle motion-safe:animate-pulse"
        />
      </p>
    </div>
  );
}
