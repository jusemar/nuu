// src/app/admin/products/new/components/image-upload/ProductImageGallery.tsx
"use client";

// useEffect adicionado para carregar imagens iniciais na edição
import { Image as ImageIcon, Loader2,Star, Upload, X } from "lucide-react";
import { useCallback, useEffect,useState } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Interface que define a estrutura de uma imagem no componente.
// Usada tanto para imagens novas (upload) quanto para imagens existentes (edição).
export interface UploadedImage {
  id: string;
  file?: File; // Arquivo local (só existe em imagens novas, não nas do banco)
  url?: string; // URL da imagem no Vercel Blob (preenchida após upload ou vinda do banco)
  preview: string; // URL para exibição (pode ser URL local temporária ou URL do Vercel Blob)
  isPrimary: boolean; // Se é a imagem principal do produto
  uploadProgress?: number;
  altText?: string;
}

interface ProductImageGalleryProps {
  onImagesChange?: (images: UploadedImage[]) => void;
  maxFiles?: number;
  // -------------------------------------------------------------------
  // NOVO: Prop opcional para receber imagens já existentes no banco.
  // Usada na página de EDIÇÃO para exibir as imagens que já foram salvas.
  // Na página de CADASTRO NOVO, essa prop não é passada (fica undefined).
  // -------------------------------------------------------------------
  initialImages?: UploadedImage[];
}

export function ProductImageGallery({
  onImagesChange,
  maxFiles = 10,
  initialImages, // Recebe imagens existentes (apenas na edição)
}: ProductImageGalleryProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // -------------------------------------------------------------------
  // NOVO: useEffect para carregar imagens iniciais quando o componente
  // é usado na página de edição. Só executa quando initialImages muda
  // e só se houver imagens para carregar E o estado ainda estiver vazio
  // (para não sobrescrever imagens que o usuário já adicionou).
  // -------------------------------------------------------------------
  useEffect(() => {
    if (
      initialImages &&
      initialImages.length > 0 &&
      uploadedImages.length === 0
    ) {
      setUploadedImages(initialImages);
    }
  }, [initialImages]);

  // Função que faz upload de um arquivo para o Vercel Blob via API /api/upload
  const uploadToBlob = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload?contexto=produto", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.statusText}`);
      }

      const blobData = await response.json();

      // Tenta encontrar a URL na resposta (diferentes formatos possíveis)
      if (blobData.url) {
        return blobData.url;
      } else if (blobData.imageUrl) {
        return blobData.imageUrl;
      } else if (blobData.data?.url) {
        return blobData.data.url;
      } else {
        return Object.values(blobData)[0] as string;
      }
    } catch (error) {
      console.error("Erro no upload para Vercel Blob:", error);
      throw error;
    }
  };

  // Função chamada quando o usuário arrasta ou seleciona arquivos
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Verifica se não ultrapassou o limite de imagens
      if (uploadedImages.length + acceptedFiles.length > maxFiles) {
        alert(`Máximo de ${maxFiles} imagens permitido`);
        return;
      }

      setIsUploading(true);

      // Cria objetos temporários para cada arquivo selecionado
      const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file), // Cria URL temporária local para preview
        isPrimary: uploadedImages.length === 0 && acceptedFiles[0] === file, // Primeira imagem é principal
        uploadProgress: 0,
      }));

      // Adiciona as novas imagens ao estado
      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      onImagesChange?.(updatedImages);

      try {
        const uploadResults: { id: string; url: string }[] = [];

        // Faz upload de cada imagem para o Vercel Blob
        for (const image of newImages) {
          if (image.file) {
            const blobUrl = await uploadToBlob(image.file);
            uploadResults.push({ id: image.id, url: blobUrl });

            // Atualiza o progresso individual de cada imagem
            setUploadedImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? { ...img, url: blobUrl, uploadProgress: 100 }
                  : img,
              ),
            );
          }
        }

        // Atualiza todas as imagens com suas URLs finais do Vercel Blob
        const finalImages = updatedImages.map((img) => {
          const res = uploadResults.find((r) => r.id === img.id);
          if (res) {
            return { ...img, url: res.url, uploadProgress: 100 };
          }
          return img;
        });

        setUploadedImages(finalImages);
        onImagesChange?.(finalImages);
      } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro ao fazer upload das imagens");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadedImages, maxFiles, onImagesChange],
  );

  // Configuração do react-dropzone (área de arrastar e soltar)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    multiple: true,
    maxFiles: maxFiles - uploadedImages.length,
    disabled: isUploading,
  });

  // Remove uma imagem da lista
  const removeImage = (id: string) => {
    const imageToRemove = uploadedImages.find((img) => img.id === id);
    // Libera a URL temporária local da memória (se existir)
    if (imageToRemove?.preview && imageToRemove?.file) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = uploadedImages.filter((img) => img.id !== id);

    // Se removeu a imagem principal, define a próxima como principal
    if (imageToRemove?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    setUploadedImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  // Define uma imagem como a principal do produto
  const setPrimaryImage = (id: string) => {
    const updatedImages = uploadedImages.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    setUploadedImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4" />
          Galeria de Imagens
        </CardTitle>
        <CardDescription className="text-xs">
          {uploadedImages.length > 0
            ? `${uploadedImages.length}/${maxFiles} imagens - Arraste para reordenar`
            : `Adicione imagens do produto (máx. ${maxFiles})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload - só exibe se ainda tem espaço para mais imagens */}
        {uploadedImages.length < maxFiles && (
          <div
            {...getRootProps()}
            className={cn(
              "cursor-pointer rounded-md border-2 border-dashed p-4 text-center transition-colors",
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-300 bg-gray-50/50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900/50 dark:hover:border-gray-500",
              isUploading && "cursor-not-allowed opacity-50",
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-500" />
            ) : (
              <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {isUploading
                  ? "Fazendo upload..."
                  : isDragActive
                    ? "Solte as imagens aqui..."
                    : "Arraste imagens ou clique para selecionar"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, WEBP, GIF até 10MB cada
              </p>
              {!isUploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 h-7 text-xs"
                >
                  Selecionar Arquivos
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Preview das Imagens - exibe as imagens carregadas (novas ou do banco) */}
        {uploadedImages.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                Imagens ({uploadedImages.length}/{maxFiles})
              </h4>
              {uploadedImages.some(
                (img) => img.uploadProgress && img.uploadProgress < 100,
              ) && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processando...
                </div>
              )}
            </div>

            {/* Grid de imagens */}
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {uploadedImages.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "group relative overflow-hidden rounded-md border bg-gray-100 transition-all dark:bg-gray-800",
                    image.isPrimary
                      ? "border-blue-500 ring-1 ring-blue-200 dark:ring-blue-800"
                      : "border-gray-200 dark:border-gray-700",
                  )}
                >
                  {/* Container da imagem */}
                  <div className="aspect-square h-20">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {/* Overlay de Progresso (só aparece durante upload) */}
                    {image.uploadProgress !== undefined &&
                      image.uploadProgress < 100 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-center text-white">
                            <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                            <div className="text-xs">
                              {image.uploadProgress}%
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Overlay com botões de ação (aparece ao passar o mouse) */}
                  <div className="bg-opacity-0 group-hover:bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all group-hover:opacity-100">
                    <div className="flex gap-1">
                      {/* Botão para definir como imagem principal */}
                      <Button
                        size="sm"
                        variant={image.isPrimary ? "default" : "secondary"}
                        className={cn(
                          "h-6 min-w-6 px-1",
                          image.isPrimary
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800",
                        )}
                        onClick={() => setPrimaryImage(image.id)}
                        disabled={image.isPrimary}
                      >
                        <Star
                          className={cn(
                            "h-3 w-3",
                            image.isPrimary ? "fill-white" : "",
                          )}
                        />
                      </Button>
                      {/* Botão para remover a imagem */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 min-w-6 bg-red-600/90 px-1 hover:bg-red-700/90"
                        onClick={() => removeImage(image.id)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Badge "Principal" (só aparece na imagem principal) */}
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1">
                      <div className="flex items-center gap-0.5 rounded-full bg-blue-600 px-1 py-0.5 text-xs text-white">
                        <Star className="h-2 w-2 fill-white" />
                        <span className="text-xs">Principal</span>
                      </div>
                    </div>
                  )}

                  {/* Número da imagem no canto superior direito */}
                  <div className="absolute top-1 right-1">
                    <div className="rounded-full bg-black/70 px-1.5 py-0.5 text-xs text-white">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
