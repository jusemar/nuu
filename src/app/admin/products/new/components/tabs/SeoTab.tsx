"use client";

import { useEffect, useRef } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ehUrlCanonicaGeradaAutomaticamente,
  montarUrlCanonicaProduto,
} from "@/features/products/lib/url-canonica-produto";

interface SeoTabProps {
  data: {
    slug: string;
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
  onChange: (updates: { canonicalUrl?: string } & Record<string, unknown>) => void;
}

export function SeoTab({ data, onChange }: SeoTabProps) {
  // URL canônica sugerida a partir do slug atual.
  // O domínio vem da configuração única do projeto (`NEXT_PUBLIC_APP_URL`),
  // nunca de um domínio de exemplo fixo no código.
  const urlCanonicaAutomatica = montarUrlCanonicaProduto(data.slug);

  // Guarda o slug do render anterior para saber que houve renomeação.
  const slugAnteriorRef = useRef(data.slug);

  // `onChange` costuma ser recriado a cada render do formulário pai; guardamos
  // a referência mais recente para não precisar colocá-lo nas dependências do
  // efeito (o que dispararia o efeito sem necessidade).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Mantém a prévia da URL canônica sincronizada com o slug.
  useEffect(() => {
    const slugAnterior = slugAnteriorRef.current;
    slugAnteriorRef.current = data.slug;

    if (!data.slug?.trim()) return;

    const valorAtual = data.canonicalUrl ?? "";

    // Só sobrescreve o campo quando o valor não é uma personalização do gestor
    // (vazio, domínio antigo "seusite.com", rota "/produtos/..." ou a URL
    // gerada para o slug atual/anterior).
    const podeRegenerar = ehUrlCanonicaGeradaAutomaticamente(valorAtual, [
      data.slug,
      slugAnterior,
    ]);

    if (podeRegenerar && valorAtual !== urlCanonicaAutomatica) {
      onChangeRef.current({ canonicalUrl: urlCanonicaAutomatica });
    }
    // Reage apenas à mudança de slug/URL gerada — o valor digitado pelo gestor
    // é lido de `data.canonicalUrl` no momento da execução.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.slug, urlCanonicaAutomatica]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Otimização para SEO</CardTitle>
        <CardDescription>
          Melhore a visibilidade nos mecanismos de busca
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Título</Label>
          <Input
            id="metaTitle"
            placeholder="Título para SEO (até 60 caracteres)"
            value={data.metaTitle || ""}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Descrição</Label>
          <Input
            id="metaDescription"
            placeholder="Descrição para SEO (até 160 caracteres)"
            value={data.metaDescription || ""}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="canonicalUrl">URL Canônica</Label>
          <Input
            id="canonicalUrl"
            placeholder={urlCanonicaAutomatica}
            value={data.canonicalUrl ?? ""}
            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Gerada automaticamente a partir do slug. Ao alterar o slug, a prévia
            é atualizada. Edite apenas se precisar apontar para outra página.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
