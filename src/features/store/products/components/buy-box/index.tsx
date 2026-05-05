// ==========================================
// COMPONENTE: BuyBox (VERSÃO ORIGINAL - FUNCIONANDO)
// ==========================================
// Responsabilidade: Caixa de compra com preço, frete, cupom e botões
// Recebe: Preços formatados em string (compatível com mock anterior)

'use client';

import { useState } from 'react';
import { formatCEP, isValidCEP } from '../../utils/formatters';
import type { Transportadora } from '../../types/product.types';

// ==========================================
// INTERFACE ORIGINAL (sem modalidades reais)
// ==========================================
interface BuyBoxProps {
  precoPix: string;           // "R$ 679,91"
  precoNormal: string;        // "R$ 799,90"
  precoParc: string;          // "3x de R$ 253,97"
  descontoPix: number;        // 15
  estoque: number;
  freteGratisMin?: number;
  
  onAddToCart: (quantidade: number) => void;
  onShowPaymentOptions?: () => void;
  
  cupomAplicado?: { desconto: number; label: string; code: string } | null;
  onAplicarCupom?: (codigo: string) => void;
  onRemoverCupom?: () => void;
  
  transportadoras?: Transportadora[];
  
  // Retirada local (dados reais do admin)
  retiradaLocal?: {
    nome: string;
    prazo: string;
    mensagem: string | null;
  } | null;
}

// ==========================================
// COMPONENTE
// ==========================================
export function BuyBox({
  precoPix,
  precoNormal,
  precoParc,
  descontoPix,
  estoque,
  freteGratisMin = 299,
  onAddToCart,
  onShowPaymentOptions,
  cupomAplicado,
  onAplicarCupom,
  onRemoverCupom,
  transportadoras = [],
  retiradaLocal = null,
}: BuyBoxProps) {
  
  // ESTADOS
  const [quantidade, setQuantidade] = useState(1);
  const [cep, setCep] = useState('');
  const [cepConsultado, setCepConsultado] = useState(false);
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState<number | 'retirada' | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [inputCupom, setInputCupom] = useState('');
  const [mostrarInputCupom, setMostrarInputCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState('');

  // CÁLCULOS
  const precoNumerico = parseFloat(precoPix.replace('R$ ', '').replace(',', '.'));
  const valorCarrinho = precoNumerico * quantidade;
  const temFreteGratis = valorCarrinho >= freteGratisMin;
  const faltaParaFreteGratis = Math.max(freteGratisMin - valorCarrinho, 0);
  const progressoFrete = Math.min((valorCarrinho / freteGratisMin) * 100, 100);

  // HANDLERS
  function aumentarQuantidade() {
    if (quantidade < estoque) setQuantidade(q => q + 1);
  }
  
  function diminuirQuantidade() {
    if (quantidade > 1) setQuantidade(q => q - 1);
  }

  function handleCepChange(valor: string) {
    const formatado = formatCEP(valor);
    setCep(formatado);
    if (valor.length === 0) {
      setCepConsultado(false);
      setTransportadoraSelecionada(null);
    }
  }

  function consultarFrete() {
    if (isValidCEP(cep)) {
      setCepConsultado(true);
      setTransportadoraSelecionada(null);
    }
  }

  function handleAplicarCupom() {
    setErroCupom('');
    if (!inputCupom.trim()) return;
    if (onAplicarCupom) {
      onAplicarCupom(inputCupom.trim().toUpperCase());
    }
  }

  function handleRemoverCupom() {
    setInputCupom('');
    setErroCupom('');
    if (onRemoverCupom) onRemoverCupom();
  }

  // RENDER
  return (
    <div className="bg-white border border-surface-border rounded-2xl p-5 flex flex-col gap-4 sticky top-20">
      
      {/* PREÇO */}
      <div>
        <div className="text-xs text-text-hint mb-1.5">
          De <span className="line-through">{precoNormal}</span> no cartão
        </div>
        
        <div className="bg-pix-bg border border-pix-border rounded-xl p-3">
          <div className="text-[11px] font-bold text-success uppercase tracking-wide mb-1">
            💸 PIX — {descontoPix}% de desconto
          </div>
          
          <div className="text-2xl font-extrabold tracking-tight text-text-primary">
            {cupomAplicado 
              ? `R$ ${(precoNumerico * (1 - cupomAplicado.desconto / 100)).toFixed(2).replace('.', ',')}`
              : precoPix
            }
          </div>
          
          <div className="text-xs text-pix-text mt-1">
            Preço final ao pagar com PIX
          </div>
          
          {cupomAplicado && (
            <div className="text-[11px] text-pix-text font-bold mt-0.5">
              + cupom {cupomAplicado.code}: -{cupomAplicado.desconto}% adicional
            </div>
          )}
        </div>
        
        <div className="text-xs text-text-muted mt-2">
          ou <strong className="text-text-primary">{precoParc}</strong>
        </div>
        
        {onShowPaymentOptions && (
          <button 
            onClick={onShowPaymentOptions}
            className="text-xs text-primary underline mt-1 hover:no-underline block text-left"
          >
            Ver todas as formas de pagamento
          </button>
        )}
      </div>

      <div className="h-px bg-surface-border" />

      {/* QUANTIDADE */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text-primary">Quantidade</span>
          
          <div className="flex items-center gap-2">
            <button 
              className="w-8 h-8 border-[1.5px] border-surface-border bg-white rounded-lg flex items-center justify-center text-lg hover:border-primary transition-colors disabled:opacity-50"
              onClick={diminuirQuantidade}
              disabled={quantidade <= 1}
            >
              −
            </button>
            
            <span className="text-sm font-bold min-w-[22px] text-center">
              {quantidade}
            </span>
            
            <button 
              className="w-8 h-8 border-[1.5px] border-surface-border bg-white rounded-lg flex items-center justify-center text-lg hover:border-primary transition-colors disabled:opacity-50"
              onClick={aumentarQuantidade}
              disabled={quantidade >= estoque}
            >
              +
            </button>
          </div>
        </div>
        
        <div className={`text-[11px] font-semibold ${estoque <= 10 ? 'text-danger' : 'text-success'}`}>
          {estoque <= 10 
            ? `⚠️ Apenas ${estoque} unidades!` 
            : `✓ ${estoque} unidades disponíveis`}
        </div>
      </div>

      {/* FRETE GRÁTIS */}
      <div className={`rounded-xl p-3 border ${temFreteGratis ? 'bg-success-light border-[#99F6E4]' : 'bg-primary-light border-surface-border'}`}>
        {temFreteGratis ? (
          <div className="text-xs font-bold text-success">
            🚚 Parabéns! Você ganhou <strong>frete grátis</strong>!
          </div>
        ) : (
          <>
            <div className="text-xs text-text-primary">
              🚚 Falta <strong className="text-primary">
                R$ {faltaParaFreteGratis.toFixed(2).replace('.', ',')}
              </strong> para ganhar frete grátis
            </div>
            
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${progressoFrete}%` }}
              />
            </div>
            
            <div className="text-[10px] text-text-hint mt-1">
              Carrinho: R$ {valorCarrinho.toFixed(2).replace('.', ',')} / mín. R$ {freteGratisMin},00
            </div>
          </>
        )}
      </div>

      {/* CEP */}
      <div className="border border-surface-border rounded-xl p-3 bg-[#F9FAFB]">
        <div className="text-[11px] font-bold text-text-primary uppercase tracking-wide mb-2">
          Calcular Frete
        </div>
        
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && consultarFrete()}
            maxLength={9}
            className="w-44 border-[1.5px] border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white"
          />
          <button 
            onClick={consultarFrete}
            disabled={!isValidCEP(cep)}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary-mid transition-colors disabled:bg-surface-border disabled:text-text-hint disabled:cursor-not-allowed"
          >
            OK
          </button>
        </div>
        
        {cepConsultado && (retiradaLocal || transportadoras.length > 0) && (
          <div className="mt-2 flex flex-col gap-1 animate-[fadeUp_0.3s_ease]">
            {transportadoraSelecionada !== null ? (
              // Opção selecionada — mostra qual foi escolhida
              <div>
                {transportadoraSelecionada === 'retirada' ? (
                  <div className="relative flex items-center gap-2 p-2.5 border-[1.5px] border-primary bg-primary-light rounded-lg">
                    <div className="flex-1 text-xs font-semibold text-text-primary">
                      {retiradaLocal?.nome}
                    </div>
                    <div className="text-[11px] text-text-hint">
                      {retiradaLocal?.prazo}
                    </div>
                    <div className="text-xs font-bold text-success">
                      Grátis
                    </div>
                    <button 
                      onClick={() => setTransportadoraSelecionada(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-white border border-surface-border rounded-full text-[10px] text-text-hint hover:text-danger hover:border-danger transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 p-2.5 border-[1.5px] border-primary bg-primary-light rounded-lg">
                    <div className="flex-1 text-xs font-semibold text-text-primary">
                      {transportadoras[transportadoraSelecionada as number].nome}
                    </div>
                    <div className="text-[11px] text-text-hint">
                      {transportadoras[transportadoraSelecionada as number].prazo}
                    </div>
                    <div className={`text-xs font-bold ${transportadoras[transportadoraSelecionada as number].valor === 'Grátis' ? 'text-success' : 'text-text-primary'}`}>
                      {transportadoras[transportadoraSelecionada as number].valor}
                    </div>
                    <button 
                      onClick={() => setTransportadoraSelecionada(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-white border border-surface-border rounded-full text-[10px] text-text-hint hover:text-danger hover:border-danger transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="text-[11px] text-text-muted mt-1">
                  📍 Entregando para <strong>{cep}</strong>
                  {transportadoraSelecionada === 'retirada' && retiradaLocal?.mensagem && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-light text-success ml-1">
                      {retiradaLocal.mensagem}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              // Lista de opções — retirada local primeiro (se habilitada), depois transportadoras
              <>
                {retiradaLocal && (
                  <label 
                    className="flex items-center gap-2 p-2.5 border-[1.5px] border-surface-border rounded-lg cursor-pointer hover:border-primary-mid transition-colors bg-white"
                    onClick={() => setTransportadoraSelecionada('retirada')}
                  >
                    <input 
                      type="radio" 
                      name="entrega" 
                      className="accent-primary flex-shrink-0" 
                    />
                    <div className="flex-1 text-xs font-medium text-text-primary">
                      {retiradaLocal.nome}
                    </div>
                    <div className="text-[11px] text-text-hint">{retiradaLocal.prazo}</div>
                    <div className="text-xs font-bold text-success">
                      Grátis
                    </div>
                  </label>
                )}
                {transportadoras.map((t, i) => (
                  <label 
                    key={i} 
                    className="flex items-center gap-2 p-2.5 border-[1.5px] border-surface-border rounded-lg cursor-pointer hover:border-primary-mid transition-colors bg-white"
                    onClick={() => setTransportadoraSelecionada(i)}
                  >
                    <input 
                      type="radio" 
                      name="entrega" 
                      className="accent-primary flex-shrink-0" 
                    />
                    <div className="flex-1 text-xs font-medium text-text-primary">
                      {t.nome}
                      {t.destaque && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-light text-success ml-1">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-hint">{t.prazo}</div>
                    <div className={`text-xs font-bold ${t.valor === 'Grátis' ? 'text-success' : 'text-text-primary'}`}>
                      {t.valor}
                    </div>
                  </label>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* CUPOM */}
      {!cupomAplicado ? (
        <div>
          {!mostrarInputCupom ? (
            <button 
              onClick={() => setMostrarInputCupom(true)}
              className="text-xs text-primary underline hover:no-underline"
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
                    setErroCupom('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAplicarCupom()}
                  className="flex-1 border-[1.5px] border-surface-border rounded-lg px-3 py-2 text-xs uppercase tracking-wide outline-none focus:border-primary"
                />
                <button 
                  onClick={handleAplicarCupom}
                  className="bg-accent text-white rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap hover:bg-accent-dark transition-colors"
                >
                  Aplicar
                </button>
              </div>
              {erroCupom && (
                <div className="text-[11px] text-danger mt-1 font-medium">{erroCupom}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border-[1.5px] border-[#99F6E4] rounded-xl p-2.5 bg-success-light animate-[fadeUp_0.3s_ease]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-success">✓ Cupom aplicado</div>
              <div className="text-[11px] text-pix-text mt-0.5">{cupomAplicado.label}</div>
            </div>
            <button 
              onClick={handleRemoverCupom}
              className="text-[11px] text-text-hint underline hover:text-danger transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      <div className="h-px bg-surface-border" />

      {/* TERMOS */}
      <label className="flex gap-2 items-start cursor-pointer">
        <div 
          onClick={() => setAceitouTermos((t) => !t)}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all cursor-pointer ${
            aceitouTermos 
              ? 'bg-primary border-primary' 
              : 'border-surface-border-mid bg-transparent hover:border-primary'
          }`}
        >
          {aceitouTermos && <span className="text-white text-[10px] font-extrabold">✓</span>}
        </div>
        
        <span className="text-[11px] text-text-muted leading-relaxed">
          Li e aceito os{' '}
          <a href="#" className="text-primary font-semibold hover:underline">Termos</a>
          {' '}e a{' '}
          <a href="#" className="text-primary font-semibold hover:underline">Política de Privacidade</a>
        </span>
      </label>

      {/* BOTÕES */}
      <div className="flex flex-col gap-2">
        <button 
          className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-bold hover:bg-primary-mid active:scale-[0.98] transition-all disabled:bg-surface-border disabled:text-text-hint disabled:cursor-not-allowed disabled:active:scale-100"
          disabled={!aceitouTermos}
          onClick={() => onAddToCart(quantidade)}
        >
          {!aceitouTermos ? 'Aceite os termos para continuar' : 'Comprar agora'}
        </button>
        
        <button 
          className="w-full bg-white text-primary border-[1.5px] border-primary rounded-xl py-3 text-sm font-semibold hover:bg-primary-light active:scale-[0.98] transition-all"
          onClick={() => onAddToCart(quantidade)}
        >
          Adicionar ao carrinho
        </button>
      </div>

      <div className="h-px bg-surface-border" />

      {/* GARANTIAS */}
      <div className="flex flex-col gap-1.5">
        {[
          { icon: '🔄', text: 'Devolução grátis em 30 dias' },
          { icon: '🛡️', text: 'Garantia de 12 meses' },
          { icon: '🔒', text: 'Compra 100% segura' },
        ].map((g) => (
          <div key={g.text} className="flex items-center gap-2 text-xs text-text-muted">
            <span className="text-sm">{g.icon}</span>
            {g.text}
          </div>
        ))}
      </div>
    </div>
  );
}