"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getProductsLoadMore } from "@/features/products/actions/get-products-load-more";

export function useProductsInfinite(initialPage: number = 1) {
  const [configuracao, setConfiguracao] = useState<{
    seed: string;
    pageSize: number;
  } | null>(null);

  useEffect(() => {
    const largura = window.innerWidth;
    const pageSize =
      largura >= 1280 ? 15 : largura >= 1024 ? 12 : largura >= 768 ? 9 : 6;
    const seed =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setConfiguracao({ seed, pageSize });
  }, []);

  const consulta = useInfiniteQuery({
    queryKey: [
      "products",
      "discovery",
      "load-more",
      configuracao?.seed,
      configuracao?.pageSize,
    ],
    queryFn: ({ pageParam = initialPage }) =>
      getProductsLoadMore(
        pageParam,
        configuracao?.seed ?? "",
        configuracao?.pageSize ?? 6,
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: initialPage,
    enabled: configuracao !== null,
  });

  return { ...consulta, configurando: configuracao === null };
}
