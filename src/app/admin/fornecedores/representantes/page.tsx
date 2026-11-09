import { ErroAutorizacaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/erros-autorizacao-admin";
import { GestaoRepresentantes } from "@/features/fornecedores/components/admin/representantes/gestao-representantes";
import { listarGestaoRepresentantes } from "@/features/fornecedores/queries/representantes/listar-gestao-representantes";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    fornecedor?: string;
    representante?: string;
    pagina?: string;
  }>;
}) {
  const filtros = await searchParams;
  let dados;
  try {
    dados = await listarGestaoRepresentantes(
      filtros.fornecedor,
      filtros.representante,
      Number(filtros.pagina ?? 1),
    );
  } catch (erro) {
    if (erro instanceof ErroAutorizacaoAdmin)
      return (
        <main className="p-6">
          <h1 className="text-xl font-semibold">Área restrita</h1>
          <p role="alert">Esta conta não pode gerenciar representantes.</p>
        </main>
      );
    throw erro;
  }
  return <GestaoRepresentantes dados={dados} />;
}
