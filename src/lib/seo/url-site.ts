// src/lib/seo/url-site.ts
// =============================================================================
// URL-BASE DO SITE (fonte única de verdade)
// =============================================================================
// Todo lugar do projeto que precisar montar uma URL absoluta (canonical da PDP,
// metadataBase, Open Graph, prévia da aba SEO no admin, sitemap futuro...)
// DEVE usar as funções deste arquivo.
//
// Por que centralizar?
// - evita domínio fictício espalhado pelo código (ex.: "https://seusite.com");
// - evita URL quebrada do tipo "https://https://site.com" ou "site.com//produto";
// - permite trocar o domínio mexendo só na variável de ambiente.
//
// Este arquivo NÃO é "server-only" de propósito: ele também roda no navegador
// (o formulário do admin usa a prévia da URL canônica). Por isso a leitura da
// variável pública precisa ser feita de forma literal — veja o comentário em
// `lerVariaveisDeAmbienteCandidatas()`.

// -----------------------------------------------------------------------------
// Constantes
// -----------------------------------------------------------------------------

/**
 * Domínio oficial da loja em produção.
 *
 * Serve APENAS como rede de segurança: se o deploy de produção subir sem
 * `NEXT_PUBLIC_APP_URL` configurada, ainda assim geramos uma URL real
 * (nunca um domínio de exemplo). O caminho normal continua sendo a env.
 */
const URL_PRODUCAO_PADRAO = "https://nuu-app.vercel.app";

/** Domínio usado em desenvolvimento local quando nada estiver configurado. */
const URL_DESENVOLVIMENTO_PADRAO = "http://localhost:3000";

/** Hosts considerados "locais" — inválidos para uma URL canônica de produção. */
const HOSTS_LOCAIS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

// -----------------------------------------------------------------------------
// Normalização
// -----------------------------------------------------------------------------

/**
 * Limpa e valida um valor bruto vindo de variável de ambiente.
 *
 * Corrige os erros mais comuns de digitação/configuração:
 * - espaços em volta (`" http://localhost:3000 "`);
 * - protocolo duplicado (`"https://https://site.com"`);
 * - domínio sem protocolo (`"nuu-app.vercel.app"` → `"https://nuu-app.vercel.app"`);
 * - barra(s) no final (`"https://site.com/"` → `"https://site.com"`).
 *
 * @param valorBruto - Valor cru (pode vir `undefined` do `process.env`).
 * @returns URL-base normalizada e sem barra final, ou `null` se for inválida.
 */
export function normalizarUrlBase(
  valorBruto: string | undefined | null,
): string | null {
  if (!valorBruto) return null;

  let valor = valorBruto.trim();
  if (valor === "") return null;

  // 1. Remove protocolos repetidos no início: "https://https://x" → "https://x".
  valor = valor.replace(/^(?:https?:\/\/)+/i, (trecho) =>
    trecho.toLowerCase().startsWith("http://") ? "http://" : "https://",
  );

  // 2. Se ainda não tem protocolo, assume https (http só para host local).
  if (!/^https?:\/\//i.test(valor)) {
    const ehLocal = HOSTS_LOCAIS.some((host) => valor.startsWith(host));
    valor = `${ehLocal ? "http" : "https"}://${valor}`;
  }

  try {
    const url = new URL(valor);

    // `origin` já entrega "protocolo + host + porta" sem barra final.
    // O pathname só é preservado quando o site roda em um subdiretório.
    const caminho = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${caminho}`;
  } catch {
    // Valor irrecuperável (ex.: "://", "http://") — ignora e deixa o próximo
    // candidato da lista assumir.
    return null;
  }
}

/** Indica se a URL aponta para uma máquina local (localhost, 127.0.0.1...). */
function ehUrlLocal(url: string): boolean {
  try {
    return HOSTS_LOCAIS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Resolução da URL-base
// -----------------------------------------------------------------------------

/**
 * Lista, em ordem de prioridade, os candidatos a URL-base.
 *
 * IMPORTANTE: as variáveis `NEXT_PUBLIC_*` precisam ser escritas de forma
 * literal (`process.env.NEXT_PUBLIC_APP_URL`) para que o Next.js consiga
 * substituí-las no bundle do navegador. Acesso dinâmico (`process.env[nome]`)
 * simplesmente não funcionaria no client.
 *
 * As demais (`VERCEL_*`, `BETTER_AUTH_URL`) só existem no servidor; no
 * navegador elas chegam como `undefined` e são naturalmente ignoradas.
 */
function lerVariaveisDeAmbienteCandidatas(): Array<string | undefined> {
  return [
    // 1. Configuração oficial do projeto (única que precisa ser mantida).
    process.env.NEXT_PUBLIC_APP_URL,
    // 2. Domínio de produção do projeto na Vercel (sem protocolo).
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    // 3. Domínio do deploy atual na Vercel (preview), também sem protocolo.
    process.env.VERCEL_URL,
    // 4. Último recurso: a base já usada pela autenticação.
    process.env.BETTER_AUTH_URL,
  ];
}

/** `true` quando o código está rodando em build/runtime de produção. */
function ehAmbienteDeProducao(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Retorna a URL-base do site, sempre normalizada e SEM barra no final.
 *
 * Regras:
 * - em produção, valores locais (`http://localhost:3000`) são descartados,
 *   porque uma canonical apontando para localhost quebraria o SEO;
 * - em desenvolvimento, o fallback é `http://localhost:3000`.
 *
 * @example
 * obterUrlBaseSite(); // "https://nuu-app.vercel.app" (produção)
 * obterUrlBaseSite(); // "http://localhost:3000"      (desenvolvimento)
 */
export function obterUrlBaseSite(): string {
  const producao = ehAmbienteDeProducao();

  for (const candidato of lerVariaveisDeAmbienteCandidatas()) {
    const urlNormalizada = normalizarUrlBase(candidato);
    if (!urlNormalizada) continue;
    if (producao && ehUrlLocal(urlNormalizada)) continue;
    return urlNormalizada;
  }

  return producao ? URL_PRODUCAO_PADRAO : URL_DESENVOLVIMENTO_PADRAO;
}

// -----------------------------------------------------------------------------
// Montagem de URLs absolutas
// -----------------------------------------------------------------------------

/**
 * Junta a URL-base com um caminho interno, sem gerar barras duplicadas.
 *
 * @param caminho - Caminho relativo (com ou sem "/" inicial).
 * @returns URL absoluta pronta para uso em canonical, Open Graph, e-mails etc.
 *
 * @example
 * montarUrlAbsoluta("/product/racao-magnus");
 * // "https://nuu-app.vercel.app/product/racao-magnus"
 */
export function montarUrlAbsoluta(caminho: string): string {
  const base = obterUrlBaseSite();
  const caminhoLimpo = (caminho ?? "").trim().replace(/^\/+/, "");
  return caminhoLimpo === "" ? base : `${base}/${caminhoLimpo}`;
}
