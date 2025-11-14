"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'

interface SeoTabProps {
  data: {
    slug: string
    seo?: {
      metaTitle?: string
      metaDescription?: string
      canonicalUrl?: string
    }
  }
  onChange: (updates: any) => void
}

export function SeoTab({ data, onChange }: SeoTabProps) {
  const router = useRouter()
  const seoData = data.seo || {}

  // URL base do site (pega do environment ou usa fallback)
  const baseUrl = process.env.NEXTAUTH_URL || 'https://seusite.com'
  
  // URL canônica automática
  const autoCanonicalUrl = `${baseUrl}/produtos/${data.slug}`

  const handleSeoChange = (updates: any) => {
    onChange({ 
      seo: { ...seoData, ...updates } 
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Otimização para SEO</CardTitle>
        <CardDescription>Melhore a visibilidade nos mecanismos de busca</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Título</Label>
          <Input 
            id="metaTitle" 
            placeholder="Título para SEO (até 60 caracteres)" 
            value={seoData.metaTitle || ''}
            onChange={(e) => handleSeoChange({ metaTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Descrição</Label>
          <Input 
            id="metaDescription" 
            placeholder="Descrição para SEO (até 160 caracteres)" 
            value={seoData.metaDescription || ''}
            onChange={(e) => handleSeoChange({ metaDescription: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="canonicalUrl">URL Canônica</Label>
          <Input 
            id="canonicalUrl" 
            placeholder={autoCanonicalUrl}
            value={seoData.canonicalUrl || autoCanonicalUrl}
            onChange={(e) => handleSeoChange({ canonicalUrl: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Gerado automaticamente a partir do slug
          </p>
        </div>
      </CardContent>
    </Card>
  )
}