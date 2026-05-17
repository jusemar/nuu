// ==========================================
// COMPONENTE: PaymentModal
// ==========================================
// Responsabilidade: Mostrar modal com formas de pagamento parcelado
// O que faz: Exibe opções de parcelamento de forma informativa
// Recebe: Estado de aberto/fechado, preços, lista de parcelamentos, cupom

"use client"; // Precisa ser client porque o modal fecha por interação do usuário

import type { Parcelamento } from "../../types/product.types";

// ==========================================
// INTERFACE DAS PROPS (o que o componente recebe)
// ==========================================
interface PaymentModalProps {
  isOpen: boolean; // true = modal visível, false = escondido
  onClose: () => void; // função que fecha o modal (vem do pai)
  parcelamentos: Parcelamento[]; // array com opções de parcelamento
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function PaymentModal({
  isOpen,
  onClose,
  parcelamentos,
}: PaymentModalProps) {
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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 sm:items-center"
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
        className="max-h-[90vh] w-full max-w-md animate-[slideUp_0.3s_ease] overflow-y-auto rounded-t-[18px] bg-white p-5 sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()} // Impede que clique na caixa feche o modal
      >
        {/* -----------------------------------------
            CABEÇALHO: Título + botão fechar
            ----------------------------------------- */}
        <div className="mb-5 flex items-center justify-between">
          {/* Título do modal */}
          <h3 className="text-text-primary text-base font-extrabold">
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
            className="hover:bg-surface-border flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* -----------------------------------------
            TÍTULO: Cartão de Crédito
            ----------------------------------------- */}
        <div className="text-text-hint mb-2 text-[10px] font-bold tracking-wider uppercase">
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
              DIV: cada opção é apenas informativa
              Não há seleção porque a escolha de parcelamento acontece no checkout/gateway
            */
            <div
              key={index}
              className="border-surface-border flex items-center gap-2.5 rounded-lg border-[1.5px] p-2.5"
            >
              {/* Informações da parcela */}
              <div className="flex-1">
                {/* Número de parcelas e valor de cada uma */}
                <div className="text-text-primary text-sm font-bold">
                  {parcela.parcelas}x de {parcela.valor}
                </div>
                {/* Valor total */}
                <div className="text-text-hint text-xs">
                  Total: {parcela.total}
                </div>
              </div>

              {/* Badge "sem juros" (só aparece se parcela.semJuros for true) */}
              {parcela.semJuros && (
                <span className="bg-success-light text-success-dark rounded-full px-2 py-0.5 text-[10px] font-bold">
                  sem juros
                </span>
              )}
            </div>
          ))}
        </div>

        {/* -----------------------------------------
            BOTÃO FECHAR
            ----------------------------------------- */}
        <button
          onClick={onClose}
          className="bg-primary hover:bg-primary-mid mt-4 w-full rounded-lg py-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
