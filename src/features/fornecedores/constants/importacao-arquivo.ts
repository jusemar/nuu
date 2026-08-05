// src/features/fornecedores/constants/importacao-arquivo.ts
// =============================================================================
// LIMITES DO ARQUIVO DE IMPORTAÇÃO DE FORNECEDOR (fonte única de verdade)
// =============================================================================
// Este arquivo é a ÚNICA definição do tamanho máximo aceito na importação.
// É consumido por três camadas, que precisam concordar entre si:
//
// 1. formulário (client)  → bloqueia o arquivo antes do envio;
// 2. Server Action        → rede de segurança quando o client é contornado;
// 3. `fornecedores.schema`→ validação de negócio (Zod).
//
// -----------------------------------------------------------------------------
// POR QUE ~4,3 MB E NÃO 10 MB
// -----------------------------------------------------------------------------
// A Vercel rejeita, na própria infraestrutura, requisições de Serverless
// Function acima de ~4,5 MB. Esse teto NÃO é configurável — nem por
// `next.config`, nem por `vercel.json`, nem por `bodySizeLimit`.
//
// Manter 10 MB na validação de negócio prometia ao gestor um tamanho que
// produção nunca conseguiria entregar: o arquivo passava no schema e depois
// quebrava na Vercel com erro genérico, sem mensagem útil.
//
// A cadeia de limites ficou ordenada assim, do menor para o maior:
//
//   4.300.000 B  → regra de negócio (este arquivo)          ← rejeita primeiro
//   4.404.019 B  → `bodySizeLimit` no next.config ("4.2mb")
//   4.500.000 B  → teto de infraestrutura da Vercel
//
// A folga entre a regra de negócio e o `bodySizeLimit` é intencional: garante
// que um arquivo pouco acima do permitido ainda CHEGUE na action e receba uma
// mensagem amigável, em vez de ser cortado pelo framework com um 413 cru.

/**
 * Tamanho máximo aceito, em bytes.
 *
 * Declarado em base decimal (1 MB = 1.000.000 bytes) de propósito: é a mesma
 * base usada pela Vercel ao documentar o teto de 4,5 MB. Usar base binária
 * (4,3 × 1024 × 1024 = 4.508.876) ultrapassaria esse teto.
 */
export const TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_BYTES = 4_300_000;

/** Extensões aceitas no upload — usado no `accept` do input e na validação. */
export const EXTENSOES_ARQUIVO_IMPORTACAO = ["xlsx", "xls", "csv"] as const;

/**
 * Formata bytes em MB legível (mesma base decimal do limite acima).
 *
 * @example formatarTamanhoEmMegabytes(3_600_000) // "3,6 MB"
 */
export function formatarTamanhoEmMegabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`;
}

/** Limite máximo já formatado, para reaproveitar em textos da interface. */
export const TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_FORMATADO =
  formatarTamanhoEmMegabytes(TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_BYTES);

/** Instrução final, repetida nas duas variações de mensagem abaixo. */
const ORIENTACAO_ARQUIVO_ACIMA_DO_LIMITE =
  "Por favor, envie um arquivo menor ou divida os dados em múltiplas importações.";

/**
 * Monta a mensagem exibida quando o arquivo escolhido passa do limite,
 * informando o tamanho real do arquivo.
 *
 * Fica aqui (e não no componente) para que client e servidor mostrem
 * exatamente o mesmo texto.
 *
 * @param tamanhoDoArquivoEmBytes - Tamanho real do arquivo selecionado.
 */
export function montarMensagemArquivoAcimaDoLimite(
  tamanhoDoArquivoEmBytes: number,
): string {
  return (
    `O arquivo selecionado tem ${formatarTamanhoEmMegabytes(tamanhoDoArquivoEmBytes)}. ` +
    `O limite máximo para importação é de ${TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_FORMATADO}. ` +
    `${ORIENTACAO_ARQUIVO_ACIMA_DO_LIMITE}`
  );
}

/**
 * Versão sem o tamanho do arquivo, para o schema Zod — a mensagem do `.max()`
 * é estática e não tem acesso ao valor recebido.
 */
export const MENSAGEM_ARQUIVO_ACIMA_DO_LIMITE =
  `O arquivo excede o limite máximo de ${TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_FORMATADO} ` +
  `para importação. ${ORIENTACAO_ARQUIVO_ACIMA_DO_LIMITE}`;
