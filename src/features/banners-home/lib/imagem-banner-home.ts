import { REGRAS_IMAGEM_BANNER_HOME } from "../constants/banners-home";
import type {
  MetadataImagemBannerHome,
  PosicaoBannerHome,
} from "../types/banners-home.types";

type ResultadoImagemBannerHome = {
  arquivo: File;
  previewUrl: string;
  metadata: MetadataImagemBannerHome;
  avisos: string[];
};

function carregarImagem(arquivo: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem enviada."));
    };

    imagem.src = url;
  });
}

function criarArquivoWebp(blob: Blob, nomeOriginal: string) {
  const nomeBase = nomeOriginal.replace(/\.[^.]+$/, "");
  return new File([blob], `${nomeBase}.webp`, { type: "image/webp" });
}

export async function prepararImagemBannerHome(
  arquivo: File,
  posicao: PosicaoBannerHome,
): Promise<ResultadoImagemBannerHome> {
  const regras = REGRAS_IMAGEM_BANNER_HOME.posicoes[posicao];

  if (
    !(REGRAS_IMAGEM_BANNER_HOME.formatos as readonly string[]).includes(
      arquivo.type,
    )
  ) {
    throw new Error("Formatos aceitos: PNG, JPG e WEBP.");
  }

  if (arquivo.size > REGRAS_IMAGEM_BANNER_HOME.tamanhoMaximoBytes) {
    throw new Error("A imagem deve ter no máximo 5MB.");
  }

  const imagem = await carregarImagem(arquivo);
  const proporcao = imagem.naturalWidth / imagem.naturalHeight;

  if (
    imagem.naturalWidth < regras.larguraMinima ||
    imagem.naturalHeight < regras.alturaMinima
  ) {
    if (imagem.naturalWidth < regras.larguraMinima) {
      throw new Error(
        `Use uma imagem horizontal com pelo menos ${regras.larguraMinima}px de largura.`,
      );
    }

    throw new Error(
      `Use uma imagem com pelo menos ${regras.alturaMinima}px de altura para manter boa leitura no banner.`,
    );
  }

  const escala = Math.min(
    1,
    regras.larguraRecomendada / imagem.naturalWidth,
    regras.alturaRecomendada / imagem.naturalHeight,
  );

  const larguraFinal = Math.round(imagem.naturalWidth * escala);
  const alturaFinal = Math.round(imagem.naturalHeight * escala);
  const canvas = document.createElement("canvas");
  canvas.width = larguraFinal;
  canvas.height = alturaFinal;

  const contexto = canvas.getContext("2d");
  if (!contexto) {
    throw new Error("Não foi possível preparar a imagem para upload.");
  }

  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(imagem, 0, 0, larguraFinal, alturaFinal);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultado) =>
        resultado
          ? resolve(resultado)
          : reject(new Error("Não foi possível otimizar a imagem.")),
      "image/webp",
      0.9,
    );
  });

  const arquivoFinal = criarArquivoWebp(blob, arquivo.name);
  const avisos: string[] = [];

  if (
    imagem.naturalWidth < regras.larguraRecomendada ||
    imagem.naturalHeight < regras.alturaRecomendada
  ) {
    avisos.push("Imagens muito pequenas podem perder qualidade.");
  }

  if (
    proporcao < regras.proporcaoRecomendadaMinima ||
    proporcao > regras.proporcaoRecomendadaMaxima
  ) {
    avisos.push("Banners horizontais widescreen funcionam melhor.");
  }

  return {
    arquivo: arquivoFinal,
    previewUrl: URL.createObjectURL(arquivoFinal),
    metadata: {
      largura: larguraFinal,
      altura: alturaFinal,
      proporcao: Number((larguraFinal / alturaFinal).toFixed(3)),
      tamanhoBytes: arquivoFinal.size,
      tipoArquivo: arquivoFinal.type,
      nomeArquivo: arquivoFinal.name,
    },
    avisos,
  };
}
