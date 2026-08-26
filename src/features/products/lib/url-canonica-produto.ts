// src/features/products/lib/url-canonica-produto.ts
// =============================================================================
// URL CANÔNICA DO PRODUTO (regra de negócio pura — sem React, sem banco)
// =============================================================================
// Um único lugar decide como é a URL pública de um produto. É usado por:
// - aba SEO do admin (prévia + preenchimento automático do campo);
// - `generateMetadata` da PDP (tag <link rel="canonical"> e Open Graph).
//
// A rota pública real do projeto é `src/app/product/[slug]/page.tsx`,
// ou seja: /product/<slug>. A rota antiga "/produtos/<slug>" NÃO existe.

import { montarUrlAbsoluta, obterUrlBaseSite } from "@/lib/seo/url-site";

/** Segmento da rota pública do produto (confere com `src/app/product/[slug]`). */
export const CAMINHO_PUBLICO_PRODUTO = "product";

/**
 * Segmento de rota que já foi usado por engano em versões anteriores.
 * Serve só para reconhecer valores legados salvos no banco e corrigi-los.
 */
const CAMINHOS_LEGADOS_PRODUTO = ["produtos"];

/** Domínio de exemplo que existia fixo no código antigo. */
const DOMINIO_FICTICIO_LEGADO = "seusite.com";

/** Remove espaços e barras sobrando das pontas do slug. */
function limparSlug(slug: string | null | undefined): string {
  return (slug ?? "").trim().replace(/^\/+|\/+$/g, "");
}

/**
 * Monta o caminho relativo público do produto.
 *
 * @example montarCaminhoProduto("racao-magnus") // "/product/racao-magnus"
 */
export function montarCaminhoProduto(slug: string | null | undefined): string {
  const slugLimpo = limparSlug(slug);
  return slugLimpo === ""
    ? `/${CAMINHO_PUBLICO_PRODUTO}`
    : `/${CAMINHO_PUBLICO_PRODUTO}/${slugLimpo}`;
}

/**
 * Monta a URL canônica absoluta do produto usando a URL-base do ambiente.
 *
 * Em produção → https://nooo.com.br/product/<slug>
 * Em desenvolvimento → http://localhost:3000/product/<slug>
 *
 * @param slug - Slug do produto. Se vier vazio, devolve apenas a URL-base + rota.
 */
export function montarUrlCanonicaProduto(
  slug: string | null | undefined,
): string {
  return montarUrlAbsoluta(montarCaminhoProduto(slug));
}

/** Extrai o caminho de uma URL absoluta OU relativa, sem barra final. */
function extrairCaminho(valor: string): string | null {
  const valorLimpo = valor.trim();
  if (valorLimpo === "") return null;

  try {
    // A segunda opção do `URL` serve de base quando o valor é relativo.
    const url = new URL(valorLimpo, obterUrlBaseSite());
    return url.pathname.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/**
 * Diz se o valor salvo no campo "URL Canônica" pode ser regenerado.
 *
 * Só regeneramos quando o valor claramente NÃO é uma personalização do gestor:
 * - campo vazio;
 * - domínio fictício antigo (`seusite.com`);
 * - rota inexistente `/produtos/<algo>`;
 * - rota correta apontando para um dos slugs informados (o slug atual ou o
 *   anterior, quando o gestor acabou de renomear o produto).
 *
 * Uma canonical apontando para OUTRO produto continua preservada — esse é um
 * uso legítimo de canonical (conteúdo duplicado).
 *
 * @param valorAtual - Conteúdo atual do campo.
 * @param slugsConhecidos - Slug atual e, opcionalmente, o slug anterior.
 */
export function ehUrlCanonicaGeradaAutomaticamente(
  valorAtual: string | null | undefined,
  slugsConhecidos: Array<string | null | undefined>,
): boolean {
  const valor = (valorAtual ?? "").trim();
  if (valor === "") return true;

  // Resquício do domínio de exemplo fixo no código antigo.
  if (valor.toLowerCase().includes(DOMINIO_FICTICIO_LEGADO)) return true;

  const caminho = extrairCaminho(valor);
  if (!caminho) return true; // valor quebrado: melhor regenerar

  const segmentos = caminho.split("/").filter(Boolean);
  if (segmentos.length !== 2) return false;

  const [rota, slugDaUrl] = segmentos;

  // Rota antiga que nunca existiu no projeto → sempre corrigir.
  if (CAMINHOS_LEGADOS_PRODUTO.includes(rota)) return true;

  if (rota !== CAMINHO_PUBLICO_PRODUTO) return false;

  return slugsConhecidos
    .map((slug) => limparSlug(slug))
    .filter((slug) => slug !== "")
    .includes(slugDaUrl);
}

/**
 * Decide qual URL canônica a PDP deve publicar.
 *
 * Preserva a personalização feita pelo gestor (regra já existente no projeto:
 * o campo é editável e persistido) e conserta automaticamente os valores
 * legados/gerados que apontariam para um domínio ou rota inválidos.
 */
export function resolverUrlCanonicaProduto(parametros: {
  slug: string;
  urlCanonicaSalva?: string | null;
}): string {
  const { slug, urlCanonicaSalva } = parametros;

  if (ehUrlCanonicaGeradaAutomaticamente(urlCanonicaSalva, [slug])) {
    return montarUrlCanonicaProduto(slug);
  }

  // Personalização válida do gestor — só garantimos que seja absoluta.
  const valor = (urlCanonicaSalva ?? "").trim();
  return /^https?:\/\//i.test(valor) ? valor : montarUrlAbsoluta(valor);
}
