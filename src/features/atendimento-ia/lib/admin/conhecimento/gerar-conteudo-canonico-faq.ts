import { criarConteudoCanonicoPerguntaRespostaAdmin } from "../../../schemas/admin/pergunta-resposta.schema";
export function gerarConteudoCanonicoFaq(
  entrada: Parameters<typeof criarConteudoCanonicoPerguntaRespostaAdmin>[0],
) {
  const canonico = criarConteudoCanonicoPerguntaRespostaAdmin(entrada);
  return JSON.stringify(canonico);
}
