import { gerarMatrizFreteMerchant } from "@/features/merchant-center/queries/matriz-frete/gerar-matriz-frete-merchant";

function lerInteiro(
  nome: string,
  padrao: number,
  minimo: number,
  maximo: number,
) {
  const prefixo = `--${nome}=`;
  const argumento = process.argv.find((item) => item.startsWith(prefixo));
  if (!argumento) return padrao;
  const valor = Number(argumento.slice(prefixo.length));
  if (!Number.isInteger(valor) || valor < minimo || valor > maximo) {
    throw new Error(`${nome} deve ser inteiro entre ${minimo} e ${maximo}.`);
  }
  return valor;
}

async function executar() {
  const opcoes = {
    maximoProdutos: lerInteiro("max-produtos", 50, 1, 500),
    maximoAlvos: lerInteiro("max-alvos", 10, 1, 100),
    concorrencia: lerInteiro("concorrencia", 2, 1, 4),
    intervaloEntreCotacoesMs: lerInteiro("intervalo-ms", 250, 100, 10_000),
  };

  const relatorio = await gerarMatrizFreteMerchant(opcoes);
  console.log(JSON.stringify(relatorio, null, 2));
}

/** O lançador oficial aguarda esta Promise antes de encerrar o processo. */
export const execucao = executar();
