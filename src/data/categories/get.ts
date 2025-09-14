import { db } from "@/db";
import "server-only"

export  const getCategories = async () => {
    const categories = await db.query.categoryTable.findMany({});
    return categories;

};