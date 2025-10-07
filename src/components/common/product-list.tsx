"use client";

import { productTable, productVariantTable } from "@/db/schema";

import ProductItem from "./product-item";
import SectionTitle from "@/components/common/section-title";

interface ProductListProps {
  products: (typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  })[];
}

const ProductList = ({ products }: ProductListProps) => {
  return (
    <div className="space-y-6">
      <div className="flex w-full gap-4 overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;