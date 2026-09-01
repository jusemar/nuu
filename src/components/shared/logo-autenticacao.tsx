"use client";

import { useIdentidadeVisual } from "@/features/configuracoes-loja/components/store/contexto-identidade-visual";
import { LogoDinamica } from "@/features/configuracoes-loja/components/store/logo-dinamica";

/**
 * Logo oficial da loja aplicada às telas de autenticação (cliente e admin).
 *
 * Reaproveita exatamente a mesma imagem do cabeçalho: a URL vem do contexto de
 * identidade visual publicado pelo layout raiz, e a renderização continua sendo
 * feita pelo componente `LogoDinamica`. Assim, trocar a logo nas configurações
 * da loja atualiza cabeçalho, rodapé e telas de autenticação de uma só vez.
 */
export function LogoAutenticacao({ className = "" }: { className?: string }) {
  const { logoCabecalhoUrl } = useIdentidadeVisual();

  return (
    <LogoDinamica
      local="autenticacao"
      url={logoCabecalhoUrl}
      className={className}
    />
  );
}
