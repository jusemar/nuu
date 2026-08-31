"use client";

import { ImageIcon, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { type LocalLogoLoja,REGRAS_LOGOS_LOJA } from "../../constants/logos";
import { prepararLogo } from "../../lib/preparar-logo";

type CampoUploadLogoProps = {
  local: LocalLogoLoja;
  titulo: string;
  url: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function CampoUploadLogo({
  local,
  titulo,
  url,
  onChange,
  disabled,
}: CampoUploadLogoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(url);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => setPreview(url), [url]);

  async function selecionar(arquivo?: File) {
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    const previewLocal = URL.createObjectURL(arquivo);
    setPreview(previewLocal);
    try {
      const arquivoPreparado = await prepararLogo(arquivo, local);
      const dados = new FormData();
      dados.append("file", arquivoPreparado);
      const resposta = await fetch("/api/upload?contexto=logo", {
        method: "POST",
        body: dados,
      });
      const resultado = (await resposta.json()) as {
        url?: string;
        error?: string;
      };
      if (!resposta.ok || !resultado.url) {
        throw new Error(resultado.error ?? "Não foi possível enviar a imagem.");
      }
      onChange(resultado.url);
    } catch (error) {
      setPreview(url);
      setErro(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      URL.revokeObjectURL(previewLocal);
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">{titulo}</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {REGRAS_LOGOS_LOJA[local].recomendacao} PNG, JPG ou WEBP; máximo de
          2MB.
        </p>
      </div>

      <div className="bg-muted relative flex h-32 w-full items-center justify-center overflow-hidden rounded-md border sm:h-36">
        {preview ? (
          <Image
            src={preview}
            alt={`Pré-visualização da ${titulo.toLowerCase()}`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-contain p-4"
            unoptimized={preview.startsWith("blob:")}
          />
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
            <ImageIcon className="size-7" aria-hidden="true" />
            Identidade textual atual
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={`logo-${local}`} className="sr-only">
          Selecionar {titulo.toLowerCase()}
        </Label>
        <input
          ref={inputRef}
          id={`logo-${local}`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={disabled || enviando}
          onChange={(evento) => void selecionar(evento.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || enviando}
        >
          {enviando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {enviando ? "Enviando..." : url ? "Trocar imagem" : "Enviar imagem"}
        </Button>
        {url ? (
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || enviando}
            onClick={() => {
              setPreview("");
              onChange("");
            }}
          >
            Usar identidade textual
          </Button>
        ) : null}
      </div>
      {erro ? <p className="text-destructive text-sm">{erro}</p> : null}
    </section>
  );
}
