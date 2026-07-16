import { gerarSkuProduto } from "./gerar-sku-produto";

interface GerarSkuDisponivelInput {
  nomeCategoria?: string | null;
  nomeMarca?: string | null;
  skuExiste: (sku: string) => Promise<boolean>;
}

/** Reutiliza o gerador do formulário e repete somente em caso de colisão. */
export async function gerarSkuDisponivel({
  nomeCategoria,
  nomeMarca,
  skuExiste,
}: GerarSkuDisponivelInput) {
  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const sku = gerarSkuProduto({ nomeCategoria, nomeMarca });
    if (!(await skuExiste(sku))) return sku;
  }

  throw new Error("Não foi possível gerar um SKU interno único.");
}
