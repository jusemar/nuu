"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { REGRAS_IMAGEM_BANNER_HOME } from "../../constants/banners-home";
import { prepararImagemBannerHome } from "../../lib/imagem-banner-home";
import type {
  MetadataImagemBannerHome,
  PosicaoBannerHome,
} from "../../types/banners-home.types";

type UploadImagemBannerHomeProps = {
  posicao: PosicaoBannerHome;
  imagemUrl: string;
  imagemAlt: string;
  metadataImagem: MetadataImagemBannerHome | null;
  onImagemChange: (dados: {
    imagemUrl: string;
    imagemAlt: string;
    metadataImagem: MetadataImagemBannerHome | null;
  }) => void;
};

function formatarBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

async function enviarImagemBannerHome(arquivo: File) {
  const formData = new FormData();
  formData.append("file", arquivo);
  formData.append("destino", "banners-home");

  const resposta = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.error ?? "Não foi possível enviar a imagem.");
  }

  if (!dados.url) {
    throw new Error("Upload concluído sem URL da imagem.");
  }

  return dados.url as string;
}

export function UploadImagemBannerHome({
  posicao,
  imagemUrl,
  imagemAlt,
  metadataImagem,
  onImagemChange,
}: UploadImagemBannerHomeProps) {
  const [previewUrl, setPreviewUrl] = useState(imagemUrl);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const regras = REGRAS_IMAGEM_BANNER_HOME.posicoes[posicao];

  useEffect(() => {
    setPreviewUrl(imagemUrl);
  }, [imagemUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const textoMetadata = useMemo(() => {
    if (!metadataImagem) return null;
    return `${metadataImagem.largura}x${metadataImagem.altura} • ${formatarBytes(
      metadataImagem.tamanhoBytes,
    )}`;
  }, [metadataImagem]);

  const onDrop = useCallback(
    async (arquivos: File[]) => {
      const arquivo = arquivos[0];
      if (!arquivo) return;

      setErro(null);
      setAvisos([]);
      setEnviando(true);

      try {
        const imagemPreparada = await prepararImagemBannerHome(
          arquivo,
          posicao,
        );
        const url = await enviarImagemBannerHome(imagemPreparada.arquivo);

        setPreviewUrl((previewAtual) => {
          if (previewAtual.startsWith("blob:"))
            URL.revokeObjectURL(previewAtual);
          return imagemPreparada.previewUrl;
        });
        setAvisos(imagemPreparada.avisos);
        onImagemChange({
          imagemUrl: url,
          imagemAlt: imagemAlt || arquivo.name.replace(/\.[^.]+$/, ""),
          metadataImagem: imagemPreparada.metadata,
        });
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao enviar imagem.",
        );
      } finally {
        setEnviando(false);
      }
    },
    [imagemAlt, onImagemChange, posicao],
  );

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: false,
    disabled: enviando,
  });

  function removerImagem() {
    setPreviewUrl((previewAtual) => {
      if (previewAtual.startsWith("blob:")) URL.revokeObjectURL(previewAtual);
      return "";
    });
    setAvisos([]);
    setErro(null);
    onImagemChange({
      imagemUrl: "",
      imagemAlt: "",
      metadataImagem: null,
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-950">Imagem do banner</p>
        <p className="text-xs leading-5 text-slate-500">{regras.texto}</p>
        <p className="text-xs leading-5 text-slate-500">
          Formatos aceitos: PNG, JPG, WEBP. Máximo de 5MB. Não há altura fixa
          obrigatória.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400",
          enviando && "cursor-not-allowed opacity-70",
        )}
      >
        <input {...getInputProps()} />
        {enviando ? (
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-600" />
        ) : (
          <Upload className="mb-2 h-8 w-8 text-slate-400" />
        )}
        <p className="text-sm font-medium text-slate-900">
          {enviando
            ? "Otimizando e enviando imagem..."
            : isDragActive
              ? "Solte a imagem aqui"
              : "Arraste a imagem ou clique para upload"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          A imagem será redimensionada automaticamente quando necessário.
        </p>
      </div>

      {erro && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {erro}
        </p>
      )}

      {avisos.map((aviso) => (
        <p
          key={aviso}
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          {aviso}
        </p>
      ))}

      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border bg-slate-100">
          <div
            className={cn(
              "relative bg-slate-200",
              posicao === "principal_esquerdo"
                ? "aspect-[16/6]"
                : "aspect-[16/8]",
            )}
            style={
              metadataImagem
                ? {
                    aspectRatio: `${metadataImagem.largura} / ${metadataImagem.altura}`,
                  }
                : undefined
            }
          >
            <img
              src={previewUrl}
              alt={imagemAlt || "Preview do banner"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              <span>{textoMetadata ?? "Imagem pronta para salvar."}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removerImagem}
            >
              <X className="h-4 w-4" />
              Remover imagem
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
