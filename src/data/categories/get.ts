// src/data/categories/get.ts
import { db } from "@/db";
import { categoryTable } from "@/db/table"; // ou de onde estiver
import "server-only"

export const getCategories = async () => {
    try {
        const categories = await db.select().from(categoryTable);
        return categories;
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        return [];
    }
};