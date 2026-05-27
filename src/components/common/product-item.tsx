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
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const firstVariant =
    activeVariants.reduce<(typeof product.variants)[number] | undefined>(
      (lowestVariant, variant) =>
        !lowestVariant || variant.priceInCents < lowestVariant.priceInCents
          ? variant
          : lowestVariant,
      undefined,
    ) || product.variants[0];
  const productUrl =
    product.productKind === "variable"
      ? `/product/${product.slug}`
      : `/product-variant/${firstVariant?.id}`;

  // ✅ CORRETO: if ANTES do return
  if (!firstVariant) {
    return (
      <div className={cn("group mx-auto w-full max-w-xs", className)}>
        <div className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-100 p-8 text-center shadow-sm">
          <p className="text-gray-500">Variante não disponível</p>
        </div>
      </div>
    );
  }

  // ✅ AGORA SIM o return
  return (
    <div className={cn("group mx-auto w-full max-w-xs", className)}>
      <Link
        href={productUrl}
        className="block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
      >
        <div className="relative mx-auto h-64 w-64 overflow-hidden">
          <Image
            src={firstVariant?.imageUrl || "/placeholder-image.jpg"}
            alt={firstVariant?.name || "Produto sem nome"}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="w-full max-w-full min-w-0 overflow-hidden p-2 break-words">
          <p className="mb-2 truncate font-semibold break-words whitespace-normal text-gray-800">
            {product.name}
          </p>
          <p className="overflow-wrap-break-word mb-2 text-xs break-words whitespace-normal text-gray-500">
            {product.description}
          </p>
          {product.productKind === "variable" ? (
            <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
              A partir de
            </p>
          ) : null}
          <p className="text-lg font-bold break-words whitespace-normal text-gray-900">
            {formatCentsToBRL(firstVariant.priceInCents)}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductItem;
