import { db } from "@/db"; // Seu db original que funciona
import { categoryTable } from "@/db/table/categories"; // Seu schema organizado

export async function POST(request: Request) {
  const data = await request.json();
  
  // Usa a mesma db, mas o schema organizado
  const newCategory = await db.insert(categoryTable).values(data);
  
  return Response.json(newCategory);
}