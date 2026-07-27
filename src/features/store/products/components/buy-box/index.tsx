// ==========================================
// COMPONENTE: BuyBox (VERSÃO ORIGINAL - FUNCIONANDO)
// ==========================================
// Responsabilidade: Caixa de compra com preço, frete, cupom e botões
// Recebe: Preços formatados em string (compatível com mock anterior)

"use client";

import {
  CircleAlert,
  CircleX,
  LockKeyhole,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { useContextoCepLogistica } from "@/features/logistica/components/store/contexto-cep-logistica-provider";
import { registrarCepClienteIdentificado } from "@/features/logistica/lib/cep-cliente";
import type { PrecoProdutoCalculado } from "@/features/precificacao/client";
import { IndicadorFreteGratisProgressivo } from "@/features/promocoes/components/store/indicador-frete-gratis-progressivo";

import type { ConsultaFreteResult } from "../../actions/consultarFreteAction";
import { consultarFreteAction } from "../../actions/consultarFreteAction";
import { montarFreteFrenetSelecionado } from "../../lib/frete/montar-frete-frenet-selecionado";
import type { PromocaoVisualPdp } from "../../lib/promocoes/formatar-promocao-preco-pdp";
import type { DisponibilidadeCompraPdp } from "../../lib/resolver-disponibilidade-compra-pdp";
import type { Modalidade } from "../../types/product.types";
import { formatCEP, isValidCEP } from "../../utils/formatters";
import {
  type BeneficioProdutoPdp,
  BeneficiosProdutoPdp,
  ItemBeneficioProdutoPdp,
} from "../beneficios-produto-pdp";
import {
  BannerPromocionalPrevisualizacao,
  ProgressoFretePrevisualizacao,
} from "../pre-visualizacao/destaques-compra-previsualizacao";

// ==========================================
// INTERFACE
// ==========================================
interface BuyBoxProps {
  productId: string;
  varianteIdSelecionada?: string | null;
  precoPix: string;
  precoNormal: string;
  precoParc: string;
  descontoPix: number;
  promocaoVisual?: PromocaoVisualPdp | null;
  disponibilidadeCompra: DisponibilidadeCompraPdp;
  precoCalculado?: PrecoProdutoCalculado | null;
  prazoEntrega: string;
  selectedVariantLabel?: string | null;

  onAddToCart: (
    quantidade: number,
    freteEscolhido?: {
      id: "retirada" | "entrega-propria" | "frenet";
      nome: string;
      prazo: string;
      valorEmCentavos: number;
      cep?: string;
      servico?: string;
    },
  ) => void;
  onComprarAgora: (
    quantidade: number,
    freteEscolhido?: {
      id: "retirada" | "entrega-propria" | "frenet";
      nome: string;
      prazo: string;
      valorEmCentavos: number;
      cep?: string;
      servico?: string;
    },
  ) => void;
  onShowPaymentOptions?: () => void;

  cupomAplicado?: { desconto: number; label: string; code: string } | null;
  onAplicarCupom?: (codigo: string) => void;
  onRemoverCupom?: () => void;

  // Retirada local (dados reais do admin)
  retiradaLocal?: {
    nome: string;
    prazo: string;
    mensagem: string | null;
  } | null;

  // Entrega Própria
  allowsOwnDelivery?: boolean;

  // Modalidades
  modalidades?: Array<{
    type: string;
    price: number;
    pricingModalDescription: string | null;
    deliveryDays: string | null;
    hasPromo: boolean;
    promoPrice: number | null;
    isActive: boolean;
  }>;
  modalidadeAtiva?: {
    type: string;
    price: number;
    pricingModalDescription: string | null;
    deliveryDays: string | null;
    hasPromo: boolean;
    promoPrice: number | null;
    isActive: boolean;
  } | null;
  onTrocarModalidade?: (tipo: Modalidade) => void;
  modoPreVisualizacao?: boolean;
  /** Autoriza os dados demonstrativos exclusivos do laboratório visual. */
  mostrarFreteDemonstrativo?: boolean;
  seletorModalidades?: ReactNode;
}

function PrevisaoEntregaPropriaPdp({
  resultado,
  fallback,
}: {
  resultado: ConsultaFreteResult | null;
  fallback: string;
}) {
  const promessa = resultado?.found ? resultado.promessaEntrega : null;

  return (
    <div className="text-text-hint text-[11px] leading-snug">
      <p>{promessa?.texto ?? fallback}</p>
      {promessa?.observacaoPagamento ? (
        <p className="mt-0.5">{promessa.observacaoPagamento}</p>
      ) : null}
    </div>
  );
}

function PrecoFretePromocionalPdp({
  valorEmCentavos,
  valorOriginalEmCentavos,
  freteGratisPromocionalAplicado,
  rotuloGratis = "GRÁTIS",
}: {
  valorEmCentavos: number;
  valorOriginalEmCentavos?: number | null;
  freteGratisPromocionalAplicado?: boolean | null;
  rotuloGratis?: string;
}) {
  if (freteGratisPromocionalAplicado) {
    return (
      <div className="text-right text-xs font-bold">
        {valorOriginalEmCentavos ? (
          <div className="text-text-hint text-[10px] line-through">
            R$ {(valorOriginalEmCentavos / 100).toFixed(2).replace(".", ",")}
          </div>
        ) : null}
        <div className="text-success">{rotuloGratis}</div>
      </div>
    );
  }

  return (
    <div className="text-text-primary text-right text-xs font-bold">
      R$ {(valorEmCentavos / 100).toFixed(2).replace(".", ",")}
    </div>
  );
}

function formatarValorEmCentavos(valorEmCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

// ==========================================
// COMPONENTE
// ==========================================
export function BuyBox({
  productId,
  varianteIdSelecionada,
  precoPix,
  precoNormal,
  precoParc,
  descontoPix,
  promocaoVisual = null,
  disponibilidadeCompra,
  precoCalculado,
  prazoEntrega,
  selectedVariantLabel,
  onAddToCart,
  onComprarAgora,
  onShowPaymentOptions,
  cupomAplicado,
  onAplicarCupom,
  onRemoverCupom,
  retiradaLocal = null,
  allowsOwnDelivery = false,
  modalidadeAtiva,
  modoPreVisualizacao = false,
  mostrarFreteDemonstrativo = false,
  seletorModalidades,
}: BuyBoxProps) {
  const { cep: cepContextoLogistico } = useContextoCepLogistica();
  const compraDisponivel = disponibilidadeCompra.estado === "disponivel";
  const estoque = disponibilidadeCompra.estoqueMaximo;
  const textoDisponibilidade =
    disponibilidadeCompra.estado === "selecione_variante"
      ? "Selecione as opções do produto para continuar."
      : disponibilidadeCompra.estado === "indisponivel"
        ? disponibilidadeCompra.motivo
        : estoque === null
          ? "Disponível para compra"
          : estoque <= 10
            ? `Apenas ${estoque} unidades!`
            : `${estoque} unidades disponíveis`;
  const beneficioDisponibilidade: BeneficioProdutoPdp =
    disponibilidadeCompra.estado === "selecione_variante"
      ? { icone: CircleAlert, texto: textoDisponibilidade, variante: "atencao" }
      : disponibilidadeCompra.estado === "indisponivel"
        ? { icone: CircleX, texto: textoDisponibilidade, variante: "atencao" }
        : estoque !== null && estoque <= 10
          ? { icone: CircleAlert, texto: textoDisponibilidade, variante: "atencao" }
          : { icone: PackageCheck, texto: textoDisponibilidade, variante: "sucesso" };
  const beneficiosConfianca: BeneficioProdutoPdp[] = [
    { icone: RotateCcw, texto: "Devolução grátis em 30 dias" },
    { icone: ShieldCheck, texto: "Garantia de 12 meses" },
    { icone: LockKeyhole, texto: "Compra 100% segura" },
  ];
  const pixPrincipal = precoCalculado?.pix.ativo !== false;
  // ESTADOS
  const [quantidade, setQuantidade] = useState(1);
  const [cep, setCep] = useState("");
  const [cepConsultado, setCepConsultado] = useState(false);
  const [cepConsultadoLimpo, setCepConsultadoLimpo] = useState("");
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState<
    string | null
  >(null);
  const [entregaPropriaResult, setEntregaPropriaResult] =
    useState<ConsultaFreteResult | null>(null);
  const [consultandoFrete, setConsultandoFrete] = useState(false);
  const [inputCupom, setInputCupom] = useState("");
  const [mostrarInputCupom, setMostrarInputCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState("");
  const [erroFrete, setErroFrete] = useState("");
  const freteRef = useRef<HTMLDivElement | null>(null);
  const consultaFreteIdRef = useRef(0);
  const cepEditadoManualmenteRef = useRef(false);
  const consultaAutomaticaRef = useRef("");

  const precoPixEmCentavos = precoCalculado?.pix.valorEmCentavos;
  const precoNumerico =
    precoPixEmCentavos !== undefined && precoPixEmCentavos !== null
      ? precoPixEmCentavos / 100
      : null;
  const cepAtualLimpo = cep.replace(/\D/g, "");
  const resultadoDoCepAtual =
    cepConsultadoLimpo === cepAtualLimpo ? entregaPropriaResult : null;
  const enderecoConsultado = resultadoDoCepAtual?.endereco;
  const prazoEntregaPropria =
    resultadoDoCepAtual?.found && resultadoDoCepAtual.deliveryDeadline?.trim()
      ? resultadoDoCepAtual.deliveryDeadline.trim()
      : prazoEntrega || "Consulte prazo";
  const opcoesEntregaCotadas = resultadoDoCepAtual?.opcoesEntrega ?? [];
  const opcaoFrenetSelecionada =
    transportadoraSelecionada &&
    transportadoraSelecionada !== "retirada" &&
    transportadoraSelecionada !== "entrega-propria"
      ? opcoesEntregaCotadas.find(
          (opcao) => opcao.identificador === transportadoraSelecionada,
        )
      : null;
  const opcaoEntregaPropriaCotada = opcoesEntregaCotadas.find(
    (opcao) => opcao.provedor === "entrega-propria",
  );
  const resultadoEntregaPropriaEncontrado = resultadoDoCepAtual?.found
    ? resultadoDoCepAtual
    : null;
  // A resposta oficial de Entrega Própria pode trazer uma explicação além do
  // prazo. Quando ela existe, o card usa a linha inteira para preservar a
  // leitura, sem inferir o tamanho pelo número de caracteres.
  const descricaoComplementarEntregaPropria =
    resultadoEntregaPropriaEncontrado?.promessaEntrega?.observacaoPagamento?.trim() ||
    resultadoDoCepAtual?.message?.trim() ||
    null;
  const freteGratisProgressivoOficial =
    opcaoFrenetSelecionada?.freteGratisProgressivo ??
    opcaoEntregaPropriaCotada?.freteGratisProgressivo;

  // HANDLERS
  function aumentarQuantidade() {
    if (estoque === null || quantidade < estoque) setQuantidade((q) => q + 1);
  }

  function diminuirQuantidade() {
    if (quantidade > 1) setQuantidade((q) => q - 1);
  }

  function handleCepChange(valor: string) {
    cepEditadoManualmenteRef.current = true;
    const formatado = formatCEP(valor);
    setCep(formatado);
    setErroFrete("");
    setCepConsultado(false);
    setCepConsultadoLimpo("");
    setTransportadoraSelecionada(null);
    setEntregaPropriaResult(null);
    setConsultandoFrete(false);
    consultaFreteIdRef.current += 1;
  }

  async function consultarFrete(
    cepInformado = cep,
    registrarComoManual = true,
  ) {
    setErroFrete("");

    const cepFormatado = formatCEP(cepInformado);
    const cepParaConsulta = cepInformado.replace(/\D/g, "");

    if (isValidCEP(cepFormatado)) {
      const consultaId = consultaFreteIdRef.current + 1;
      consultaFreteIdRef.current = consultaId;
      setCepConsultado(true);
      setCepConsultadoLimpo(cepParaConsulta);
      setTransportadoraSelecionada(null);
      setEntregaPropriaResult(null);

      setConsultandoFrete(true);
      try {
        const result = await consultarFreteAction(
          productId,
          cepParaConsulta,
          varianteIdSelecionada,
          quantidade,
          modalidadeAtiva?.type ?? null,
        );
        if (consultaFreteIdRef.current !== consultaId) return;
        // O CEP foi efetivamente consultado. Cada card ainda valida produto,
        // cobertura, preço e região antes de exibir qualquer previsão.
        if (registrarComoManual) {
          registrarCepClienteIdentificado(cepParaConsulta);
        }
        setEntregaPropriaResult(result);
      } catch (error) {
        void error;
        if (consultaFreteIdRef.current !== consultaId) return;
        setEntregaPropriaResult({
          found: false,
          message: "Consulte o vendedor",
        });
      } finally {
        if (consultaFreteIdRef.current === consultaId) {
          setConsultandoFrete(false);
        }
      }
    }
  }

  useEffect(() => {
    if (cepEditadoManualmenteRef.current || cepContextoLogistico.length !== 8) {
      return;
    }

    const chaveConsulta = `${productId}:${varianteIdSelecionada ?? ""}:${cepContextoLogistico}`;
    if (consultaAutomaticaRef.current === chaveConsulta) return;
    consultaAutomaticaRef.current = chaveConsulta;
    setCep(formatCEP(cepContextoLogistico));
    void consultarFrete(cepContextoLogistico, false);
    // A função usa exclusivamente os valores representados na chave acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepContextoLogistico, productId, varianteIdSelecionada]);

  function handleAplicarCupom() {
    setErroCupom("");
    if (!inputCupom.trim()) return;
    if (onAplicarCupom) {
      onAplicarCupom(inputCupom.trim().toUpperCase());
    }
  }

  function handleRemoverCupom() {
    setInputCupom("");
    setErroCupom("");
    if (onRemoverCupom) onRemoverCupom();
  }

  function montarFreteEscolhido() {
    if (transportadoraSelecionada === "retirada" && retiradaLocal) {
      return {
        id: "retirada" as const,
        nome: retiradaLocal.nome,
        prazo: retiradaLocal.prazo,
        valorEmCentavos: 0,
        cep,
      };
    }

    if (
      transportadoraSelecionada === "entrega-propria" &&
      resultadoDoCepAtual?.found
    ) {
      return {
        id: "entrega-propria" as const,
        nome: "Entrega Própria",
        prazo: prazoEntregaPropria,
        valorEmCentavos: resultadoDoCepAtual.shippingPrice,
        cep,
      };
    }

    if (opcaoFrenetSelecionada) {
      return montarFreteFrenetSelecionado({
        opcao: opcaoFrenetSelecionada,
        cep,
      });
    }

    return undefined;
  }

  function destacarFrete(mensagem: string) {
    setErroFrete(mensagem);
    freteRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function executarComFreteValidado(
    acao: (
      quantidade: number,
      freteEscolhido?: {
        id: "retirada" | "entrega-propria" | "frenet";
        nome: string;
        prazo: string;
        valorEmCentavos: number;
        cep?: string;
        servico?: string;
      },
    ) => void,
  ) {
    const freteEscolhido = montarFreteEscolhido();

    if (!isValidCEP(cep)) {
      destacarFrete("Digite seu CEP para consultar as formas de entrega.");
      return;
    }

    if (!cepConsultado) {
      destacarFrete("Clique em OK para consultar as formas de entrega.");
      return;
    }

    if (!freteEscolhido) {
      destacarFrete("Selecione uma forma de entrega para continuar.");
      return;
    }

    setErroFrete("");
    acao(quantidade, freteEscolhido);
  }

  function adicionarAoCarrinhoComFrete() {
    executarComFreteValidado(onAddToCart);
  }

  function comprarAgoraComFrete() {
    executarComFreteValidado(onComprarAgora);
  }

  // RENDER
  return (
    <div
      className={
        modoPreVisualizacao
          ? "grid min-w-0 grid-cols-1 overflow-hidden rounded-3xl border border-border bg-card shadow-sm sm:grid-cols-[8.5rem_minmax(0,1fr)]"
          : "border-surface-border sticky top-20 flex flex-col gap-4 rounded-2xl border bg-white p-5"
      }
    >
      {/* PREÇO */}
      <div
        className={
          modoPreVisualizacao
            ? "bg-primary-light order-1 border-b border-primary/20 px-5 pt-5 pb-4 sm:col-span-2"
            : undefined
        }
      >
        {selectedVariantLabel ? (
          <div className="bg-primary-light text-primary mb-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold">
            {selectedVariantLabel}
          </div>
        ) : null}
        {promocaoVisual?.ativa ? (
          <div
            className={`mb-3 rounded-2xl border p-3 ${
              modoPreVisualizacao
                ? "border-accent-brand/30 bg-accent-brand-light"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${
                  modoPreVisualizacao
                    ? "bg-accent-brand text-foreground"
                    : "bg-emerald-600 text-white"
                }`}
              >
                Promoção
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                  modoPreVisualizacao
                    ? "bg-card text-accent-brand-dark"
                    : "bg-white text-emerald-700"
                }`}
              >
                {promocaoVisual.percentualOff}% OFF
              </span>
            </div>
            <div className="text-text-hint text-xs">
              De{" "}
              <span className="font-semibold line-through">
                {promocaoVisual.precoOriginalFormatado}
              </span>
            </div>
            <div
              className={`mt-0.5 text-[11px] font-semibold ${
                modoPreVisualizacao ? "text-accent-brand-dark" : "text-emerald-700"
              }`}
            >
              Economia de {promocaoVisual.economiaFormatada}
            </div>
          </div>
        ) : (
          <div className="text-text-hint mb-1.5 text-xs">
            De <span className="line-through">{precoNormal}</span> no cartão
          </div>
        )}

        <div
          className={`rounded-xl border ${modoPreVisualizacao ? "border-transparent bg-transparent py-1" : `p-3 ${pixPrincipal ? "bg-pix-bg border-pix-border" : "border-primary/25 bg-primary-light"}`}`}
        >
          <div
            className={`mb-1 text-[11px] font-bold tracking-wide uppercase ${pixPrincipal ? "text-success" : "text-primary"}`}
          >
            {pixPrincipal
              ? `PIX — ${descontoPix}% de desconto`
              : "Cartão de crédito"}
          </div>

          <div className="text-text-primary text-2xl font-extrabold tracking-tight">
            {pixPrincipal && cupomAplicado && precoNumerico !== null
              ? `R$ ${(precoNumerico * (1 - cupomAplicado.desconto / 100)).toFixed(2).replace(".", ",")}`
              : pixPrincipal
                ? precoCalculado?.pix.valor || precoPix
                : precoCalculado?.cartao.valor || precoNormal}
          </div>

          {!modoPreVisualizacao ? (
            <div className="text-pix-text mt-1 text-xs">
              {pixPrincipal
                ? "Preço final ao pagar com PIX"
                : "Condição principal disponível no cartão"}
            </div>
          ) : null}

          {pixPrincipal && cupomAplicado && (
            <div className="text-pix-text mt-0.5 text-[11px] font-bold">
              + cupom {cupomAplicado.code}: -{cupomAplicado.desconto}% adicional
            </div>
          )}
        </div>

        <div className="text-text-muted mt-2 text-xs">
          {pixPrincipal ? "ou " : ""}
          <strong className="text-text-primary">{precoParc}</strong>
        </div>

        {onShowPaymentOptions && (
          <button
            type="button"
            onClick={onShowPaymentOptions}
            className="text-primary mt-1 block text-left text-xs underline hover:no-underline"
          >
            Ver todas as formas de pagamento
          </button>
        )}
      </div>

      {seletorModalidades ? (
        <div
          className={
            modoPreVisualizacao
              ? "order-2 border-b border-border px-5 py-4 sm:col-span-2 [&_.bg-white]:bg-card"
              : "order-2"
          }
        >
          {seletorModalidades}
        </div>
      ) : null}

      <div
        className={`bg-surface-border h-px ${modoPreVisualizacao ? "hidden" : ""}`}
      />

      {/* QUANTIDADE */}
      <div
        className={
          modoPreVisualizacao
            ? "order-8 px-5 pt-3 sm:col-span-1 sm:pr-0"
            : undefined
        }
      >
        <div
          className={
            modoPreVisualizacao
              ? "border-border bg-card flex h-12 items-center rounded-full border shadow-xs"
              : "mb-2 flex items-center justify-between"
          }
        >
          <span className="text-text-primary text-xs font-semibold">
            <span className={modoPreVisualizacao ? "sr-only" : undefined}>
              Quantidade
            </span>
          </span>

          <div
            className={
              modoPreVisualizacao
                ? "flex items-center"
                : "flex items-center gap-2"
            }
          >
            <button
              className={
                modoPreVisualizacao
                  ? "text-muted-foreground hover:text-primary flex size-11 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-40"
                  : "border-surface-border hover:border-primary flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] bg-white text-lg transition-colors disabled:opacity-50"
              }
              onClick={diminuirQuantidade}
              disabled={quantidade <= 1}
            >
              −
            </button>

            <span className="min-w-[22px] text-center text-sm font-bold">
              {quantidade}
            </span>

            <button
              className={
                modoPreVisualizacao
                  ? "text-muted-foreground hover:text-primary flex size-11 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-40"
                  : "border-surface-border hover:border-primary flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] bg-white text-lg transition-colors disabled:opacity-50"
              }
              onClick={aumentarQuantidade}
              disabled={
                !compraDisponivel || (estoque !== null && quantidade >= estoque)
              }
            >
              +
            </button>
          </div>
        </div>

        {!modoPreVisualizacao ? (
          <div
            className={`text-[11px] font-semibold ${compraDisponivel ? "text-success" : "text-danger"}`}
          >
            {disponibilidadeCompra.estado === "selecione_variante"
              ? "Selecione as opções do produto para continuar."
              : disponibilidadeCompra.estado === "indisponivel"
                ? disponibilidadeCompra.motivo
                : estoque === null
                  ? "✓ Disponível para compra"
                  : estoque <= 10
                    ? `⚠️ Apenas ${estoque} unidades!`
                    : `✓ ${estoque} unidades disponíveis`}
          </div>
        ) : null}
      </div>

      {freteGratisProgressivoOficial ? (
        <div
          className={
            modoPreVisualizacao ? "order-3 px-5 pt-4 sm:col-span-2" : undefined
          }
        >
          <IndicadorFreteGratisProgressivo
            resultado={freteGratisProgressivoOficial}
            formatarPreco={formatarValorEmCentavos}
          />
        </div>
      ) : modoPreVisualizacao && mostrarFreteDemonstrativo ? (
        <ProgressoFretePrevisualizacao className="order-3 mx-5 mt-4 sm:col-span-2" />
      ) : null}

      {/* CEP */}
      <div
        ref={freteRef}
        className={`rounded-xl border bg-[#F9FAFB] p-3 transition-all ${modoPreVisualizacao ? "border-transparent bg-transparent order-4 mx-5 mb-1 p-0 pt-4 shadow-none sm:col-span-2" : ""} ${
          erroFrete
            ? "border-danger bg-red-50 ring-2 ring-red-100"
            : "border-surface-border"
        }`}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="text-text-primary text-[11px] font-bold tracking-wide uppercase">
              Calcular Frete
            </div>
            <p className="text-text-hint mt-0.5 text-[11px]">
              Digite o CEP e selecione a forma de entrega antes de continuar.
            </p>
          </div>
          {transportadoraSelecionada ? (
            <span className="bg-success-light text-success rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
              Selecionado
            </span>
          ) : null}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && consultarFrete()}
            maxLength={9}
            className={`border-surface-border focus:border-primary rounded-lg border-[1.5px] bg-white px-3 py-2 text-sm outline-none ${modoPreVisualizacao ? "min-w-0 flex-1" : "w-44"}`}
          />
          <button
            onClick={() => consultarFrete()}
            disabled={!isValidCEP(cep)}
            className="bg-primary hover:bg-primary-mid disabled:bg-surface-border disabled:text-text-hint rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed"
          >
            OK
          </button>
        </div>

        {cepConsultado &&
          (retiradaLocal ||
            allowsOwnDelivery ||
            consultandoFrete ||
            resultadoDoCepAtual) && (
            <div
              className={
                modoPreVisualizacao
                  ? "mt-3 grid animate-[fadeUp_0.3s_ease] grid-cols-1 gap-2 sm:grid-cols-2 sm:grid-flow-row-dense"
                  : "mt-2 flex animate-[fadeUp_0.3s_ease] flex-col gap-1"
              }
            >
              {enderecoConsultado ? (
                <div
                  className={`rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-950 ${
                    modoPreVisualizacao ? "sm:col-span-2" : ""
                  }`}
                >
                  <span className="font-bold">Enviar para:</span>
                  <div className="mt-0.5">
                    {enderecoConsultado.uf} - {enderecoConsultado.cidade},{" "}
                    {enderecoConsultado.bairro}
                    {enderecoConsultado.logradouro
                      ? `, ${enderecoConsultado.logradouro}`
                      : ""}
                  </div>
                </div>
              ) : null}

              {transportadoraSelecionada !== null ? (
                // Opção selecionada — mostra qual foi escolhida
                <div
                  className={modoPreVisualizacao ? "sm:col-span-2" : undefined}
                >
                  {transportadoraSelecionada === "retirada" ? (
                    <div className="border-primary bg-primary-light relative flex items-center gap-2 rounded-lg border-[1.5px] p-2.5">
                      <div className="text-text-primary flex-1 text-xs font-semibold">
                        {retiradaLocal?.nome}
                      </div>
                      <div className="text-text-hint text-[11px]">
                        {retiradaLocal?.prazo}
                      </div>
                      <div className="text-success text-xs font-bold">
                        Grátis
                      </div>
                      <button
                        onClick={() => setTransportadoraSelecionada(null)}
                        className="border-surface-border text-text-hint hover:text-danger hover:border-danger absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[10px] transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : transportadoraSelecionada === "entrega-propria" ? (
                    <div className="border-primary bg-primary-light relative flex items-center gap-2 rounded-lg border-[1.5px] p-2.5">
                      <div className="text-text-primary flex-1 text-xs font-semibold">
                        Entrega Própria
                      </div>
                      <PrevisaoEntregaPropriaPdp
                        resultado={resultadoDoCepAtual}
                        fallback={prazoEntregaPropria}
                      />
                      {resultadoDoCepAtual?.found && (
                        <PrecoFretePromocionalPdp
                          valorEmCentavos={resultadoDoCepAtual.shippingPrice}
                          valorOriginalEmCentavos={
                            resultadoDoCepAtual.shippingPriceOriginal
                          }
                          freteGratisPromocionalAplicado={
                            resultadoDoCepAtual.freteGratisPromocionalAplicado
                          }
                          rotuloGratis="Entrega Própria — GRÁTIS"
                        />
                      )}
                      <button
                        onClick={() => setTransportadoraSelecionada(null)}
                        className="border-surface-border text-text-hint hover:text-danger hover:border-danger absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[10px] transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : opcaoFrenetSelecionada ? (
                    <div className="border-primary bg-primary-light relative flex items-center gap-2 rounded-lg border-[1.5px] p-2.5">
                      <div className="text-text-primary flex-1 text-xs font-semibold">
                        {opcaoFrenetSelecionada.nome}
                      </div>
                      <div className="text-text-hint text-[11px]">
                        {opcaoFrenetSelecionada.prazo || "Consulte prazo"}
                      </div>
                      <PrecoFretePromocionalPdp
                        valorEmCentavos={opcaoFrenetSelecionada.valorEmCentavos}
                        valorOriginalEmCentavos={
                          opcaoFrenetSelecionada.valorOriginalEmCentavos
                        }
                        freteGratisPromocionalAplicado={
                          opcaoFrenetSelecionada.freteGratisPromocionalAplicado
                        }
                      />
                      <button
                        onClick={() => setTransportadoraSelecionada(null)}
                        className="border-surface-border text-text-hint hover:text-danger hover:border-danger absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[10px] transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                  <div className="text-text-muted mt-1 text-[11px]">
                    📍 Entregando para <strong>{cep}</strong>
                    {transportadoraSelecionada === "retirada" &&
                      retiradaLocal?.mensagem && (
                        <span className="bg-success-light text-success ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                          {retiradaLocal.mensagem}
                        </span>
                      )}
                  </div>
                </div>
              ) : (
                // Lista de opções
                <>
                  {retiradaLocal && (
                    <label
                      className="border-surface-border hover:border-primary-mid grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 rounded-lg border-[1.5px] bg-white p-2.5 transition-colors"
                      onClick={() => {
                        setTransportadoraSelecionada("retirada");
                        setErroFrete("");
                      }}
                    >
                      <input
                        type="radio"
                        name="entrega"
                        className="accent-primary mt-0.5 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-text-primary text-xs font-medium">
                          {retiradaLocal.nome}
                        </p>
                        <p className="text-text-hint mt-0.5 text-[11px] leading-snug">
                          {retiradaLocal.prazo}
                        </p>
                      </div>
                      <div className="text-success self-start text-right text-xs font-bold whitespace-nowrap">
                        Grátis
                      </div>
                    </label>
                  )}

                  {allowsOwnDelivery &&
                    (consultandoFrete || !resultadoDoCepAtual ? (
                      <div className="border-surface-border flex items-center gap-2 rounded-lg border-[1.5px] bg-white p-2.5 sm:col-span-2">
                        <div className="flex-1 text-xs font-medium text-gray-500">
                          Consultando Entrega Própria...
                        </div>
                      </div>
                    ) : resultadoDoCepAtual?.found ? (
                      <label
                        className={`border-surface-border hover:border-primary-mid grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 rounded-lg border-[1.5px] bg-white p-2.5 transition-colors ${
                          descricaoComplementarEntregaPropria
                            ? "sm:col-span-2"
                            : ""
                        }`}
                        onClick={() => {
                          setTransportadoraSelecionada("entrega-propria");
                          setErroFrete("");
                        }}
                      >
                        <input
                          type="radio"
                          name="entrega"
                          className="accent-primary row-span-2 mt-0.5 flex-shrink-0"
                        />
                        <div className="text-text-primary min-w-0 text-xs font-medium">
                          <p>Entrega Própria</p>
                          <div className="text-text-hint mt-0.5 text-[11px] leading-snug">
                            <PrevisaoEntregaPropriaPdp
                              resultado={resultadoDoCepAtual}
                              fallback={prazoEntregaPropria}
                            />
                          </div>
                        </div>
                        <div className="self-start text-right">
                          <PrecoFretePromocionalPdp
                            valorEmCentavos={resultadoDoCepAtual.shippingPrice}
                            valorOriginalEmCentavos={
                              resultadoDoCepAtual.shippingPriceOriginal
                            }
                            freteGratisPromocionalAplicado={
                              resultadoDoCepAtual.freteGratisPromocionalAplicado
                            }
                            rotuloGratis="Entrega Própria — GRÁTIS"
                          />
                        </div>
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-red-200 bg-red-50 p-2.5 sm:col-span-2">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-left text-[10px] font-bold text-red-700">
                          {resultadoDoCepAtual?.message ||
                            "Consulte o vendedor"}
                        </span>
                      </div>
                    ))}

                  {opcoesEntregaCotadas
                    .filter((opcao) => opcao.provedor === "frenet")
                    .map((opcao) => (
                      <label
                        key={opcao.identificador}
                        className="border-surface-border hover:border-primary-mid grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 rounded-lg border-[1.5px] bg-white p-2.5 transition-colors"
                        onClick={() => {
                          setTransportadoraSelecionada(opcao.identificador);
                          setErroFrete("");
                        }}
                      >
                        <input
                          type="radio"
                          name="entrega"
                          className="accent-primary mt-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-text-primary text-xs font-medium">
                            {opcao.nome}
                          </p>
                          <p className="text-text-hint mt-0.5 text-[11px] leading-snug">
                            {opcao.prazo || "Consulte prazo"}
                          </p>
                        </div>
                        <div className="self-start text-right">
                          <PrecoFretePromocionalPdp
                            valorEmCentavos={opcao.valorEmCentavos}
                            valorOriginalEmCentavos={
                              opcao.valorOriginalEmCentavos
                            }
                            freteGratisPromocionalAplicado={
                              opcao.freteGratisPromocionalAplicado
                            }
                          />
                        </div>
                      </label>
                    ))}
                </>
              )}
            </div>
          )}

        {erroFrete ? (
          <div
            className={`mt-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-700 ${
              modoPreVisualizacao ? "sm:col-span-2" : ""
            }`}
          >
            {erroFrete}
          </div>
        ) : null}
      </div>

      {modoPreVisualizacao && mostrarFreteDemonstrativo ? (
        <div className="order-5 mx-5 mt-4 sm:col-span-2">
          <BannerPromocionalPrevisualizacao />
        </div>
      ) : null}

      {modoPreVisualizacao ? (
        <div className="order-6 flex items-center border-t border-border px-5 pt-4 sm:col-span-2">
          <ItemBeneficioProdutoPdp {...beneficioDisponibilidade} />
        </div>
      ) : null}

      {/* CUPOM */}
      {!cupomAplicado ? (
        <div
          className={
            modoPreVisualizacao
              ? "order-7 px-5 pt-3 sm:col-span-2"
              : undefined
          }
        >
          {!mostrarInputCupom ? (
            <button
              onClick={() => setMostrarInputCupom(true)}
              className={`text-primary text-xs underline hover:no-underline ${modoPreVisualizacao ? "inline-flex items-center gap-1.5" : ""}`}
            >
              {modoPreVisualizacao ? (
                <Tag aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
              ) : (
                "🏷️"
              )}
              Tenho um cupom de desconto
            </button>
          ) : (
            <div className="animate-[slideDown_0.2s_ease]">
              <div className="flex gap-1.5">
                <input
                  placeholder="Ex: PRIMEIRA10"
                  value={inputCupom}
                  onChange={(e) => {
                    setInputCupom(e.target.value.toUpperCase());
                    setErroCupom("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAplicarCupom()}
                  className="border-surface-border focus:border-primary flex-1 rounded-lg border-[1.5px] px-3 py-2 text-xs tracking-wide uppercase outline-none"
                />
                <button
                  onClick={handleAplicarCupom}
                  className="bg-accent hover:bg-accent-dark rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap text-white transition-colors"
                >
                  Aplicar
                </button>
              </div>
              {erroCupom && (
                <div className="text-danger mt-1 text-[11px] font-medium">
                  {erroCupom}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`bg-success-light animate-[fadeUp_0.3s_ease] rounded-xl border-[1.5px] border-[#99F6E4] p-2.5 ${modoPreVisualizacao ? "order-7 mx-5 mt-3 sm:col-span-2" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-success text-[11px] font-bold">
                ✓ Cupom aplicado
              </div>
              <div className="text-pix-text mt-0.5 text-[11px]">
                {cupomAplicado.label}
              </div>
            </div>
            <button
              onClick={handleRemoverCupom}
              className="text-text-hint hover:text-danger text-[11px] underline transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      <div
        className={`bg-surface-border h-px ${modoPreVisualizacao ? "hidden" : ""}`}
      />

      {/* BOTÕES */}
      <div
        className={
          modoPreVisualizacao
            ? "order-8 mx-5 mt-3 flex flex-col gap-3 sm:col-span-1 sm:ml-0 sm:grid sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] sm:pr-5"
            : "flex flex-col gap-2"
        }
      >
        {compraDisponivel ? (
          <>
            <button
              className={`bg-primary hover:bg-primary-mid disabled:bg-surface-border disabled:text-text-hint w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${modoPreVisualizacao ? "min-h-12 px-6" : ""}`}
              onClick={comprarAgoraComFrete}
            >
              Comprar
            </button>

            <button
              className={`text-primary border-primary hover:bg-primary-light disabled:border-surface-border disabled:text-text-hint w-full rounded-xl border-[1.5px] bg-white py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${modoPreVisualizacao ? "min-h-12 px-6" : ""}`}
              onClick={adicionarAoCarrinhoComFrete}
            >
              {modoPreVisualizacao ? (
                <>
                  Adicionar
                  <span className="hidden lg:inline"> ao carrinho</span>
                  <span className="sr-only lg:hidden"> ao carrinho</span>
                </>
              ) : (
                "Adicionar ao carrinho"
              )}
            </button>
          </>
        ) : (
          <div
            role="status"
            className="bg-surface-border text-text-hint w-full rounded-xl px-4 py-3.5 text-center text-sm font-bold"
          >
            {disponibilidadeCompra.estado === "selecione_variante"
              ? "Selecione uma variante"
              : "Indisponível"}
          </div>
        )}
      </div>

      <div
        className={`bg-surface-border h-px ${modoPreVisualizacao ? "hidden" : ""}`}
      />

      {modoPreVisualizacao ? (
        <BeneficiosProdutoPdp
          beneficios={beneficiosConfianca}
          className="order-9 border-t border-border px-5 py-4 sm:col-span-2"
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {[
            { icon: "🔄", text: "Devolução grátis em 30 dias" },
            { icon: "🛡️", text: "Garantia de 12 meses" },
            { icon: "🔒", text: "Compra 100% segura" },
          ].map((g) => (
            <div
              key={g.text}
              className="text-text-muted flex items-center gap-2 text-xs"
            >
              <span className="text-sm">{g.icon}</span>
              {g.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
