// src/app/admin/products/new/components/image-upload/product-image-upload.tsx
"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Upload, Image as ImageIcon, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  id: string
  file: File
  preview: string
  isPrimary: boolean
}

interface ProductImageUploadProps {
  onImagesChange?: (files: UploadedFile[]) => void
}

export function ProductImageUpload({ onImagesChange }: ProductImageUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      isPrimary: uploadedFiles.length === 0 // Primeira imagem é principal
    }))

    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onImagesChange?.(updatedFiles)
  }, [uploadedFiles, onImagesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  })

  const removeFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== id)
    
    // Se removemos a imagem principal, definir a próxima como principal
    const removedFile = uploadedFiles.find(file => file.id === id)
    if (removedFile?.isPrimary && updatedFiles.length > 0) {
      updatedFiles[0].isPrimary = true
    }

    setUploadedFiles(updatedFiles)
    onImagesChange?.(updatedFiles)
  }

  const setPrimary = (id: string) => {
    const updatedFiles = uploadedFiles.map(file => ({
      ...file,
      isPrimary: file.id === id
    }))
    setUploadedFiles(updatedFiles)
    onImagesChange?.(updatedFiles)
  }

  // Cleanup preview URLs
  const cleanup = () => {
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Imagens do Produto
        </CardTitle>
        <CardDescription>
          Adicione imagens do produto. A primeira imagem será a principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de Upload */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? "Solte as imagens aqui..." : "Arraste imagens ou clique para selecionar"}
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, WEBP até 10MB cada
            </p>
            <Button type="button" variant="outline" className="mt-2">
              Selecionar Arquivos
            </Button>
          </div>
        </div>

        {/* Preview das Imagens */}
        {uploadedFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Imagens ({uploadedFiles.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {uploadedFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={cn(
                    "relative group rounded-lg border-2 overflow-hidden",
                    file.isPrimary 
                      ? "border-blue-500 ring-2 ring-blue-200" 
                      : "border-gray-200"
                  )}
                >
                  {/* Imagem */}
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={file.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Overlay com Ações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={file.isPrimary ? "default" : "secondary"}
                        className={cn(
                          "h-8 px-2",
                          file.isPrimary 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "bg-white/90 hover:bg-white"
                        )}
                        onClick={() => setPrimary(file.id)}
                      >
                        <Star className={cn(
                          "w-3 h-3",
                          file.isPrimary ? "fill-white" : ""
                        )} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-2 bg-red-600/90 hover:bg-red-700/90"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Badge Principal */}
                  {file.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Principal
                      </div>
                    </div>
                  )}

                  {/* Número da Imagem */}
                  <div className="absolute top-2 right-2">
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
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