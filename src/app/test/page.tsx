// src/app/test/page.tsx
"use client"

import { ProductImageUpload } from '../admin/products/new/components/image-upload/Excluirproduct-image-upload'

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Teste Upload de Imagens</h1>
      <ProductImageUpload 
        onImagesChange={(files) => {
          console.log('Imagens alteradas:', files)
        }}
      />
    </div>
  )
}