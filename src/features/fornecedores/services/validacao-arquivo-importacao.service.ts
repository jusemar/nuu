import { arquivoImportacaoFornecedorSchema } from "../schemas/fornecedores.schema";

export function validarArquivoImportacaoFornecedor(arquivo: File) {
  const nome = arquivo.name;
  const extensao = nome.split(".").pop()?.toLowerCase();

  return arquivoImportacaoFornecedorSchema.parse({
    nome,
    tamanho: arquivo.size,
    extensao,
  });
}
