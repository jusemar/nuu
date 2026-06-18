import type {
  ErroImportacaoFornecedor,
  LinhaPlanilhaFornecedor,
  LinhaStagingFornecedorPreparada,
} from "../types/fornecedores.types";

function normalizarPreco(valor: string | null) {
  if (!valor) return null;

  const semMoeda = valor.replace(/\s/g, "").replace(/^R\$/i, "");
  const ultimoPonto = semMoeda.lastIndexOf(".");
  const ultimaVirgula = semMoeda.lastIndexOf(",");
  const temPonto = ultimoPonto >= 0;
  const temVirgula = ultimaVirgula >= 0;
  const separadorDecimal =
    temPonto && temVirgula
      ? ultimoPonto > ultimaVirgula
        ? "."
        : ","
      : temVirgula
        ? ","
        : ".";
  const normalizado =
    separadorDecimal === ","
      ? semMoeda.replace(/\./g, "").replace(",", ".")
      : semMoeda.replace(/,/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;

  return Number(normalizado).toFixed(2);
}

function normalizarEstoque(valor: string | null) {
  if (!valor) return null;
  const texto = valor.trim();
  const normalizado =
    /^\d{1,3}(,\d{3})+\.$/.test(texto) || /^\d{1,3}(,\d{3})+$/.test(texto)
      ? texto.replace(/,/g, "").replace(/\.$/, "")
      : texto.replace(",", ".");

  if (!/^\d+(\.0*)?$/.test(normalizado)) return null;

  return Number.parseInt(normalizado, 10);
}

export function prepararLinhaStagingFornecedor(
  linha: LinhaPlanilhaFornecedor,
): LinhaStagingFornecedorPreparada {
  const erros: ErroImportacaoFornecedor[] = [];

  if (linha.linhaVazia) {
    erros.push({
      codigo: "linha_vazia",
      mensagem: "Linha vazia.",
      campo: "linha",
    });
  }

  if (!linha.nomeProduto && !linha.linhaVazia) {
    erros.push({
      codigo: "produto_sem_nome",
      mensagem: "Produto sem nome.",
      campo: "nomeProduto",
    });
  }

  if (!linha.codigoFornecedor && !linha.linhaVazia) {
    erros.push({
      codigo: "produto_sem_codigo",
      mensagem: "Produto sem código do fornecedor.",
      campo: "codigoFornecedor",
    });
  }

  const precoFornecedor = normalizarPreco(linha.precoFornecedorOriginal);
  if (linha.precoFornecedorOriginal && !precoFornecedor) {
    erros.push({
      codigo: "preco_invalido",
      mensagem: "Preço inválido.",
      campo: "precoFornecedor",
    });
  }

  const estoqueFornecedor = normalizarEstoque(linha.estoqueFornecedorOriginal);
  if (linha.estoqueFornecedorOriginal && estoqueFornecedor === null) {
    erros.push({
      codigo: "estoque_invalido",
      mensagem: "Estoque inválido.",
      campo: "estoqueFornecedor",
    });
  }

  return {
    numeroLinha: linha.numeroLinha,
    codigoFornecedor: linha.codigoFornecedor,
    nomeProduto: linha.nomeProduto,
    categoriaFornecedor: linha.categoriaFornecedor,
    marcaFornecedor: linha.marcaFornecedor,
    precoFornecedor,
    estoqueFornecedor,
    status: erros.length > 0 ? "erro" : "aguardando_analise",
    errosValidacao: erros,
    dadosBrutos: linha.dadosBrutos,
  };
}
