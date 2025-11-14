// src/app/admin/products/new/components/image-upload/ProductImageGallery.tsx
"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Upload, Image as ImageIcon, Star, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface UploadedImage {
  id: string
  file?: File
  url?: string
  preview: string
  isPrimary: boolean
  uploadProgress?: number
  altText?: string
}

interface ProductImageGalleryProps {
  onImagesChange?: (images: UploadedImage[]) => void
  maxFiles?: number
}

export function ProductImageGallery({ 
  onImagesChange, 
  maxFiles = 10 
}: ProductImageGalleryProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadToBlob = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.statusText}`);
      }

      const blobData = await response.json();
      
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
      console.error('Erro no upload para Vercel Blob:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedImages.length + acceptedFiles.length > maxFiles) {
      alert(`Máximo de ${maxFiles} imagens permitido`)
      return
    }

    setIsUploading(true)

    const newImages: UploadedImage[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      isPrimary: uploadedImages.length === 0 && acceptedFiles[0] === file,
      uploadProgress: 0
    }))

    const updatedImages = [...uploadedImages, ...newImages]
    setUploadedImages(updatedImages)
    onImagesChange?.(updatedImages)

    try {
      const uploadResults: { id: string; url: string }[] = []

      for (const image of newImages) {
        if (image.file) {
          const blobUrl = await uploadToBlob(image.file)
          uploadResults.push({ id: image.id, url: blobUrl })

          setUploadedImages(prev => prev.map(img =>
            img.id === image.id
              ? { ...img, url: blobUrl, uploadProgress: 100 }
              : img
          ))
        }
      }

      const finalImages = updatedImages.map(img => {
        const res = uploadResults.find(r => r.id === img.id)
        if (res) {
          return { ...img, url: res.url, uploadProgress: 100 }
        }
        return img
      })

      setUploadedImages(finalImages)
      onImagesChange?.(finalImages)

    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload das imagens')
    } finally {
      setIsUploading(false)
    }
  }, [uploadedImages, maxFiles, onImagesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    multiple: true,
    maxFiles: maxFiles - uploadedImages.length,
    disabled: isUploading
  })

  const removeImage = (id: string) => {
    const imageToRemove = uploadedImages.find(img => img.id === id)
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview)
    }

    const updatedImages = uploadedImages.filter(img => img.id !== id)
    
    if (imageToRemove?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true
    }

    setUploadedImages(updatedImages)
    onImagesChange?.(updatedImages)
  }

  const setPrimaryImage = (id: string) => {
    const updatedImages = uploadedImages.map(img => ({
      ...img,
      isPrimary: img.id === id
    }))
    setUploadedImages(updatedImages)
    onImagesChange?.(updatedImages)
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="w-4 h-4" />
          Galeria de Imagens
        </CardTitle>
        <CardDescription className="text-xs">
          {uploadedImages.length > 0 
            ? `${uploadedImages.length}/${maxFiles} imagens - Arraste para reordenar`
            : `Adicione imagens do produto (máx. ${maxFiles})`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload - MAIS COMPACTA */}
        {uploadedImages.length < maxFiles && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-gray-900/50",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {isUploading 
                  ? "Fazendo upload..." 
                  : isDragActive 
                    ? "Solte as imagens aqui..." 
                    : "Arraste imagens ou clique para selecionar"
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, WEBP, GIF até 10MB cada
              </p>
              {!isUploading && (
                <Button type="button" variant="outline" size="sm" className="mt-1 h-7 text-xs">
                  Selecionar Arquivos
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Preview das Imagens - MAIS COMPACTO */}
        {uploadedImages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                Imagens ({uploadedImages.length}/{maxFiles})
              </h4>
              {uploadedImages.some(img => img.uploadProgress && img.uploadProgress < 100) && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processando...
                </div>
              )}
            </div>

            {/* Grid com altura reduzida das imagens */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {uploadedImages.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative group rounded-md border overflow-hidden bg-gray-100 dark:bg-gray-800 transition-all",
                    image.isPrimary 
                      ? "border-blue-500 ring-1 ring-blue-200 dark:ring-blue-800" 
                      : "border-gray-200 dark:border-gray-700"
                  )}
                >
                  {/* Container da imagem com altura fixa menor */}
                  <div className="aspect-square h-20">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay de Progresso */}
                    {image.uploadProgress !== undefined && image.uploadProgress < 100 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                          <div className="text-xs">{image.uploadProgress}%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlay com Ações - MAIS DISCRETO */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={image.isPrimary ? "default" : "secondary"}
                        className={cn(
                          "h-6 px-1 min-w-6",
                          image.isPrimary 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                        )}
                        onClick={() => setPrimaryImage(image.id)}
                        disabled={image.isPrimary}
                      >
                        <Star className={cn(
                          "w-3 h-3",
                          image.isPrimary ? "fill-white" : ""
                        )} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 px-1 min-w-6 bg-red-600/90 hover:bg-red-700/90"
                        onClick={() => removeImage(image.id)}
                        disabled={isUploading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Badge Principal - MENOR */}
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1">
                      <div className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="w-2 h-2 fill-white" />
                        <span className="text-xs">Principal</span>
                      </div>
                    </div>
                  )}

                  {/* Número da Imagem - MENOR */}
                  <div className="absolute top-1 right-1">
                    <div className="bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full">
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
  )
}