import { redirecionarRepresentanteJaaa } from "@/features/fornecedores/queries/jaaa/redirecionar-atendimento-jaaa";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return redirecionarRepresentanteJaaa(request);
}
