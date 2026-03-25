// ==========================================
// COMPONENTE: PaymentModal
// ==========================================
// Responsabilidade: Mostrar modal com formas de pagamento (PIX e parcelamentos)
// O que faz: Exibe opções de pagamento, permite selecionar parcelamento, confirma escolha
// Recebe: Estado de aberto/fechado, preços, lista de parcelamentos, cupom
// Estados: Parcelamento selecionado

'use client'; // Precisa ser client porque usa useState (parcela selecionada)

import { useState } from 'react';
import type { Parcelamento } from '../../types/product.types';

// ==========================================
// INTERFACE DAS PROPS (o que o componente recebe)
// ==========================================
interface PaymentModalProps {
  isOpen: boolean;                    // true = modal visível, false = escondido
  onClose: () => void;                // função que fecha o modal (vem do pai)
  precoPix: string;                   // valor no PIX ex: "R$ 679,91"
  descontoPix: number;                // % de desconto ex: 15
  parcelamentos: Parcelamento[];      // array com opções de parcelamento
  precoFinalPix?: number;             // valor final se tiver cupom (opcional)
  onConfirmar?: () => void;           // função chamada ao clicar em "Confirmar" (opcional)
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function PaymentModal({
  isOpen,
  onClose,
  precoPix,
  descontoPix,
  parcelamentos,
  precoFinalPix,
  onConfirmar,
}: PaymentModalProps) {
  
  // -----------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------
  
  // Qual parcelamento está selecionado (começa no primeiro = à vista)
  const [parcelaSelecionada, setParcelaSelecionada] = useState(0);

  // Se o modal não estiver aberto, não renderiza nada (retorna null)
  // Isso é importante para não poluir o DOM quando fechado
  if (!isOpen) return null;

  // ==========================================
  // RENDER (estrutura do modal)
  // ==========================================
  return (
    // OVERLAY: fundo escuro semi-transparente que cobre a tela inteira
    // fixed: posição fixa na tela (não rola com a página)
    // inset-0: ocupa 100% da tela (top, right, bottom, left = 0)
    // bg-black/45: preto com 45% de opacidade
    // z-[100]: camada muito alta (fica acima de tudo)
    // flex: usa flexbox para centralizar
    // items-end: alinha no final (bottom) no mobile
    // sm:items-center: em telas maiores (sm+), centraliza verticalmente
    // justify-center: centraliza horizontalmente
    <div 
      className="fixed inset-0 bg-black/45 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose} // Clica no fundo escuro = fecha o modal
    >
      {/* CONTEÚDO DO MODAL: caixa branca com as informações */}
      {/* 
        bg-white: fundo branco
        rounded-t-[18px]: cantos superiores arredondados (mobile - estilo bottom sheet)
        sm:rounded-2xl: em telas maiores, todos os cantos arredondados
        p-5: padding interno (20px)
        sm:p-6: em telas maiores, padding maior (24px)
        w-full: largura 100% no mobile
        max-w-md: largura máxima 448px (não fica muito largo no desktop)
        max-h-[90vh]: altura máxima 90% da tela (não ultrapassa a viewport)
        overflow-y-auto: se conteúdo for maior que 90vh, aparece scroll vertical
        animate-[slideUp_0.3s_ease]: animação de entrada (sobe de baixo)
      */}
      <div 
        className="bg-white rounded-t-[18px] sm:rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease]"
        onClick={(e) => e.stopPropagation()} // Impede que clique na caixa feche o modal
      >
        
        {/* -----------------------------------------
            CABEÇALHO: Título + botão fechar
            ----------------------------------------- */}
        <div className="flex items-center justify-between mb-5">
          {/* Título do modal */}
          <h3 className="text-base font-extrabold text-text-primary">
            Formas de Pagamento
          </h3>
          
          {/* Botão X para fechar */}
          {/* 
            w-8 h-8: tamanho 32x32px
            bg-[#F3F4F6]: cinza claro de fundo
            rounded-full: formato circular
            flex items-center justify-center: centraliza o X
            text-lg: tamanho da fonte do X
            hover:bg-surface-border: fica mais escuro ao passar mouse
            transition-colors: animação suave da cor
          */}
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-[#F3F4F6] rounded-full flex items-center justify-center text-lg hover:bg-surface-border transition-colors"
          >
            ×
          </button>
        </div>

        {/* -----------------------------------------
            BLOCO PIX: Destaque para pagamento PIX
            ----------------------------------------- */}
        {/* 
          bg-pix-bg: fundo verde claro (definido no tailwind.config)
          border-[1.5px]: borda de 1.5px
          border-[#99F6E4]: cor verde da borda
          rounded-xl: cantos arredondados
          p-3.5: padding interno
          mb-1.5: margem inferior pequena
          flex items-center gap-3: layout em linha com espaçamento
        */}
        <div className="bg-pix-bg border-[1.5px] border-[#99F6E4] rounded-xl p-3.5 mb-1.5 flex items-center gap-3">
          {/* Ícone de dinheiro */}
          <span className="text-2xl">💸</span>
          
          {/* Textos */}
          <div className="flex-1">
            <div className="font-bold text-sm text-text-primary">PIX</div>
            <div className="text-xs text-text-muted">Preço final — aprovação instantânea</div>
          </div>
          
          {/* Valor */}
          <div className="text-right">
            {/* Se tiver precoFinalPix (com cupom), mostra ele, senão mostra precoPix normal */}
            <div className="text-xl font-extrabold text-text-primary">
              {precoFinalPix 
                ? `R$ ${precoFinalPix.toFixed(2).replace('.', ',')}`
                : precoPix
              }
            </div>
            {/* Porcentagem de desconto */}
            <div className="text-[11px] text-pix-text font-bold">
              {descontoPix}% de desconto já aplicado
            </div>
          </div>
        </div>

        {/* Aviso abaixo do PIX */}
        <div className="text-xs text-text-muted mb-4 pl-1">
          O desconto PIX já está incluído no valor acima.
        </div>

        {/* -----------------------------------------
            TÍTULO: Cartão de Crédito
            ----------------------------------------- */}
        <div className="text-[10px] font-bold text-text-hint uppercase tracking-wider mb-2">
          Cartão de Crédito — preço normal
        </div>

        {/* -----------------------------------------
            LISTA DE PARCELAMENTOS
            ----------------------------------------- */}
        {/* 
          flex flex-col gap-1: lista vertical com espaçamento pequeno entre itens
        */}
        <div className="flex flex-col gap-1">
          {/* Mapeia o array de parcelamentos e cria um item para cada um */}
          {parcelamentos.map((parcela, index) => (
            /* 
              LABEL: cada opção é clicável inteira
              onClick: seleciona essa parcela ao clicar
              className condicional: 
                - Se selecionado: borda azul, fundo azul claro
                - Se não selecionado: borda cinza, hover azul
            */
            <label 
              key={index}
              onClick={() => setParcelaSelecionada(index)}
              className={`flex items-center gap-2.5 p-2.5 border-[1.5px] rounded-lg cursor-pointer transition-all ${
                parcelaSelecionada === index 
                  ? 'border-primary bg-primary-light' 
                  : 'border-surface-border hover:border-primary-mid'
              }`}
            >
              {/* Radio button (input circular) */}
              {/* 
                type="radio": input de seleção única
                checked: true se for a parcela selecionada
                accent-primary: cor azul quando selecionado
                readOnly: não deixa editar direto no input (controlamos via estado)
              */}
              <input 
                type="radio" 
                name="parcelamento" 
                checked={parcelaSelecionada === index}
                className="accent-primary flex-shrink-0"
                readOnly
              />
              
              {/* Informações da parcela */}
              <div className="flex-1">
                {/* Número de parcelas e valor de cada uma */}
                <div className="text-sm font-bold text-text-primary">
                  {parcela.parcelas}x de {parcela.valor}
                </div>
                {/* Valor total */}
                <div className="text-xs text-text-hint">Total: {parcela.total}</div>
              </div>
              
              {/* Badge "sem juros" (só aparece se parcela.semJuros for true) */}
              {parcela.semJuros && (
                <span className="bg-success-light text-success-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                  sem juros
                </span>
              )}
            </label>
          ))}
        </div>

        {/* -----------------------------------------
            BOTÃO CONFIRMAR
            ----------------------------------------- */}
        <button 
          onClick={() => {
            // Se tiver callback onConfirmar, chama ele
            if (onConfirmar) onConfirmar();
            // Depois fecha o modal
            onClose();
          }}
          className="w-full bg-primary text-white rounded-lg py-3 mt-4 text-sm font-bold hover:bg-primary-mid active:scale-[0.98] transition-all"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}