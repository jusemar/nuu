// ==========================================
// COMPONENTE: BuyBox
// ==========================================
// Responsabilidade: Caixa de compra com preço, frete, cupom e botões
// O que faz: Mostra valores, calcula frete, aplica cupom, adiciona ao carrinho
// Recebe: Preços, estoque, callbacks de ação
// Estados: Quantidade, CEP, transportadora, termos, cupom

'use client'; // Precisa ser client porque usa useState (estados do formulário)

import { useState } from 'react';
import { formatCEP, isValidCEP } from '../../utils/formatters';
import type { Transportadora } from '../../types/product.types';

// ==========================================
// INTERFACE DAS PROPS (o que o componente recebe do pai)
// =========================================
interface BuyBoxProps {
  precoPix: string;           // Preço no PIX (ex: "R$ 679,91")
  precoNormal: string;        // Preço normal (ex: "R$ 799,90")
  precoParc: string;          // Parcelamento (ex: "3x de R$ 253,97")
  descontoPix: number;        // % de desconto (ex: 15)
  estoque: number;            // Quantidade em estoque (ex: 47)
  freteGratisMin?: number;    // Valor mínimo para frete grátis (padrão: 299)
  
  // Callbacks (funções que o pai passa para serem executadas)
  onAddToCart: (quantidade: number) => void;        // Quando clica em comprar/adicionar
  onShowPaymentOptions?: () => void;                // Quando clica em "ver parcelamentos"
  
  // Cupom (opcional)
  cupomAplicado?: { desconto: number; label: string; code: string } | null;
  onAplicarCupom?: (codigo: string) => void;       // Tenta aplicar cupom
  onRemoverCupom?: () => void;                     // Remove cupom
  
  // Frete (transportadoras disponíveis)
  transportadoras?: Transportadora[];
}

// ==========================================
// COMPONENTE PRINCIPAL
// =========================================
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
  transportadoras = [], // Se não passar nada, começa vazio
}: BuyBoxProps) {
  
  // -----------------------------------------
  // ESTADOS (useState) - "Memória" do componente
  // -----------------------------------------
  
  // Quantidade de produtos que o usuário quer comprar (começa em 1)
  const [quantidade, setQuantidade] = useState(1);
  
  // CEP digitado pelo usuário (começa vazio)
  const [cep, setCep] = useState('');
  
  // Se já consultou o CEP (mostra as transportadoras)
  const [cepConsultado, setCepConsultado] = useState(false);
  
  // Qual transportadora está selecionada (null = nenhuma)
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState<number | null>(null);
  
  // Se o usuário aceitou os termos (checkbox)
  const [aceitouTermos, setAceitouTermos] = useState(false);
  
  // Input do cupom (texto que o usuário digita)
  const [inputCupom, setInputCupom] = useState('');
  
  // Se deve mostrar o campo de input do cupom (começa escondido)
  const [mostrarInputCupom, setMostrarInputCupom] = useState(false);
  
  // Mensagem de erro do cupom (se inválido)
  const [erroCupom, setErroCupom] = useState('');

  // -----------------------------------------
  // CÁLCULOS (valores derivados dos estados)
  // -----------------------------------------
  
  // Converte o preço PIX de string "R$ 679,91" para número 679.91
  // replace remove "R$ " e troca vírgula por ponto
  const precoNumerico = parseFloat(precoPix.replace('R$ ', '').replace(',', '.'));
  
  // Valor total no carrinho = preço × quantidade
  const valorCarrinho = precoNumerico * quantidade;
  
  // Verifica se atingiu o frete grátis
  const temFreteGratis = valorCarrinho >= freteGratisMin;
  
  // Quanto falta para o frete grátis (não pode ser negativo, por isso o Math.max)
  const faltaParaFreteGratis = Math.max(freteGratisMin - valorCarrinho, 0);
  
  // Porcentagem da barra de progresso (0 a 100)
  const progressoFrete = Math.min((valorCarrinho / freteGratisMin) * 100, 100);

  // -----------------------------------------
  // FUNÇÕES DE EVENTO (HANDLERS)
  // -----------------------------------------
  
  // Aumenta a quantidade (não deixa passar do estoque)
  function aumentarQuantidade() {
    if (quantidade < estoque) {
      setQuantidade((q) => q + 1);
    }
  }
  
  // Diminui a quantidade (não deixa ser menor que 1)
  function diminuirQuantidade() {
    if (quantidade > 1) {
      setQuantidade((q) => q - 1);
    }
  }

  // Formata o CEP enquanto o usuário digita (adiciona o hífen)
  function handleCepChange(valor: string) {
    const formatado = formatCEP(valor); // Função utilitária que formata
    setCep(formatado);
    // Se apagar tudo, esconde as transportadoras
    if (valor.length === 0) {
      setCepConsultado(false);
      setTransportadoraSelecionada(null);
    }
  }

  // Consulta o CEP (simulação)
  function consultarFrete() {
    // Só consulta se o CEP for válido (8 dígitos)
    if (isValidCEP(cep)) {
      setCepConsultado(true);
      setTransportadoraSelecionada(null); // Reseta seleção anterior
    }
  }

  // Aplica o cupom
  function handleAplicarCupom() {
    // Limpa erro anterior
    setErroCupom('');
    
    // Se não digitou nada, não faz nada
    if (!inputCupom.trim()) return;
    
    // Chama a função que o pai passou (se existir)
    if (onAplicarCupom) {
      onAplicarCupom(inputCupom.trim().toUpperCase());
      // Nota: O pai deve verificar se é válido e passar cupomAplicado ou não
      // Aqui só chamamos o callback
    }
  }

  // Remove o cupom
  function handleRemoverCupom() {
    setInputCupom('');
    setErroCupom('');
    if (onRemoverCupom) {
      onRemoverCupom();
    }
  }

  // ==========================================
  // RENDER (HTML que aparece na tela)
  // =========================================
  return (
    // Container principal - sticky para ficar fixo ao rolar a página
    // bg-white: fundo branco
    // border: borda cinza
    // rounded-2xl: cantos arredondados
    // p-5: padding interno
    // sticky: gruda no topo quando rola
    // top-20: distância do topo (80px)
    <div className="bg-white border border-surface-border rounded-2xl p-5 flex flex-col gap-4 sticky top-20">
      
      {/* -----------------------------------------
          SEÇÃO 1: PREÇO
          ----------------------------------------- */}
      <div>
        {/* Preço original riscado (no cartão) */}
        <div className="text-xs text-text-hint mb-1.5">
          De <span className="line-through">{precoNormal}</span> no cartão
        </div>
        
        {/* Bloco do PIX - destacado com cor de sucesso */}
        <div className="bg-pix-bg border border-pix-border rounded-xl p-3">
          {/* Label "PIX - X% de desconto" */}
          <div className="text-[11px] font-bold text-success uppercase tracking-wide mb-1">
            💸 PIX — {descontoPix}% de desconto
          </div>
          
          {/* Valor grande em destaque */}
          <div className="text-2xl font-extrabold tracking-tight text-text-primary">
            {cupomAplicado 
              ? `R$ ${(precoNumerico * (1 - cupomAplicado.desconto / 100)).toFixed(2).replace('.', ',')}`
              : precoPix
            }
          </div>
          
          {/* Texto auxiliar */}
          <div className="text-xs text-pix-text mt-1">
            Preço final ao pagar com PIX
          </div>
          
          {/* Se tiver cupom aplicado, mostra o desconto extra */}
          {cupomAplicado && (
            <div className="text-[11px] text-pix-text font-bold mt-0.5">
              + cupom {cupomAplicado.code}: -{cupomAplicado.desconto}% adicional
            </div>
          )}
        </div>
        
        {/* Parcelamento */}
        <div className="text-xs text-text-muted mt-2">
          ou <strong className="text-text-primary">{precoParc}</strong>
        </div>
        
        {/* Link para ver mais opções */}
        {onShowPaymentOptions && (
          <button 
            onClick={onShowPaymentOptions}
            className="text-xs text-primary underline mt-1 hover:no-underline block text-left"
          >
            Ver todas as formas de pagamento
          </button>
        )}
      </div>

      {/* Linha divisória */}
      <div className="h-px bg-surface-border" />

      {/* -----------------------------------------
          SEÇÃO 2: QUANTIDADE
          ----------------------------------------- */}
      <div>
        {/* Label e controles em linha */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text-primary">Quantidade</span>
          
          {/* Botões + e - */}
          <div className="flex items-center gap-2">
            {/* Botão diminuir */}
            <button 
              className="w-8 h-8 border-[1.5px] border-surface-border bg-white rounded-lg flex items-center justify-center text-lg hover:border-primary transition-colors disabled:opacity-50"
              onClick={diminuirQuantidade}
              disabled={quantidade <= 1}
            >
              −
            </button>
            
            {/* Número da quantidade */}
            <span className="text-sm font-bold min-w-[22px] text-center">
              {quantidade}
            </span>
            
            {/* Botão aumentar */}
            <button 
              className="w-8 h-8 border-[1.5px] border-surface-border bg-white rounded-lg flex items-center justify-center text-lg hover:border-primary transition-colors disabled:opacity-50"
              onClick={aumentarQuantidade}
              disabled={quantidade >= estoque}
            >
              +
            </button>
          </div>
        </div>
        
        {/* Aviso de estoque */}
        <div className={`text-[11px] font-semibold ${estoque <= 10 ? 'text-danger' : 'text-success'}`}>
          {estoque <= 10 
            ? `⚠️ Apenas ${estoque} unidades!` 
            : `✓ ${estoque} unidades disponíveis`}
        </div>
      </div>

      {/* -----------------------------------------
          SEÇÃO 3: FRETE GRÁTIS PROGRESSIVO
          Mostra uma barra de progresso animada
          ----------------------------------------- */}
      <div className={`rounded-xl p-3 border ${temFreteGratis ? 'bg-success-light border-[#99F6E4]' : 'bg-primary-light border-surface-border'}`}>
        {temFreteGratis ? (
          // Se já atingiu o frete grátis
          <div className="text-xs font-bold text-success">
            🚚 Parabéns! Você ganhou <strong>frete grátis</strong>!
          </div>
        ) : (
          // Se ainda não atingiu
          <>
            <div className="text-xs text-text-primary">
              🚚 Falta <strong className="text-primary">
                R$ {faltaParaFreteGratis.toFixed(2).replace('.', ',')}
              </strong> para ganhar frete grátis
            </div>
            
            {/* Barra de progresso */}
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${progressoFrete}%` }}
              />
            </div>
            
            {/* Texto explicativo */}
            <div className="text-[10px] text-text-hint mt-1">
              Carrinho: R$ {valorCarrinho.toFixed(2).replace('.', ',')} / mín. R$ {freteGratisMin},00
            </div>
          </>
        )}
      </div>

      {/* -----------------------------------------
          SEÇÃO 4: CÁLCULO DE FRETE (CEP)
          ----------------------------------------- */}
      <div className="border border-surface-border rounded-xl p-3 bg-[#F9FAFB]">
        <div className="text-[11px] font-bold text-text-primary uppercase tracking-wide mb-2">
          Calcular Frete
        </div>
        
        {/* Input + Botão */}
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && consultarFrete()}
            maxLength={9} // 8 números + 1 hífen
            className="flex-1 border-[1.5px] border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white"
          />
          <button 
            onClick={consultarFrete}
            disabled={!isValidCEP(cep)}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary-mid transition-colors disabled:bg-surface-border disabled:text-text-hint disabled:cursor-not-allowed"
          >
            OK
          </button>
        </div>
        
        {/* Lista de transportadoras (aparece depois de consultar) */}
        {cepConsultado && transportadoras.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 animate-[fadeUp_0.3s_ease]">
            {transportadoraSelecionada !== null ? (
              // Se já selecionou uma, mostra só ela com botão "alterar"
              <div>
                <div className="flex items-center gap-2 p-2.5 border-[1.5px] border-primary bg-primary-light rounded-lg">
                  <div className="flex-1 text-xs font-semibold text-text-primary">
                    {transportadoras[transportadoraSelecionada].nome}
                  </div>
                  <div className="text-[11px] text-text-hint">
                    {transportadoras[transportadoraSelecionada].prazo}
                  </div>
                  <div className={`text-sm font-bold ${transportadoras[transportadoraSelecionada].valor === 'Grátis' ? 'text-success' : 'text-text-primary'}`}>
                    {transportadoras[transportadoraSelecionada].valor}
                  </div>
                  <button 
                    onClick={() => setTransportadoraSelecionada(null)}
                    className="text-[11px] text-primary underline whitespace-nowrap"
                  >
                    alterar
                  </button>
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  📍 Entregando para <strong>{cep}</strong>
                </div>
              </div>
            ) : (
              // Se não selecionou, mostra a lista para escolher
              transportadoras.map((t, i) => (
                <label 
                  key={i} 
                  className="flex items-center gap-2 p-2.5 border-[1.5px] border-surface-border rounded-lg cursor-pointer hover:border-primary-mid transition-colors bg-white"
                  onClick={() => setTransportadoraSelecionada(i)}
                >
                  <input 
                    type="radio" 
                    name="transportadora" 
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
              ))
            )}
          </div>
        )}
      </div>

      {/* -----------------------------------------
          SEÇÃO 5: CUPOM DE DESCONTO
          ----------------------------------------- */}
      {!cupomAplicado ? (
        // Se não tem cupom aplicado
        <div>
          {!mostrarInputCupom ? (
            // Mostra o link para abrir o input
            <button 
              onClick={() => setMostrarInputCupom(true)}
              className="text-xs text-primary underline hover:no-underline"
            >
              🏷️ Tenho um cupom de desconto
            </button>
          ) : (
            // Mostra o input para digitar
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
              {/* Mensagem de erro (se o pai retornar erro) */}
              {erroCupom && (
                <div className="text-[11px] text-danger mt-1 font-medium">{erroCupom}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Se tem cupom aplicado, mostra o card verde de sucesso
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

      {/* Linha divisória */}
      <div className="h-px bg-surface-border" />

      {/* -----------------------------------------
          SEÇÃO 6: TERMOS E CONDIÇÕES
          Checkbox que o usuário precisa marcar
          ----------------------------------------- */}
      <label className="flex gap-2 items-start cursor-pointer">
        {/* Quadrado do checkbox customizado */}
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
        
        {/* Texto dos termos */}
        <span className="text-[11px] text-text-muted leading-relaxed">
          Li e aceito os{' '}
          <a href="#" className="text-primary font-semibold hover:underline">Termos</a>
          {' '}e a{' '}
          <a href="#" className="text-primary font-semibold hover:underline">Política de Privacidade</a>
        </span>
      </label>

      {/* -----------------------------------------
          SEÇÃO 7: BOTÕES DE AÇÃO
          ----------------------------------------- */}
      <div className="flex flex-col gap-2">
        {/* Botão principal: Comprar Agora */}
        <button 
          className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-bold hover:bg-primary-mid active:scale-[0.98] transition-all disabled:bg-surface-border disabled:text-text-hint disabled:cursor-not-allowed disabled:active:scale-100"
          disabled={!aceitouTermos}
          onClick={() => onAddToCart(quantidade)}
        >
          {!aceitouTermos ? 'Aceite os termos para continuar' : 'Comprar agora'}
        </button>
        
        {/* Botão secundário: Adicionar ao Carrinho */}
        <button 
          className="w-full bg-white text-primary border-[1.5px] border-primary rounded-xl py-3 text-sm font-semibold hover:bg-primary-light active:scale-[0.98] transition-all"
          onClick={() => onAddToCart(quantidade)}
        >
          Adicionar ao carrinho
        </button>
      </div>

      {/* Linha divisória */}
      <div className="h-px bg-surface-border" />

      {/* -----------------------------------------
          SEÇÃO 8: GARANTIAS (Ícones)
          ----------------------------------------- */}
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