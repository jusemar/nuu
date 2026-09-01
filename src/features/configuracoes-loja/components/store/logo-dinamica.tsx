"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DADOS_EMPRESA } from "../../constants/dados-empresa";

/** Local em que a logo é exibida. Cada local só muda medidas e alinhamento. */
type LocalExibicaoLogo = "cabecalho" | "rodape" | "autenticacao";

/**
 * Cada variante concentra apenas as diferenças visuais do local.
 * A imagem exibida continua sendo a mesma configurada pela loja, o que evita
 * duplicar asset, tratamento de erro e acessibilidade em cada tela.
 */
const VARIANTES_LOGO: Record<
  LocalExibicaoLogo,
  {
    caixa: string;
    conteudo: string;
    alinhamentoImagem: string;
    tamanhosImagem: string;
    prioridade: boolean;
    emblema: string;
    texto: string;
  }
> = {
  cabecalho: {
    caixa: "h-10 w-28 sm:w-36",
    conteudo: "",
    alinhamentoImagem: "object-left",
    tamanhosImagem: "(max-width: 640px) 112px, 144px",
    prioridade: true,
    emblema: "bg-[#0C447C] text-white",
    texto: "text-slate-800",
  },
  rodape: {
    caixa: "h-14 w-44",
    conteudo: "",
    alinhamentoImagem: "object-left",
    tamanhosImagem: "176px",
    prioridade: false,
    emblema: "bg-white/15 text-white",
    texto: "text-white",
  },
  // Telas de login/cadastro: bloco centralizado e um pouco maior, porque a
  // logo é o único elemento de identidade visível nessas páginas.
  autenticacao: {
    caixa: "mx-auto h-12 w-40 sm:h-14 sm:w-48",
    conteudo: "justify-center",
    alinhamentoImagem: "object-center",
    tamanhosImagem: "(max-width: 640px) 160px, 192px",
    prioridade: true,
    emblema: "bg-[#0C447C] text-white",
    texto: "text-slate-800",
  },
};

type LogoDinamicaProps = {
  url: string | null;
  local: LocalExibicaoLogo;
  className?: string;
};

export function LogoDinamica({
  url,
  local,
  className = "",
}: LogoDinamicaProps) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  useEffect(() => setImagemFalhou(false), [url]);
  const variante = VARIANTES_LOGO[local];

  return (
    <Link
      href="/"
      aria-label={`${DADOS_EMPRESA.marca} — página inicial`}
      className={`flex shrink-0 items-center overflow-hidden transition-opacity hover:opacity-85 ${variante.conteudo} ${variante.caixa} ${className}`}
    >
      {url && !imagemFalhou ? (
        <span className="relative block h-full w-full overflow-hidden">
          <Image
            src={url}
            alt={`Logo ${DADOS_EMPRESA.marca}`}
            fill
            sizes={variante.tamanhosImagem}
            // `object-contain` preserva a proporção original da imagem.
            className={`object-contain ${variante.alinhamentoImagem}`}
            priority={variante.prioridade}
            onError={() => setImagemFalhou(true)}
          />
        </span>
      ) : (
        // Reserva textual usada apenas quando não há logo salva ou o
        // carregamento da imagem falha.
        <span className="flex items-center gap-2.5">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg font-bold ${variante.emblema}`}
          >
            {DADOS_EMPRESA.iniciaisMarca}
          </span>
          <span className={`text-xl font-bold ${variante.texto}`}>
            {DADOS_EMPRESA.marca}
          </span>
        </span>
      )}
    </Link>
  );
}
