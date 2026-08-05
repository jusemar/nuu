import {
  MENSAGEM_MOTIVO_PAGAMENTO_NA_ENTREGA,
  MODALIDADES_COMERCIAIS_SUPORTADAS_PADRAO,
  ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA,
  PROVEDOR_ENTREGA_PROPRIA,
} from "../constants/pagamento-na-entrega.constants";
import type {
  CodigoMotivoPagamentoNaEntrega,
  ConfiguracaoPagamentoNaEntregaServico,
  EntradaAvaliacaoPagamentoNaEntrega,
  FormaPagamentoNaEntrega,
  ItemAvaliacaoPagamentoNaEntrega,
  ModalidadeComercialCanonica,
  MotivoPagamentoNaEntrega,
  ResultadoAvaliacaoPagamentoNaEntrega,
  ServicoAvaliadoPagamentoNaEntrega,
} from "../types/pagamento-na-entrega.types";
import { resolverFlagPagamentoNaEntregaItem } from "./resolver-flag-pagamento-na-entrega-item";

/**
 * Remove tudo que não é dígito de um CEP.
 *
 * `01234-567` e `01234567` são o mesmo CEP; comparar as strings cruas acusaria uma
 * divergência que não existe e bloquearia um pedido legítimo.
 */
function normalizarCep(cep: string | null): string | null {
  if (cep === null) return null;

  const apenasDigitos = cep.replace(/\D/g, "");

  return apenasDigitos.length > 0 ? apenasDigitos : null;
}

/**
 * Acumulador da avaliação.
 *
 * O motor percorre as regras em ordem e vai anotando aqui o que descobriu. Manter o estado
 * num objeto local (e não em variáveis soltas) deixa explícito que nada escapa da função —
 * é o que garante a pureza: mesma entrada, mesma saída, sempre.
 */
type EstadoAvaliacao = {
  motivos: MotivoPagamentoNaEntrega[];
  /** Vira `true` no primeiro motivo que impede o pedido inteiro. */
  bloqueado: boolean;
};

function registrarMotivo(
  estado: EstadoAvaliacao,
  codigo: CodigoMotivoPagamentoNaEntrega,
  extras: Omit<MotivoPagamentoNaEntrega, "codigo" | "mensagem" | "escopo"> & {
    escopo: MotivoPagamentoNaEntrega["escopo"];
  },
) {
  estado.motivos.push({
    codigo,
    mensagem: MENSAGEM_MOTIVO_PAGAMENTO_NA_ENTREGA[codigo],
    ...extras,
  });

  // Motivo de escopo "forma" derruba só aquela forma de pagamento; o pedido segue vivo
  // se sobrar outra. Qualquer outro escopo bloqueia o pedido inteiro.
  if (extras.escopo !== "forma") estado.bloqueado = true;
}

/**
 * Descobre o serviço de frete único do pedido.
 *
 * Pagamento na entrega é tudo-ou-nada: ou o pedido inteiro sai pelo mesmo serviço de
 * entrega própria, ou não vale. Misturar um item da Frenet com um da entrega própria
 * criaria duas entregas, e não existe "meio pagamento na entrega" — o entregador da loja
 * não tem como receber pela parte que a transportadora levou.
 */
function resolverServicoUnicoDoPedido(
  itens: ItemAvaliacaoPagamentoNaEntrega[],
  estado: EstadoAvaliacao,
): string | null {
  const servicosEncontrados = new Set<string>();

  for (const item of itens) {
    if (item.frete === null) {
      registrarMotivo(estado, "frete-nao-escolhido", {
        escopo: "item",
        itemCarrinhoId: item.itemCarrinhoId,
        produtoId: item.produtoId,
      });
      continue;
    }

    // Retirada e transportadora caem aqui. A checagem é pelo provedor, e não pelo nome do
    // serviço, porque o provedor é o dado estável: serviços novos da Frenet aparecem sem
    // aviso, mas todos continuam sob o provedor `frenet`.
    if (item.frete.provedor !== PROVEDOR_ENTREGA_PROPRIA) {
      registrarMotivo(estado, "servico-entrega-nao-suportado", {
        escopo: "item",
        itemCarrinhoId: item.itemCarrinhoId,
        produtoId: item.produtoId,
      });
      continue;
    }

    servicosEncontrados.add(item.frete.servico);
  }

  if (servicosEncontrados.size > 1) {
    registrarMotivo(estado, "carrinho-com-fretes-divergentes", {
      escopo: "pedido",
    });
    return null;
  }

  const [servicoUnico] = [...servicosEncontrados];

  return servicoUnico ?? null;
}

/** Monta a lista de formas que a configuração do serviço deixa ligadas. */
function listarFormasHabilitadas(
  configuracao: ConfiguracaoPagamentoNaEntregaServico,
): FormaPagamentoNaEntrega[] {
  const habilitadaPorForma: Record<FormaPagamentoNaEntrega, boolean> = {
    dinheiro: configuracao.aceitaDinheiro,
    pix_na_entrega: configuracao.aceitaPixNaEntrega,
    debito_entrega: configuracao.aceitaDebito,
    credito_entrega: configuracao.aceitaCredito,
  };

  // Percorre a ordem fixa em vez das chaves do objeto: assim a lista sai sempre na mesma
  // sequência, o que mantém a interface estável e o snapshot do pedido comparável.
  return ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA.filter(
    (forma) => habilitadaPorForma[forma],
  );
}

/**
 * Motor de elegibilidade de Pagamento na Entrega.
 *
 * Função pura: sem banco, sem rede, sem React, sem relógio. Recebe tudo já carregado e
 * devolve a decisão junto com a justificativa completa. É essa pureza que permite usar o
 * mesmo código na página de produto, no carrinho e no checkout sem duplicar regra, e
 * testá-lo inteiro sem subir banco.
 *
 * A ordem das regras não é arbitrária: vai do mais geral para o mais específico, para que
 * o primeiro motivo relatado seja sempre o mais explicativo. Não adianta dizer ao cliente
 * que faltam R$ 3 para o mínimo se a loja inteira está com a funcionalidade desligada.
 */
export function avaliarElegibilidadePagamentoNaEntrega(
  entrada: EntradaAvaliacaoPagamentoNaEntrega,
): ResultadoAvaliacaoPagamentoNaEntrega {
  const modalidadesSuportadas = [
    ...(entrada.modalidadesComerciaisSuportadas ??
      MODALIDADES_COMERCIAIS_SUPORTADAS_PADRAO),
  ] as ModalidadeComercialCanonica[];

  const estado: EstadoAvaliacao = { motivos: [], bloqueado: false };
  const cepAvaliado = normalizarCep(entrada.cepEntrega);

  // A decisão só é final quando existem total oficial E endereço. Sem isso a resposta é
  // uma prévia: serve para exibir um selo, nunca para autorizar um pedido.
  const decisaoParcial =
    entrada.totalPedidoEmCentavos === null || cepAvaliado === null;

  let servico: ServicoAvaliadoPagamentoNaEntrega | null = null;
  let configuracao: ConfiguracaoPagamentoNaEntregaServico | null = null;
  let formasPermitidas: FormaPagamentoNaEntrega[] = [];

  const montarResultado = (): ResultadoAvaliacaoPagamentoNaEntrega => ({
    versao: "1",
    elegivel:
      !estado.bloqueado && !decisaoParcial && formasPermitidas.length > 0,
    decisaoParcial,
    formasPermitidas,
    motivos: estado.motivos,
    servico,
    regrasAplicadas:
      configuracao === null
        ? null
        : {
            configuracaoId: configuracao.id,
            valorMinimoEmCentavos: configuracao.valorMinimoPedidoEmCentavos,
            valorMaximoEmCentavos: configuracao.valorMaximoPedidoEmCentavos,
            valorMaximoDinheiroEmCentavos:
              configuracao.valorMaximoDinheiroEmCentavos,
            exigeTroco: configuracao.exigeTroco,
            observacoesCliente: configuracao.observacoesCliente,
            modalidadesSuportadas,
            configuracaoAtualizadaEm: configuracao.atualizadoEm,
          },
    limites: {
      valorMinimoEmCentavos: configuracao?.valorMinimoPedidoEmCentavos ?? null,
      valorMaximoEmCentavos: configuracao?.valorMaximoPedidoEmCentavos ?? null,
      valorMaximoDinheiroEmCentavos:
        configuracao?.valorMaximoDinheiroEmCentavos ?? null,
      exigeTroco: configuracao?.exigeTroco ?? false,
    },
    // Fora do checkout, ou sempre que faltou contexto, a decisão precisa ser refeita antes
    // de virar pedido. É a trava que impede o resumo exibido na tela de virar autorização.
    exigeRevalidacao: entrada.contexto !== "checkout" || decisaoParcial,
    totalAvaliadoEmCentavos: entrada.totalPedidoEmCentavos,
    cepAvaliado,
    avaliadoEm: entrada.avaliadoEm,
  });

  // ============================================
  // 1. Kill-switch global
  // ============================================
  if (!entrada.configuracaoGlobalAtiva) {
    registrarMotivo(estado, "configuracao-global-desativada", {
      escopo: "pedido",
    });
    return montarResultado();
  }

  // ============================================
  // 2. Carrinho vazio
  // ============================================
  if (entrada.itens.length === 0) {
    registrarMotivo(estado, "carrinho-vazio", { escopo: "pedido" });
    return montarResultado();
  }

  // ============================================
  // 3. Serviço único do pedido (tudo-ou-nada)
  // ============================================
  const servicoIdentificador = resolverServicoUnicoDoPedido(
    entrada.itens,
    estado,
  );

  if (servicoIdentificador === null) return montarResultado();

  // ============================================
  // 4. Configuração desse serviço
  // ============================================
  const configuracaoEncontrada =
    entrada.configuracoesPorServico.find(
      (item) => item.servicoIdentificador === servicoIdentificador,
    ) ?? null;

  // Ausência de configuração é bloqueio, nunca permissão. É o opt-in valendo também aqui:
  // um serviço só aceita pagamento na entrega depois que alguém configurou de propósito.
  if (configuracaoEncontrada === null) {
    registrarMotivo(estado, "servico-sem-configuracao", { escopo: "pedido" });
    return montarResultado();
  }

  configuracao = configuracaoEncontrada;
  servico = {
    servicoFreteId: configuracaoEncontrada.servicoFreteId,
    identificador: configuracaoEncontrada.servicoIdentificador,
    nome: configuracaoEncontrada.servicoNome,
  };

  if (!configuracaoEncontrada.servicoAtivo) {
    registrarMotivo(estado, "servico-inativo", { escopo: "pedido" });
    return montarResultado();
  }

  if (
    !configuracaoEncontrada.ativo ||
    !configuracaoEncontrada.aceitaPagamentoNaEntrega
  ) {
    registrarMotivo(estado, "servico-com-pagamento-desativado", {
      escopo: "pedido",
    });
    return montarResultado();
  }

  // ============================================
  // 5 e 6. Opt-in e modalidade, item a item
  // ============================================
  // Percorre todos os itens em vez de parar no primeiro problema: a interface precisa
  // conseguir apontar exatamente quais produtos impedem o pagamento na entrega.
  for (const item of entrada.itens) {
    if (!resolverFlagPagamentoNaEntregaItem(item)) {
      registrarMotivo(estado, "produto-nao-habilitado", {
        escopo: "item",
        itemCarrinhoId: item.itemCarrinhoId,
        produtoId: item.produtoId,
      });
    }

    const modalidadeSuportada =
      item.modalidadeComercial !== null &&
      modalidadesSuportadas.includes(
        item.modalidadeComercial as ModalidadeComercialCanonica,
      );

    if (!modalidadeSuportada) {
      registrarMotivo(estado, "modalidade-comercial-nao-suportada", {
        escopo: "item",
        itemCarrinhoId: item.itemCarrinhoId,
        produtoId: item.produtoId,
      });
    }
  }

  if (estado.bloqueado) return montarResultado();

  // ============================================
  // 7. Formas habilitadas no serviço
  // ============================================
  formasPermitidas = listarFormasHabilitadas(configuracaoEncontrada);

  if (formasPermitidas.length === 0) {
    registrarMotivo(estado, "nenhuma-forma-habilitada", { escopo: "pedido" });
    return montarResultado();
  }

  // ============================================
  // 8 e 9. Faixa de valor e teto do dinheiro
  // ============================================
  const total = entrada.totalPedidoEmCentavos;

  if (total === null) {
    // Sem total não dá para conferir mínimo, máximo nem teto de dinheiro. A avaliação para
    // aqui como prévia: `formasPermitidas` já está preenchida, que é tudo o que o selo da
    // página de produto precisa ler.
    registrarMotivo(estado, "avaliacao-parcial-sem-total", { escopo: "pedido" });
    return montarResultado();
  }

  const { valorMinimoPedidoEmCentavos, valorMaximoPedidoEmCentavos } =
    configuracaoEncontrada;

  if (
    valorMinimoPedidoEmCentavos !== null &&
    total < valorMinimoPedidoEmCentavos
  ) {
    registrarMotivo(estado, "valor-abaixo-do-minimo", { escopo: "pedido" });
  }

  if (
    valorMaximoPedidoEmCentavos !== null &&
    total > valorMaximoPedidoEmCentavos
  ) {
    registrarMotivo(estado, "valor-acima-do-maximo", { escopo: "pedido" });
  }

  if (estado.bloqueado) return montarResultado();

  // O teto de dinheiro é diferente dos outros dois: ele não derruba o pedido, derruba
  // apenas a forma `dinheiro`. Existe porque dinheiro vivo tem um risco que maquininha não
  // tem — o entregador circula com o valor na rua.
  const { valorMaximoDinheiroEmCentavos } = configuracaoEncontrada;

  if (
    valorMaximoDinheiroEmCentavos !== null &&
    total > valorMaximoDinheiroEmCentavos &&
    formasPermitidas.includes("dinheiro")
  ) {
    formasPermitidas = formasPermitidas.filter(
      (forma) => forma !== "dinheiro",
    );

    registrarMotivo(estado, "valor-acima-do-limite-dinheiro", {
      escopo: "forma",
      forma: "dinheiro",
    });

    // Se dinheiro era a única forma ligada, o pedido fica sem nenhuma opção e aí sim
    // vira bloqueio.
    if (formasPermitidas.length === 0) {
      registrarMotivo(estado, "nenhuma-forma-habilitada", { escopo: "pedido" });
      return montarResultado();
    }
  }

  // ============================================
  // 10. Endereço
  // ============================================
  if (cepAvaliado === null) {
    // Só o checkout tem obrigação de ter endereço. Na PDP e no carrinho a ausência é
    // esperada e já está sinalizada por `decisaoParcial`.
    if (entrada.contexto === "checkout") {
      registrarMotivo(estado, "endereco-nao-informado", { escopo: "pedido" });
    }
    return montarResultado();
  }

  // O frete foi cotado para um CEP. Se o cliente trocou o endereço depois, o preço e a
  // área de atendimento podem não valer mais — e junto com eles a elegibilidade.
  const houveDivergenciaDeCep = entrada.itens.some((item) => {
    const cepCotado = normalizarCep(item.frete?.cepCotado ?? null);

    return cepCotado !== null && cepCotado !== cepAvaliado;
  });

  if (houveDivergenciaDeCep) {
    registrarMotivo(estado, "cep-divergente-do-frete", { escopo: "pedido" });
  }

  return montarResultado();
}
