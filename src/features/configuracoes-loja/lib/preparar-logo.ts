import { type LocalLogoLoja,REGRAS_LOGOS_LOJA } from "../constants/logos";

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
      reject(new Error("Não foi possível ler a imagem selecionada."));
    };
    imagem.src = url;
  });
}

/** Reduz imagens grandes antes do upload sem recortar nem alterar a proporção. */
export async function prepararLogo(arquivo: File, local: LocalLogoLoja) {
  if (
    !(REGRAS_LOGOS_LOJA.formatos as readonly string[]).includes(arquivo.type)
  ) {
    throw new Error("Formatos aceitos: PNG, JPG e WEBP.");
  }
  if (arquivo.size > REGRAS_LOGOS_LOJA.tamanhoMaximoBytes) {
    throw new Error("A imagem deve ter no máximo 2MB.");
  }

  const imagem = await carregarImagem(arquivo);
  const regras = REGRAS_LOGOS_LOJA[local];
  const escala = Math.min(
    1,
    regras.larguraMaximaProcessamento / imagem.naturalWidth,
    regras.alturaMaximaProcessamento / imagem.naturalHeight,
  );
  const largura = Math.max(1, Math.round(imagem.naturalWidth * escala));
  const altura = Math.max(1, Math.round(imagem.naturalHeight * escala));

  if (escala === 1) return arquivo;

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível preparar a imagem.");
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(imagem, 0, 0, largura, altura);

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
  return new File([blob], `${arquivo.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
  });
}
