"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react' // ← ADICIONAR IMPORT

interface SeoTabProps {
  data: {
    slug: string   
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
   
  }
  onChange: (updates: any) => void
}

export function SeoTab({ data, onChange }: SeoTabProps) {
  const router = useRouter()
  
  // URL base do site
  const baseUrl = process.env.NEXTAUTH_URL || 'https://seusite.com'
  const autoCanonicalUrl = `${baseUrl}/produtos/${data.slug}`

  // ✅ CORRIGIDO: Salvar URL canônica automaticamente
  useEffect(() => {
    if (data.slug && !data.canonicalUrl) {
      onChange({ 
        canonicalUrl: autoCanonicalUrl 
      })
    }
  }, [data.slug])

  // ✅ CORRIGIDO: Agora onChange é direto (não precisa do handleSeoChange)
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
            value={data.metaTitle || ''}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Descrição</Label>
          <Input 
            id="metaDescription" 
            placeholder="Descrição para SEO (até 160 caracteres)" 
            value={data.metaDescription || ''}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="canonicalUrl">URL Canônica</Label>
          <Input 
            id="canonicalUrl" 
            placeholder={autoCanonicalUrl}
            value={data.canonicalUrl || autoCanonicalUrl}
            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Gerado automaticamente a partir do slug
          </p>
        </div>
      </CardContent>
    </Card>
  )
}