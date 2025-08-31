
import { db } from "@/db";
import { productTable } from "@/db/schema";
import { desc } from "drizzle-orm";


/*interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
    variants: Array<{
        id: string;
        productId: string;
        color: string;
        size: string;
        stock: number;
        createdAt: Date;
        updatedAt: Date;
    }>;*/

export const getProductsWithVariants = async () => {
const products = await db.query.productTable.findMany({
    with: {
      variants: true,
    },
  });
    return products;

};


export const getNewlyCreatedProducts = async () => {
  const newlyCreatedProducts = await db.query.productTable.findMany({
    orderBy: [desc(productTable.createdAt)],
    with: {
      variants: true,
    },
  });
    return newlyCreatedProducts;
};