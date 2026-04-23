// src/db/connection.ts
// 
// Configuração da conexão com o banco de dados Neon (PostgreSQL)
// O cliente neon é responsável pela comunicação HTTP com o banco

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless'; 
import * as schema from './schema';
export { productTable } from './table/products/products';
export { productVariantTable } from './table/products/product-variants';

// Cria o cliente de conexão com o banco
// O objeto de configuração com fetchOptions permite definir:
// - timeout: tempo máximo de espera para a conexão (30 segundos)
// - retry: tenta novamente se falhar
const sql = neon(process.env.DATABASE_URL!, {
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