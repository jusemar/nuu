// src/db/connection.ts
// 
// Configuração da conexão com o banco de dados Neon (PostgreSQL)
// O cliente neon é responsável pela comunicação HTTP com o banco

import { neon } from '@neondatabase/serverless';
import { config as carregarDotenv } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';
export { productVariantTable } from './table/products/product-variants';
export { productTable } from './table/products/products';

/**
 * Endpoint da branch `production`, fixo no código.
 * Ver `docs/ambientes-banco-e-scripts.md` e `scripts/lib/guarda-banco-local.ts`.
 */
const ENDPOINT_PRODUCAO = 'ep-proud-bonus-acy2bafx';

/**
 * Resolve a URL do banco distinguindo COMO ela chegou até aqui — é essa distinção que
 * impede um script local de falar com produção sem querer.
 *
 * Dois caminhos possíveis:
 *
 * 1. **Explícito** — `DATABASE_URL` já estava no ambiente antes deste módulo ser avaliado.
 *    É o que acontece na Vercel (variável da plataforma), no `npm run dev` (o Next carrega
 *    `.env.local` antes de qualquer módulo) e nos scripts lançados por
 *    `scripts/lib/executar-script-local.ts`. Alguém escolheu o destino de propósito, então
 *    é aceito como está.
 *
 * 2. **Implícito** — ninguém definiu nada e o `dotenv` precisou ler `.env`, que guarda a URL
 *    de produção. Foi exatamente por aqui que um seed local acabou consultando o banco
 *    principal. Neste caminho, apontar para produção é recusado.
 *
 * O antigo `import 'dotenv/config'` não permitia essa distinção: por ser içado, rodava antes
 * de qualquer instrução e apagava a diferença entre os dois casos.
 */
function resolverUrlDoBanco(): string {
  const urlExplicita = process.env.DATABASE_URL?.trim();

  if (urlExplicita) return urlExplicita;

  carregarDotenv();

  const urlImplicita = process.env.DATABASE_URL?.trim();

  if (!urlImplicita) {
    throw new Error(
      'DATABASE_URL não configurada. Para scripts locais use os comandos do package.json, que carregam `.env.desenvolvimento.local`.',
    );
  }

  const endpoint = (new URL(urlImplicita).hostname.split('.')[0] ?? '').replace(
    /-pooler$/,
    '',
  );

  if (endpoint === ENDPOINT_PRODUCAO) {
    throw new Error(
      'DESTINO RECUSADO: o processo caiu no `.env` (produção) sem ninguém escolher o destino. ' +
        'Rode scripts locais pelos comandos do package.json — eles usam a branch de desenvolvimento. ' +
        'Nenhuma consulta foi executada.',
    );
  }

  return urlImplicita;
}

// Cria o cliente de conexão com o banco
// O objeto de configuração com fetchOptions permite definir:
// - timeout: tempo máximo de espera para a conexão (30 segundos)
// - retry: tenta novamente se falhar
const sql = neon(resolverUrlDoBanco(), {
  fetchOptions: {
    // Timeout de 30 segundos para evitar o erro ETIMEDOUT
    // O banco Neon no plano free pode hibernar e demorar para responder
    timeout: 30000,
  }
});

// Exporta o drizzle com o cliente configurado e os schemas
export const db = drizzle(sql, {
    schema,
});