import Image from "next/image";
import Link from "next/link";

import { productTable, productVariantTable } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";
import { cn } from "@/lib/utils";

interface ProductItemProps {
  product: typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  };
  className?: string;
}

const ProductItem = ({ product, className }: ProductItemProps) => {
  const firstVariant = product.variants[0];
  
  return (
    <div className={cn("group w-full max-w-xs mx-auto", className)}>
      <Link
        href={`/product-variant/${firstVariant.slug}`}
        className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg"
      >
        <div className="relative mx-auto w-64 h-64 overflow-hidden">
          <Image
            src={firstVariant.imageUrl}
            alt={firstVariant.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300" // object-contain mantém a proporção sem cortar
          />
        </div>
        <div className="p-2 w-full max-w-full min-w-0 break-words overflow-hidden">
  <p className="font-semibold text-gray-800 truncate mb-2 break-words whitespace-normal">{product.name}</p>
  <p className="text-gray-500 text-xs mb-2 break-words whitespace-normal overflow-wrap-break-word">{product.description}</p>
  <p className="font-bold text-lg text-gray-900 break-words whitespace-normal">{formatCentsToBRL(firstVariant.priceInCents)}</p>
</div>
      
      </Link>
    </div>
  );
};

export default ProductItem;