import { gerarFeedProdutosMerchant } from "@/features/merchant-center/queries/gerar-feed-produtos-merchant";

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = await gerarFeedProdutosMerchant();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
