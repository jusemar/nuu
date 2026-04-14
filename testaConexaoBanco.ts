import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function testConnection() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT 1 as connected`;
    console.log("✅ Banco conectado com sucesso!", result);
  } catch (error) {
    console.error("❌ Falha na conexão:", error);
  }
}

testConnection();