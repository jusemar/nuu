const FERRAMENTAS_PROIBIDAS =
  /(criar|alterar|cancelar|confirmar|pagar|enviar|disparar|whatsapp|pedido|estoque|preco|promo[cç][aã]o|write|update|delete)/i;

export function validarEfeitoRealProibido(dados: {
  efeitosEsperados: string;
  ferramentasPermitidas: string[];
}) {
  if (dados.efeitosEsperados !== "nenhum")
    throw new Error("EFEITO_REAL_PROIBIDO");
  if (
    dados.ferramentasPermitidas.some((nome) => FERRAMENTAS_PROIBIDAS.test(nome))
  )
    throw new Error("FERRAMENTA_DE_ESCRITA_PROIBIDA");
}
