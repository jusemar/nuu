"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DADOS_EMPRESA } from "../../constants/dados-empresa";

type LogoDinamicaProps = {
  url: string | null;
  local: "cabecalho" | "rodape";
  className?: string;
};

export function LogoDinamica({
  url,
  local,
  className = "",
}: LogoDinamicaProps) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  useEffect(() => setImagemFalhou(false), [url]);
  const rodape = local === "rodape";

  return (
    <Link
      href="/"
      aria-label={`${DADOS_EMPRESA.marca} — página inicial`}
      className={`flex shrink-0 items-center overflow-hidden transition-opacity hover:opacity-85 ${
        rodape ? "h-14 w-44" : "h-10 w-28 sm:w-36"
      } ${className}`}
    >
      {url && !imagemFalhou ? (
        <span className="relative block h-full w-full overflow-hidden">
          <Image
            src={url}
            alt={`Logo ${DADOS_EMPRESA.marca}`}
            fill
            sizes={rodape ? "176px" : "(max-width: 640px) 112px, 144px"}
            className="object-contain object-left"
            priority={!rodape}
            onError={() => setImagemFalhou(true)}
          />
        </span>
      ) : (
        <span className="flex items-center gap-2.5">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg font-bold ${
              rodape ? "bg-white/15 text-white" : "bg-[#0C447C] text-white"
            }`}
          >
            {DADOS_EMPRESA.iniciaisMarca}
          </span>
          <span
            className={`text-xl font-bold ${rodape ? "text-white" : "text-slate-800"}`}
          >
            {DADOS_EMPRESA.marca}
          </span>
        </span>
      )}
    </Link>
  );
}
