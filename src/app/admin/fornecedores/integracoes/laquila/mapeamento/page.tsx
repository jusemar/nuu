import { PaginaMapeamentoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { listarOpcoesMapeamentoFornecedor } from "@/features/fornecedores/queries";

async function listarOpcoesMapeamentoLaquilaComFallback() {
  try {
    return await listarOpcoesMapeamentoFornecedor();
  } catch (erro) {
    console.error(
      "Não foi possível carregar opções reais para o mapeamento Laquila.",
      erro,
    );

    return {
      categoriasLoja: [],
      marcasLoja: [],
    };
  }
}

export default async function Page() {
  const opcoesMapeamento = await listarOpcoesMapeamentoLaquilaComFallback();

  return (
    <PaginaMapeamentoLaquilaAdmin
      categoriasLoja={opcoesMapeamento.categoriasLoja}
      marcasLoja={opcoesMapeamento.marcasLoja}
    />
  );
}
