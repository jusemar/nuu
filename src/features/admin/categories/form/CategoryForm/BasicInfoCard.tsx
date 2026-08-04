// src/features/admin/categories/form/CategoryForm/BasicInfoCard.tsx
"use client";

import { Link as LinkIcon,Upload } from "lucide-react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type { Category } from "../../types";

// Interface simplificada - Melhor prática: passar apenas o necessário
interface BasicInfoCardProps {
  // Dados da categoria
  data: {
    name: string;
    slug: string;
    description: string;
    descriptionBottom: string;
    isActive: boolean;
    metaTitle: string;
    metaDescription: string;
    orderIndex: number;
    parentId: string | null;
  };

  // Função para atualizar qualquer campo dos dados
  onDataChange: (updates: Partial<BasicInfoCardProps["data"]>) => void;

  // Função opcional para quando slug muda (pode ser usada para validações extras)
  onSlugChange?: (slug: string) => void;

  // Estado de loading (desabilita campos durante carregamento)
  isLoading: boolean;

  // Contadores para SEO (podem ser calculados internamente, mas vêm de fora)
  metaTitleCount: number;
  metaDescCount: number;

  // Componente de barra de progresso (injetado para reutilização)
  ProgressBar: React.ComponentType<{ value: number; max?: number }>;
  categoriasPai: Category[];
}

export function BasicInfoCard({
  data,
  onDataChange,
  onSlugChange,
  isLoading,
  metaTitleCount,
  metaDescCount,
  ProgressBar,
  categoriasPai,
}: BasicInfoCardProps) {
  return (
    <div className="space-y-6">
      {/* Card Informações Básicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo: Nome da Categoria */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">
              Nome da Categoria *
            </Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => {
                const value = e.target.value;
                // Atualiza apenas o campo 'name' no estado pai
                // O slug será gerado automaticamente pelo hook no componente pai
                onDataChange({ name: value });
              }}
              placeholder="Ex: Colchões"
              className="text-lg font-medium"
              disabled={isLoading} // Desabilita durante carregamento
            />
            <p className="text-xs text-gray-500">
              Este nome aparecerá no breadcrumb da coluna central
            </p>
          </div>

          {/* Campo: Slug (URL) */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="font-medium">
              Slug (URL)
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Atualiza o slug
                    onDataChange({ slug: value });
                    // Chama callback adicional se existir
                    onSlugChange?.(value);
                  }}
                  placeholder="colchoes, eletronicos, automotivo"
                  disabled={isLoading}
                />
              </div>
              <LinkIcon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              Preview:{" "}
              <span className="font-mono">/category/{data.slug || "nome"}</span>
            </p>
          </div>

          {/* Campo: Descrição */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Categoria pai</Label>
            <select
              id="parentId"
              value={data.parentId ?? ""}
              onChange={(event) =>
                onDataChange({ parentId: event.target.value || null })
              }
              disabled={isLoading}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem categoria pai</option>
              {categoriasPai.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Selecione “Sem categoria pai” para transformar esta categoria em
              principal.
            </p>
          </div>

          {/* Campo: Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => onDataChange({ description: e.target.value })}
              placeholder="Descreva esta categoria para os clientes..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição inferior da categoria</Label>
            <p className="text-xs text-gray-500">
              Conteúdo complementar exibido no final da página pública da categoria. Use para orientações, informações detalhadas, links internos e conteúdo editorial.
            </p>
            <RichTextEditor
              value={data.descriptionBottom}
              onChange={(descriptionBottom) => onDataChange({ descriptionBottom })}
              placeholder="Adicione o conteúdo editorial complementar..."
            />
          </div>

          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Imagem da Categoria</Label>
            <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-gray-400">
              <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium">Clique para upload</p>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG até 2MB</p>
            </div>
          </div>

          {/* Switch: Status Ativo/Inativo */}
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="isActive" className="font-medium">
              Status
            </Label>
            <Switch
              id="isActive"
              checked={data.isActive}
              onCheckedChange={(checked) => onDataChange({ isActive: checked })}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card SEO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">SEO & Meta Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo: Meta Título */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaTitle">Meta Título</Label>
              <span className="text-xs text-gray-500">{metaTitleCount}/60</span>
            </div>
            <Input
              id="metaTitle"
              value={data.metaTitle || ""}
              onChange={(e) => onDataChange({ metaTitle: e.target.value })}
              placeholder="Ex: Compre Colchões de Qualidade"
              maxLength={60}
              disabled={isLoading}
            />
            {/* Barra de progresso do Meta Título */}
            <ProgressBar value={metaTitleCount} max={60} />
          </div>

          {/* Campo: Meta Descrição */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaDescription">Meta Descrição</Label>
              <span className="text-xs text-gray-500">{metaDescCount}/160</span>
            </div>
            <Textarea
              id="metaDescription"
              value={data.metaDescription || ""}
              onChange={(e) =>
                onDataChange({ metaDescription: e.target.value })
              }
              placeholder="Encontre os melhores colchões com garantia..."
              rows={3}
              maxLength={160}
              disabled={isLoading}
            />
            {/* Barra de progresso da Meta Descrição */}
            <ProgressBar value={metaDescCount} max={160} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
