import React, { type CSSProperties } from "react";

import type { ConfiguracaoBarraAvisos } from "../../types/barra-avisos.types";

type Props = { configuracao: ConfiguracaoBarraAvisos; previa?: boolean };

export function BarraAvisos({ configuracao, previa = false }: Props) {
  const mensagens = configuracao.mensagens.filter((mensagem) => mensagem.ativo);
  if (!configuracao.ativo || mensagens.length === 0) return null;

  const estilo = {
    backgroundColor: configuracao.corFundo,
    color: configuracao.corTexto,
    "--duracao-barra": `${configuracao.velocidadeSegundos}s`,
  } as CSSProperties;

  return (
    <div
      className="barra-avisos w-full overflow-hidden py-2 select-none"
      style={estilo}
      data-pausar-hover={configuracao.pausarHover}
      aria-label={previa ? "Prévia da barra de avisos" : "Avisos da loja"}
    >
      <div className="trilho-barra-avisos flex w-max whitespace-nowrap">
        {[0, 1].map((repeticao) => (
          <div
            key={repeticao}
            className="flex shrink-0 items-center"
            aria-hidden={repeticao === 1}
          >
            {mensagens.map((mensagem) => (
              <span
                key={`${repeticao}-${mensagem.id}`}
                className="mx-8 inline-flex items-center gap-2 text-xs font-medium tracking-wide sm:text-sm"
              >
                {mensagem.icone && (
                  <span aria-hidden="true">{mensagem.icone}</span>
                )}
                <span>{mensagem.texto}</span>
                <span className="ml-6 opacity-70" aria-hidden="true">
                  •
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes rolar-barra-avisos { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .trilho-barra-avisos { animation: rolar-barra-avisos var(--duracao-barra) linear infinite; }
        .barra-avisos[data-pausar-hover="true"]:hover .trilho-barra-avisos { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .trilho-barra-avisos { animation-play-state: paused; } }
      `}</style>
    </div>
  );
}
