import type {
  EntradaConsistenciaTrocoPedido,
  ProblemaTrocoPedido,
  ResultadoConsistenciaTrocoPedido,
} from "../types/pagamento-na-entrega.types";

const MENSAGEM_PROBLEMA_TROCO: Record<
  ProblemaTrocoPedido["codigo"],
  string
> = {
  "troco-para-forma-nao-dinheiro":
    "Troco só faz sentido em pagamento com dinheiro.",
  "troco-informado-sem-necessidade":
    "Foi informado um valor de troco, mas o pedido não pediu troco.",
  "troco-ausente":
    "O pedido pediu troco, mas não informou para qual valor.",
  "troco-menor-que-total":
    "O valor informado para troco é menor que o total do pedido.",
  "total-do-pedido-divergente":
    "O total do pedido mudou depois que o troco foi combinado com o cliente.",
};

/**
 * Confere se o troco declarado por um pedido continua fazendo sentido.
 *
 * Por que isso precisa existir? Porque `trocoParaEmCentavos` é a única informação desse
 * fluxo que vem do cliente ("vou pagar com uma nota de R$ 200"). Tudo mais é calculado no
 * servidor. Um número vindo de fora nunca é confiável sozinho, e ainda por cima ele é
 * combinado no momento do pedido mas usado dias depois, na porta do cliente — tempo
 * suficiente para o total mudar por baixo.
 *
 * Função pura: não lê banco nem relógio, só compara os números que recebe. Serve tanto na
 * criação do pedido quanto na tela do admin, com a mesma regra.
 */
export function avaliarConsistenciaTrocoPedido(
  entrada: EntradaConsistenciaTrocoPedido,
): ResultadoConsistenciaTrocoPedido {
  const problemas: ProblemaTrocoPedido[] = [];

  const registrar = (codigo: ProblemaTrocoPedido["codigo"]) => {
    problemas.push({ codigo, mensagem: MENSAGEM_PROBLEMA_TROCO[codigo] });
  };

  const ehDinheiro = entrada.formaEscolhida === "dinheiro";

  // Invariante 1: maquininha e PIX não têm troco. Se veio troco em forma que não é
  // dinheiro, alguém montou o pedido errado.
  if (!ehDinheiro && (entrada.precisaTroco || entrada.trocoParaEmCentavos !== null)) {
    registrar("troco-para-forma-nao-dinheiro");
  }

  // Invariante 2: `precisaTroco === false` implica troco nulo. O cliente disse que leva o
  // valor exato; um número aqui contradiz isso.
  if (ehDinheiro && !entrada.precisaTroco && entrada.trocoParaEmCentavos !== null) {
    registrar("troco-informado-sem-necessidade");
  }

  // Invariante 3: pediu troco, tem que dizer para quanto — senão o entregador sai sem saber
  // quanto levar em espécie.
  if (ehDinheiro && entrada.precisaTroco && entrada.trocoParaEmCentavos === null) {
    registrar("troco-ausente");
  }

  // Invariante 4: não se paga R$ 100 numa conta de R$ 150.
  const trocoDeclarado =
    ehDinheiro && entrada.precisaTroco ? entrada.trocoParaEmCentavos : null;

  if (
    trocoDeclarado !== null &&
    trocoDeclarado < entrada.valorAReceberEmCentavos
  ) {
    registrar("troco-menor-que-total");
  }

  // Comparação com o total atual: o valor a receber foi congelado na criação do pedido. Se
  // o total mudou depois (item removido, desconto aplicado no admin), quem for entregar
  // precisa ser avisado antes de cobrar o valor errado.
  const divergenciaDeTotalEmCentavos =
    entrada.totalAtualDoPedidoEmCentavos === null
      ? null
      : entrada.totalAtualDoPedidoEmCentavos - entrada.valorAReceberEmCentavos;

  if (divergenciaDeTotalEmCentavos !== null && divergenciaDeTotalEmCentavos !== 0) {
    registrar("total-do-pedido-divergente");
  }

  // Quanto o entregador devolve. Calculado sobre o valor congelado, que é o que foi
  // combinado — e não sobre o total atual, que pode ter mudado sem o cliente saber.
  const trocoADevolverEmCentavos =
    trocoDeclarado === null
      ? null
      : Math.max(trocoDeclarado - entrada.valorAReceberEmCentavos, 0);

  return {
    consistente: problemas.length === 0,
    problemas,
    divergenciaDeTotalEmCentavos,
    trocoADevolverEmCentavos,
  };
}
