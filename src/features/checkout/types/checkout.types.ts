import type { ItemCarrinho } from "@/features/carrinho";
import type {
  GrupoLogistico,
  ItemAgrupavelLogisticamente,
} from "@/features/logistica/types/grupos-logisticos";
// Tipos puros, sem `server-only`: podem ser importados por componente client sem risco.
import type {
  FormaPagamentoNaEntrega,
  MotivoPagamentoNaEntrega,
} from "@/features/pagamento-na-entrega";
import type { ParcelamentoCartaoCalculado } from "@/features/precificacao/client";

export type DadosIdentificacaoCheckout = {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
};

export type DadosEnderecoCheckout = {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacao?: string;
};

export type DadosCheckoutVisitante = DadosIdentificacaoCheckout &
  DadosEnderecoCheckout & {
    cupom?: string;
    formaPagamento: "pix" | "cartao";
    parcelasCartao?: number;
    itens: ItemCarrinho[];
  };

export type TotaisCheckout = {
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
};

export type OpcaoEntregaCheckout = {
  identificador: string;
  nome: string;
  descricao: string | null;
  prazoMinimoEmDiasUteis: number | null;
  prazoMaximoEmDiasUteis: number | null;
  valorEmCentavos: number;
  tipo: "entrega" | "retirada";
  provedor: string;
  servico: string;
  transportadora: string | null;
  metadadosRelevantes: Record<string, unknown> | null;
};

export type CotacaoEntregaGrupoCheckout = {
  chaveGrupo: string;
  cepOrigem: string;
  opcoes: OpcaoEntregaCheckout[];
  mensagemErro: string | null;
};

export type SelecaoEntregaGrupoCheckout = OpcaoEntregaCheckout & {
  chaveGrupo: string;
  cep: string;
};

export type ItemResumoCheckout = ItemAgrupavelLogisticamente & {
  id: string;
  produtoId: string;
  categoriaId: string | null;
  produtoVarianteId?: string;
  nome: string;
  sku?: string | null;
  atributosVariante?: Record<string, string>;
  imagemUrl: string;
  quantidade: number;
  modalidade: string;
  prazoModalidade: string;
  modalidadeDetalhes: {
    tipo: string;
    titulo: string;
    badge: string;
    badgeBg: string;
    badgeColor: string;
    icone: string;
    precoBaseEmCentavos: number;
    precoBase: string;
    possuiPromocao: boolean;
    precoPromocionalEmCentavos: number | null;
    precoPromocional: string | null;
    tipoPromocao: string | null;
    promocaoTerminaEm: Date | null;
    duracaoPromocao: number | null;
    unidadeDuracaoPromocao: string | null;
    precoPrincipal: boolean;
    ativo: boolean;
    garantia: string;
    origemEnvio: string;
  };
  frete: {
    id: string;
    nome: string;
    prazo: string;
    valorEmCentavos: number;
    cep?: string;
  };
  pix: {
    ativo: boolean;
    valorEmCentavos: number;
    valor: string;
  };
  cartao: {
    ativo: boolean;
    valorEmCentavos: number;
    valor: string;
    parcelamentos: ParcelamentoCartaoCalculado[];
  };
};

export type ResumoCheckoutCalculado = {
  itens: ItemResumoCheckout[];
  gruposLogisticos: GrupoLogistico<ItemResumoCheckout>[];
  cotacoesEntrega: CotacaoEntregaGrupoCheckout[];
  pagamentos: {
    pix: {
      ativo: boolean;
      totalEmCentavos: number;
      total: string;
      economiaEmCentavos: number;
    };
    cartao: {
      ativo: boolean;
      totalEmCentavos: number;
      total: string;
      parcelamentos: ParcelamentoCartaoCalculado[];
    };
    /**
     * Pagamento na entrega.
     *
     * Diferente de PIX e cartão, `ativo` aqui não é uma configuração: é o resultado do
     * motor de elegibilidade, que depende do produto, do serviço de entrega, do valor e
     * do endereço. Por isso vem acompanhado dos motivos — a interface precisa conseguir
     * dizer POR QUE não está disponível.
     *
     * `exigeRevalidacao` é sempre verdadeiro aqui: este resumo é exibição. A decisão que
     * autoriza o pedido é refeita no servidor, na transação de criação, a partir do
     * snapshot de frete — nunca a partir do carrinho, que o usuário consegue editar.
     */
    naEntrega: {
      ativo: boolean;
      totalEmCentavos: number;
      total: string;
      formasPermitidas: FormaPagamentoNaEntrega[];
      motivos: MotivoPagamentoNaEntrega[];
      observacoesCliente: string | null;
      exigeTroco: boolean;
      exigeRevalidacao: boolean;
    };
  };
  totaisPorFormaPagamento: {
    pix: TotaisCheckout;
    cartao: TotaisCheckout;
    /**
     * Base de valor igual à do PIX: pagar na entrega não tem acréscimo de gateway.
     *
     * A chave existe desde já para que, quando o Bloco 7 ampliar `formaPagamento`, o
     * acesso dinâmico `totaisPorFormaPagamento[formaPagamento]` não devolva `undefined`
     * em tempo de execução.
     */
    naEntrega: TotaisCheckout;
  };
};
