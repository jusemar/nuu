import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless'; // ← ADICIONAR ESTE IMPORT
import * as schema from './schema';
export { productTable } from './table/products/products';
export { productVariantTable } from './table/products/product-variants';


const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
    schema,
});