"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductGalleryProps {
  imagens: string[];
  nomeProduto?: string;
  isLancamento?: boolean;
  tipoBadge?: "relampago" | "promocao" | null;
  dataFimRelampago?: Date | null;
}

export function ProductGallery({
  imagens,
  nomeProduto = "Produto",
  isLancamento = true,
  tipoBadge = null,
  dataFimRelampago = null,
}: ProductGalleryProps) {
  const [imgAtiva, setImgAtiva] = useState(0);
  const [ampliacaoAberta, setAmpliacaoAberta] = useState(false);
  const [proporcaoImagem, setProporcaoImagem] = useState(1);
  const [rolagemMiniaturas, setRolagemMiniaturas] = useState({
    temOverflow: false,
    noInicio: true,
    noFim: true,
  });
  const imagemPrincipalRef = useRef<HTMLButtonElement | null>(null);
  const rolagemMiniaturasRef = useRef<HTMLDivElement | null>(null);
  const miniaturasRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setImgAtiva(0);
  }, [imagens[0]]);

  useEffect(() => {
    miniaturasRef.current[imgAtiva]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [imgAtiva]);

  useEffect(() => {
    const elemento = rolagemMiniaturasRef.current;
    if (!elemento) return;
    const alvoRolagem = elemento;

    function atualizarEstadoRolagem() {
      const limite = alvoRolagem.scrollHeight - alvoRolagem.clientHeight;
      const temOverflow = limite > 1;

      setRolagemMiniaturas({
        temOverflow,
        noInicio: alvoRolagem.scrollTop <= 1,
        noFim: !temOverflow || alvoRolagem.scrollTop >= limite - 1,
      });
    }

    const observador = new ResizeObserver(atualizarEstadoRolagem);
    observador.observe(elemento);
    elemento.addEventListener("scroll", atualizarEstadoRolagem, {
      passive: true,
    });
    const quadro = requestAnimationFrame(atualizarEstadoRolagem);

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      elemento.removeEventListener("scroll", atualizarEstadoRolagem);
    };
  }, [imagens.length]);

  function rolarMiniaturas(direcao: "cima" | "baixo") {
    const elemento = rolagemMiniaturasRef.current;
    if (!elemento) return;

    elemento.scrollBy({
      top:
        (direcao === "cima" ? -1 : 1) *
        Math.max(elemento.clientHeight * 0.7, 64),
      behavior: "smooth",
    });
  }

  const proximaImagem = () => {
    setImgAtiva((atual) => (atual + 1) % imagens.length);
  };

  const imagemAnterior = () => {
    setImgAtiva((atual) => (atual - 1 + imagens.length) % imagens.length);
  };

  const relampagoAtivo = Boolean(
    tipoBadge === "relampago" &&
      dataFimRelampago &&
      dataFimRelampago.getTime() > Date.now(),
  );
  const mostrarBadgePromocao = tipoBadge === "promocao";
  const mostrarBadgeLancamento =
    isLancamento && !relampagoAtivo && !mostrarBadgePromocao;

  const textoAlternativo = `${nomeProduto} - imagem ${imgAtiva + 1}`;

  return (
    <div className="sticky top-[70px] grid grid-cols-1 gap-3 md:grid-cols-[4rem_minmax(0,1fr)] md:grid-rows-[auto_auto]">
      {/* Miniaturas */}
      <div className="order-3 min-w-0 md:relative md:order-none md:col-start-1 md:row-start-1 md:min-h-0">
        {rolagemMiniaturas.temOverflow && !rolagemMiniaturas.noInicio && (
          <button
            type="button"
            onClick={() => rolarMiniaturas("cima")}
            aria-label="Rolar miniaturas para cima"
            className="bg-background/95 text-foreground border-border focus-visible:ring-primary absolute top-1 left-1/2 z-20 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur-sm hover:bg-white focus-visible:ring-2 focus-visible:outline-none md:flex"
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <div
          ref={rolagemMiniaturasRef}
          className="flex max-w-full flex-row gap-2 overflow-x-auto overscroll-contain [scrollbar-width:none] md:absolute md:inset-0 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:py-9 [&::-webkit-scrollbar]:hidden"
        >
          {imagens.map((img, index) => (
            <button
              key={index}
              ref={(elemento) => {
                miniaturasRef.current[index] = elemento;
              }}
              type="button"
              onClick={() => setImgAtiva(index)}
              aria-label={`Selecionar imagem ${index + 1} de ${imagens.length}`}
              aria-current={index === imgAtiva ? "true" : undefined}
              className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all md:h-16 md:w-16 ${
                index === imgAtiva
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              } `}
            >
              <Image
                src={img}
                alt={`${nomeProduto} - miniatura ${index + 1}`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {rolagemMiniaturas.temOverflow && !rolagemMiniaturas.noFim && (
          <button
            type="button"
            onClick={() => rolarMiniaturas("baixo")}
            aria-label="Rolar miniaturas para baixo"
            className="bg-background/95 text-foreground border-border focus-visible:ring-primary absolute bottom-1 left-1/2 z-20 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur-sm hover:bg-white focus-visible:ring-2 focus-visible:outline-none md:flex"
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Imagem Principal */}
      <div className="group relative order-1 aspect-square overflow-hidden rounded-2xl bg-gray-100 md:col-start-2 md:row-start-1">
        <button
          ref={imagemPrincipalRef}
          type="button"
          className="focus-visible:ring-primary absolute inset-0 cursor-zoom-in focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
          onClick={() => setAmpliacaoAberta(true)}
          aria-label={`Ampliar ${textoAlternativo}`}
        >
          <Image
            src={imagens[imgAtiva]}
            alt={textoAlternativo}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority
          />
        </button>

        {/* Badge RELAMPAGO */}
        {relampagoAtivo && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-3 py-1 text-[10px] font-extrabold tracking-wider text-white shadow-md">
            RELÂMPAGO
          </span>
        )}

        {/* Badge PROMOCAO */}
        {mostrarBadgePromocao && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold tracking-wider text-white shadow-md">
            PROMOÇÃO
          </span>
        )}

        {/* Badge LANCAMENTO */}
        {mostrarBadgeLancamento && (
          <span
            className="absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider text-white shadow-md"
            style={{ backgroundColor: "#EF9F27" }}
          >
            LANÇAMENTO
          </span>
        )}

        {/* Navegação */}
        <button
          type="button"
          onClick={imagemAnterior}
          aria-label="Imagem anterior"
          className="absolute top-1/2 left-2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white focus:opacity-100"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={proximaImagem}
          aria-label="Próxima imagem"
          className="absolute top-1/2 right-2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white focus:opacity-100"
        >
          ›
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {imagens.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setImgAtiva(index)}
              aria-label={`Selecionar imagem ${index + 1}`}
              aria-current={index === imgAtiva ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all ${
                index === imgAtiva ? "bg-primary w-4" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Banner Frete Grátis - ESTILO LIMPO SEM GRADIENTE */}
      <div className="bg-primary relative order-2 flex min-h-[80px] items-center gap-3 rounded-xl p-6 pr-4 text-white md:col-start-2 md:row-start-2">
        <div className="relative z-10 flex-shrink-0 text-2xl">🏃</div>
        <div className="relative z-10 flex-1">
          <div className="mb-0.5 text-[11px] font-extrabold tracking-wider">
            FRETE GRÁTIS
          </div>
          <div className="text-[11px] leading-relaxed text-white/75">
            Compras acima de R$ 299,00.
          </div>
        </div>
        <button className="relative z-10 !mr-4 rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-colors hover:bg-white/30">
          Ver condições
        </button>

        <div className="pointer-events-none absolute -top-5 -right-5 h-24 w-24 rounded-full bg-white/5" />
      </div>

      <Dialog open={ampliacaoAberta} onOpenChange={setAmpliacaoAberta}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[94vh] w-[98vw] max-w-none items-center justify-center border-0 bg-transparent p-0 shadow-none sm:max-w-none"
          onCloseAutoFocus={(evento) => {
            evento.preventDefault();
            imagemPrincipalRef.current?.focus();
          }}
        >
          <DialogTitle className="sr-only">
            Imagem ampliada de {nomeProduto}
          </DialogTitle>
          <div
            className="relative overflow-hidden rounded-lg"
            style={{
              width: `min(94vw, calc(90vh * ${proporcaoImagem}))`,
              height: `min(90vh, calc(94vw / ${proporcaoImagem}))`,
            }}
          >
            <Image
              src={imagens[imgAtiva]}
              alt={textoAlternativo}
              fill
              sizes="94vw"
              className="object-contain"
              priority
              onLoad={(evento) => {
                const { naturalWidth, naturalHeight } = evento.currentTarget;
                if (naturalWidth > 0 && naturalHeight > 0) {
                  setProporcaoImagem(naturalWidth / naturalHeight);
                }
              }}
            />
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Fechar imagem ampliada"
                className="focus-visible:ring-primary absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
