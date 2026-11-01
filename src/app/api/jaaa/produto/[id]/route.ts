import { redirecionarProdutoJaaa } from "@/features/fornecedores/queries/jaaa/redirecionar-atendimento-jaaa";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return redirecionarProdutoJaaa(request, (await params).id);
}
