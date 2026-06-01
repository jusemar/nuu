// ==========================================
// COMPONENTE: BuyBox (VERSÃO ORIGINAL - FUNCIONANDO)
// ==========================================
// Responsabilidade: Caixa de compra com preço, frete, cupom e botões
// Recebe: Preços formatados em string (compatível com mock anterior)

"use client";

import { useRef, useState } from "react";
import { formatCEP, isValidCEP } from "../../utils/formatters";
import { consultarFreteAction } from "../../actions/consultarFreteAction";
import type { ConsultaFreteResult } from "../../actions/consultarFreteAction";
import { montarFreteFrenetSelecionado } from "../../lib/frete/montar-frete-frenet-selecionado";
import type { Modalidade } from "../../types/product.types";

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
  estoque: number;
  freteGratisMin?: number;
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
  estoque,
  freteGratisMin = 299,
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
  modalidades,
  modalidadeAtiva,
  onTrocarModalidade,
}: BuyBoxProps) {
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

  // CÁLCULOS
  const precoNumerico = parseFloat(
    precoPix.replace("R$ ", "").replace(",", "."),
  );
  const valorCarrinho = precoNumerico * quantidade;
  const temFreteGratis = valorCarrinho >= freteGratisMin;
  const faltaParaFreteGratis = Math.max(freteGratisMin - valorCarrinho, 0);
  const progressoFrete = Math.min((valorCarrinho / freteGratisMin) * 100, 100);
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

  // HANDLERS
  function aumentarQuantidade() {
    if (quantidade < estoque) setQuantidade((q) => q + 1);
  }

  function diminuirQuantidade() {
    if (quantidade > 1) setQuantidade((q) => q - 1);
  }

  function handleCepChange(valor: string) {
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

  async function consultarFrete() {
    setErroFrete("");

    const cepParaConsulta = cep.replace(/\D/g, "");

    if (isValidCEP(cep)) {
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
        );
        if (consultaFreteIdRef.current !== consultaId) return;
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
        prazo: prazoEntrega,
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
    <div className="border-surface-border sticky top-20 flex flex-col gap-4 rounded-2xl border bg-white p-5">
      {/* PREÇO */}
      <div>
        {selectedVariantLabel ? (
          <div className="bg-primary-light text-primary mb-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold">
            {selectedVariantLabel}
          </div>
        ) : null}
        <div className="text-text-hint mb-1.5 text-xs">
          De <span className="line-through">{precoNormal}</span> no cartão
        </div>

        <div className="bg-pix-bg border-pix-border rounded-xl border p-3">
          <div className="text-success mb-1 text-[11px] font-bold tracking-wide uppercase">
            💸 PIX — {descontoPix}% de desconto
          </div>

          <div className="text-text-primary text-2xl font-extrabold tracking-tight">
            {cupomAplicado
              ? `R$ ${(precoNumerico * (1 - cupomAplicado.desconto / 100)).toFixed(2).replace(".", ",")}`
              : precoPix}
          </div>

          <div className="text-pix-text mt-1 text-xs">
            Preço final ao pagar com PIX
          </div>

          {cupomAplicado && (
            <div className="text-pix-text mt-0.5 text-[11px] font-bold">
              + cupom {cupomAplicado.code}: -{cupomAplicado.desconto}% adicional
            </div>
          )}
        </div>

        <div className="text-text-muted mt-2 text-xs">
          ou <strong className="text-text-primary">{precoParc}</strong>
        </div>

        {onShowPaymentOptions && (
          <button
            onClick={onShowPaymentOptions}
            className="text-primary mt-1 block text-left text-xs underline hover:no-underline"
          >
            Ver todas as formas de pagamento
          </button>
        )}
      </div>

      <div className="bg-surface-border h-px" />

      {/* QUANTIDADE */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-text-primary text-xs font-semibold">
            Quantidade
          </span>

          <div className="flex items-center gap-2">
            <button
              className="border-surface-border hover:border-primary flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] bg-white text-lg transition-colors disabled:opacity-50"
              onClick={diminuirQuantidade}
              disabled={quantidade <= 1}
            >
              −
            </button>

            <span className="min-w-[22px] text-center text-sm font-bold">
              {quantidade}
            </span>

            <button
              className="border-surface-border hover:border-primary flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] bg-white text-lg transition-colors disabled:opacity-50"
              onClick={aumentarQuantidade}
              disabled={quantidade >= estoque}
            >
              +
            </button>
          </div>
        </div>

        <div
          className={`text-[11px] font-semibold ${estoque <= 10 ? "text-danger" : "text-success"}`}
        >
          {estoque <= 0
            ? "Indisponível no momento"
            : estoque <= 10
              ? `⚠️ Apenas ${estoque} unidades!`
              : `✓ ${estoque} unidades disponíveis`}
        </div>
      </div>

      {/* FRETE GRÁTIS */}
      <div
        className={`rounded-xl border p-3 ${temFreteGratis ? "bg-success-light border-[#99F6E4]" : "bg-primary-light border-surface-border"}`}
      >
        {temFreteGratis ? (
          <div className="text-success text-xs font-bold">
            🚚 Parabéns! Você ganhou <strong>frete grátis</strong>!
          </div>
        ) : (
          <>
            <div className="text-text-primary text-xs">
              🚚 Falta{" "}
              <strong className="text-primary">
                R$ {faltaParaFreteGratis.toFixed(2).replace(".", ",")}
              </strong>{" "}
              para ganhar frete grátis
            </div>

            <div className="bg-surface-border mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-success h-full rounded-full transition-all duration-500"
                style={{ width: `${progressoFrete}%` }}
              />
            </div>

            <div className="text-text-hint mt-1 text-[10px]">
              Carrinho: R$ {valorCarrinho.toFixed(2).replace(".", ",")} / mín.
              R$ {freteGratisMin},00
            </div>
          </>
        )}
      </div>

      {/* CEP */}
      <div
        ref={freteRef}
        className={`rounded-xl border bg-[#F9FAFB] p-3 transition-all ${
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

        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && consultarFrete()}
            maxLength={9}
            className="border-surface-border focus:border-primary w-44 rounded-lg border-[1.5px] bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={consultarFrete}
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
            <div className="mt-2 flex animate-[fadeUp_0.3s_ease] flex-col gap-1">
              {enderecoConsultado ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-950">
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
                <div>
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
                      <div className="text-text-hint text-[11px]">
                        {prazoEntregaPropria}
                      </div>
                      {resultadoDoCepAtual?.found && (
                        <div className="text-text-primary text-xs font-bold">
                          R${" "}
                          {(resultadoDoCepAtual.shippingPrice / 100)
                            .toFixed(2)
                            .replace(".", ",")}
                        </div>
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
                      <div className="text-text-primary text-xs font-bold">
                        R${" "}
                        {(opcaoFrenetSelecionada.valorEmCentavos / 100)
                          .toFixed(2)
                          .replace(".", ",")}
                      </div>
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
                      className="border-surface-border hover:border-primary-mid flex cursor-pointer items-center gap-2 rounded-lg border-[1.5px] bg-white p-2.5 transition-colors"
                      onClick={() => {
                        setTransportadoraSelecionada("retirada");
                        setErroFrete("");
                      }}
                    >
                      <input
                        type="radio"
                        name="entrega"
                        className="accent-primary flex-shrink-0"
                      />
                      <div className="text-text-primary flex-1 text-xs font-medium">
                        {retiradaLocal.nome}
                      </div>
                      <div className="text-text-hint text-[11px]">
                        {retiradaLocal.prazo}
                      </div>
                      <div className="text-success text-xs font-bold">
                        Grátis
                      </div>
                    </label>
                  )}

                  {allowsOwnDelivery &&
                    (consultandoFrete || !resultadoDoCepAtual ? (
                      <div className="border-surface-border flex items-center gap-2 rounded-lg border-[1.5px] bg-white p-2.5">
                        <div className="flex-1 text-xs font-medium text-gray-500">
                          Consultando Entrega Própria...
                        </div>
                      </div>
                    ) : resultadoDoCepAtual?.found ? (
                      <label
                        className="border-surface-border hover:border-primary-mid flex cursor-pointer items-center gap-2 rounded-lg border-[1.5px] bg-white p-2.5 transition-colors"
                        onClick={() => {
                          setTransportadoraSelecionada("entrega-propria");
                          setErroFrete("");
                        }}
                      >
                        <input
                          type="radio"
                          name="entrega"
                          className="accent-primary flex-shrink-0"
                        />
                        <div className="text-text-primary flex-1 text-xs font-medium">
                          Entrega Própria
                        </div>
                        <div className="text-text-hint text-[11px]">
                          {prazoEntregaPropria}
                        </div>
                        <div className="text-text-primary text-xs font-bold">
                          R${" "}
                          {(resultadoDoCepAtual.shippingPrice / 100)
                            .toFixed(2)
                            .replace(".", ",")}
                        </div>
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-red-200 bg-red-50 p-2.5">
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
                        className="border-surface-border hover:border-primary-mid flex cursor-pointer items-center gap-2 rounded-lg border-[1.5px] bg-white p-2.5 transition-colors"
                        onClick={() => {
                          setTransportadoraSelecionada(opcao.identificador);
                          setErroFrete("");
                        }}
                      >
                        <input
                          type="radio"
                          name="entrega"
                          className="accent-primary flex-shrink-0"
                        />
                        <div className="text-text-primary flex-1 text-xs font-medium">
                          {opcao.nome}
                        </div>
                        <div className="text-text-hint text-[11px]">
                          {opcao.prazo || "Consulte prazo"}
                        </div>
                        <div className="text-text-primary text-xs font-bold">
                          R${" "}
                          {(opcao.valorEmCentavos / 100)
                            .toFixed(2)
                            .replace(".", ",")}
                        </div>
                      </label>
                    ))}
                </>
              )}
            </div>
          )}

        {erroFrete ? (
          <div className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-700">
            {erroFrete}
          </div>
        ) : null}
      </div>

      {/* CUPOM */}
      {!cupomAplicado ? (
        <div>
          {!mostrarInputCupom ? (
            <button
              onClick={() => setMostrarInputCupom(true)}
              className="text-primary text-xs underline hover:no-underline"
            >
              🏷️ Tenho um cupom de desconto
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
        <div className="bg-success-light animate-[fadeUp_0.3s_ease] rounded-xl border-[1.5px] border-[#99F6E4] p-2.5">
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

      <div className="bg-surface-border h-px" />

      {/* BOTÕES */}
      <div className="flex flex-col gap-2">
        <button
          className="bg-primary hover:bg-primary-mid disabled:bg-surface-border disabled:text-text-hint w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100"
          onClick={comprarAgoraComFrete}
          disabled={estoque <= 0}
        >
          {estoque > 0 ? "Comprar" : "Indisponível"}
        </button>

        <button
          className="text-primary border-primary hover:bg-primary-light disabled:border-surface-border disabled:text-text-hint w-full rounded-xl border-[1.5px] bg-white py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100"
          onClick={adicionarAoCarrinhoComFrete}
          disabled={estoque <= 0}
        >
          Adicionar ao carrinho
        </button>
      </div>

      <div className="bg-surface-border h-px" />

      {/* GARANTIAS */}
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
    </div>
  );
}
