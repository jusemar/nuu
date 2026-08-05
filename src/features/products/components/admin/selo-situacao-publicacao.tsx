// src/features/products/components/admin/selo-situacao-publicacao.tsx
//
// Selo que mostra, no admin, se o produto realmente aparece na loja.
// Usa o Badge do Design System (nada de classe customizada solta).

import { Badge } from "@/components/ui/badge";
import {
  DESCRICOES_SITUACAO_PUBLICACAO,
  obterSituacaoPublicacaoProduto,
  ROTULOS_SITUACAO_PUBLICACAO,
  type SituacaoPublicacaoProduto,
} from "@/features/products/lib/situacao-publicacao-produto";

/** Cada situação usa uma variante já existente do Badge. */
const VARIANTES_POR_SITUACAO: Record<
  SituacaoPublicacaoProduto,
  "success" | "secondary" | "destructive" | "warning"
> = {
  publicado: "success",
  rascunho: "secondary",
  inativo: "destructive",
  "fora-do-catalogo": "warning",
};

interface SeloSituacaoPublicacaoProps {
  status?: string | null;
  isActive?: boolean | null;
  storeProductFlags?: string[] | null;
}

export function SeloSituacaoPublicacao({
  status,
  isActive,
  storeProductFlags,
}: SeloSituacaoPublicacaoProps) {
  const situacao = obterSituacaoPublicacaoProduto({
    status,
    isActive,
    storeProductFlags,
  });

  return (
    <Badge
      variant={VARIANTES_POR_SITUACAO[situacao]}
      title={DESCRICOES_SITUACAO_PUBLICACAO[situacao]}
    >
      {ROTULOS_SITUACAO_PUBLICACAO[situacao]}
    </Badge>
  );
}
