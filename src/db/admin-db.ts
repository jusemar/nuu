// Criar src/db/admin-db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import * as adminSchema from './schema/admin-schema';

export const adminDb = drizzle(process.env.DATABASE_URL!, {
  schema: adminSchema
});