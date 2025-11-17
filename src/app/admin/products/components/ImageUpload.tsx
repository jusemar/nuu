// src/app/admin/products/[id]/components/ImageUpload.tsx
"use client"

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProductImageMutations } from '@/hooks/admin/mutations/products/product-images/use-product-image-mutations'
import { cloudinaryService } from '@/lib/admin/products/product-image/cloudinary'

interface ImageUploadProps {
  productVariantId: string
  onUploadSuccess: () => void
}

export function ImageUpload({ productVariantId, onUploadSuccess }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { createImage } = useProductImageMutations()

  const handleFiles = async (files: FileList) => {
    setIsUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        // Upload para Cloudinary
        const cloudinaryResult = await cloudinaryService.uploadImage(file)
        
        // Salvar no banco
        await createImage.mutateAsync({
          productVariantId,
          imageUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          altText: file.name.split('.')[0], // Nome do arquivo sem extensão
        })
      }
      
      onUploadSuccess()
    } catch (error) {
      console.error('Erro no upload:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          Arraste imagens ou clique para fazer upload
        </p>
        <p className="text-sm text-gray-500 mb-4">
          PNG, JPG, WEBP até 10MB
        </p>
        
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Enviando...' : 'Selecionar Imagens'}
        </Button>
      </div>

      {isUploading && (
        <div className="text-sm text-blue-600 text-center">
          Fazendo upload das imagens...
        </div>
      )}
    </div>
  )
}