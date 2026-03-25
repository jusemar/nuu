// ==========================================
// COMPONENTE: ProductInfo
// ==========================================
// Responsabilidade: Mostrar informações do produto (coluna do meio)
// Recebe: Dados do produto (nome, descrição, cores, tamanhos, etc)
// Estados: Cor selecionada, tamanho selecionado, modalidade de preço

'use client'; // Precisa ser client component porque usa useState (estados)

import { useState, useRef } from 'react'; // Hooks do React para estado e referências
import type { Cor, Tamanho, Modalidade } from '../../types/product.types'; // Tipos TypeScript
import { modalidades } from '../../constants/mockData'; // Dados das modalidades de preço
import { ChatVendedor } from '../chat-vendedor';
import { Stars } from '@/components/ui/stars';

// ==========================================
// INTERFACE DAS PROPS (o que o componente recebe)
// ==========================================
interface ProductInfoProps {
  nome: string;              // Nome do produto ex: "Aether Run Pro X"
  marca: string;             // Marca ex: "AETHER"
  sku: string;               // Código SKU ex: "ATH-RUN-PRX-42"
  rating: number;            // Nota de avaliação ex: 4.8
  totalAvaliacoes: number;   // Quantidade de avaliações ex: 2341
  vendedor: string;          // Nome do vendedor
  vendedorRating: number;    // % de avaliações positivas do vendedor
  descricao: string;         // Descrição completa do produto
  cores: Record<Cor, string>; // Objeto com cores: { preto: "#1a1a1a", ... }
  tamanhos: Tamanho[];       // Array de tamanhos: ["38", "39", ...]
  corInicial?: Cor;          // Cor que começa selecionada (opcional, padrão: preto)
}

// ==========================================
// COMPONENTE AUXILIAR: Estrelas de avaliação
// ==========================================
// Mostra 5 estrelas, preenchendo conforme a nota (rating)


// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductInfo({
  nome,
  marca,
  sku,
  rating,
  totalAvaliacoes,
  vendedor,
  vendedorRating,
  descricao,
  cores,
  tamanhos,
  corInicial = 'preto',
}: ProductInfoProps) {
  
  // -----------------------------------------
  // ESTADOS (useState) - "Memória" do componente
  // -----------------------------------------
  
  // Estado da cor selecionada (começa com a corInicial ou "preto")
  const [corSel, setCorSel] = useState<Cor>(corInicial);
  
  // Estado do tamanho selecionado (começa null = nenhum selecionado)
  const [tamSel, setTamSel] = useState<Tamanho | null>(null);
  
  // Estado da modalidade de preço selecionada (começa com "estoque")
  const [modalidadeSel, setModalidadeSel] = useState<Modalidade>('estoque');
  
  // Estado que controla se o dropdown de modalidades está aberto
  const [modalidadeOpen, setModalidadeOpen] = useState(false);
  
  // useRef = referência para guardar o timer do hover (evita bugs de mouse rápido)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------
  // DADOS AUXILIARES
  // -----------------------------------------
  
  // Descrição de cada tamanho em centímetros (para mostrar ao lado do tamanho)
  const tamDesc: Record<Tamanho, string> = {
    '38': '23.5cm',
    '39': '24.5cm',
    '40': '25cm',
    '41': '25.5cm',
    '42': '26cm',
    '43': '27cm',
    '44': '27.5cm',
  };

  // -----------------------------------------
  // FUNÇÕES DE EVENTO (HANDLERS)
  // -----------------------------------------
  
  // Quando mouse ENTRA na área de modalidade (desktop)
  // Espera 150ms antes de abrir (evita abrir sem querer)
  function handleModHoverEnter() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setModalidadeOpen(true), 150);
  }

  // Quando mouse SAI da área de modalidade (desktop)
  // Espera 200ms antes de fechar (evita fechar sem querer)
  function handleModHoverLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setModalidadeOpen(false), 200);
  }

  // Seleciona uma modalidade e fecha o dropdown
  function selecionarModalidade(key: Modalidade) {
    setModalidadeSel(key);
    setModalidadeOpen(false);
  }

  // Alterna aberto/fechado no mobile (click)
  function toggleModalidadeMobile() {
    setModalidadeOpen((o) => !o);
  }

  // Pega os dados da modalidade atualmente selecionada
  const mod = modalidades[modalidadeSel];

  // ==========================================
  // RENDER (o que aparece na tela)
  // ==========================================
  return (
    <div className="flex flex-col gap-4">
      
      {/* -----------------------------------------
          LINHA 1: MARCA + SKU
          Ex: AETHER  •  SKU: ATH-RUN-PRX-42
          ----------------------------------------- */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-text-hint tracking-widest uppercase">
          {marca}
        </span>
        <span className="w-1 h-1 rounded-full bg-surface-border-mid" />
        <span className="text-[11px] text-text-hint">SKU: {sku}</span>
      </div>

      {/* -----------------------------------------
          LINHA 2: NOME DO PRODUTO
          Ex: Aether Run Pro X
          ----------------------------------------- */}
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-text-primary">
        {nome}
      </h1>

      {/* -----------------------------------------
          LINHA 3: RATING + AVALIAÇÕES + VENDEDOR
          ★★★★★ 4.8  2.341 avaliações  •  Vendido por Sport Elite Store  98% positivo
          ----------------------------------------- */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Stars rating={rating} size="lg" />
        <span className="text-[13px] font-bold">{rating}</span>
        <a href="#" className="text-xs text-text-muted underline">
          {totalAvaliacoes.toLocaleString('pt-BR')} avaliações
        </a>
        <span className="w-1 h-1 rounded-full bg-surface-border-mid" />
        <span className="text-xs text-text-muted">
          Vendido por{' '}
          <a href="#" className="text-primary font-semibold no-underline">
            {vendedor}
          </a>
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success">
          {vendedorRating}% positivo
        </span>
      </div>

      {/* -----------------------------------------
          DIVISOR (linha cinza horizontal)
          ----------------------------------------- */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          DESCRIÇÃO DO PRODUTO
          ----------------------------------------- */}
      <p className="text-[13px] text-text-muted leading-relaxed">{descricao}</p>

      {/* -----------------------------------------
          DIVISOR
          ----------------------------------------- */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          SELETOR DE COR
          Mostra círculos coloridos. Clicar muda a cor selecionada.
          ----------------------------------------- */}
      <div>
        {/* Título + cor atual */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Cor
          </span>
          <span className="text-xs text-text-muted font-medium capitalize">
            {corSel}
          </span>
        </div>
        
        {/* Botões de cor */}
        <div className="flex gap-2">
          {(Object.keys(cores) as Cor[]).map((cor) => (
            <button
              key={cor}
              onClick={() => setCorSel(cor)} // Clica = muda cor selecionada
              title={cor}
              className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all flex-shrink-0 ${
                corSel === cor
                  ? 'outline outline-2 outline-primary outline-offset-2' // Selecionado: borda azul
                  : '' // Não selecionado: sem outline
              }`}
              style={{
                backgroundColor: cores[cor], // Cor de fundo = cor do produto
                borderColor:
                  cores[cor] === '#f5f5f0' ? '#D1D5DB' : cores[cor], // Branco tem borda cinza
              }}
            />
          ))}
        </div>
      </div>

      {/* -----------------------------------------
          SELETOR DE TAMANHO
          Botões 38, 39, 40, 41... O 40 está desabilitado (indisponível)
          ----------------------------------------- */}
      <div>
        {/* Título + tamanho em cm (se selecionado) */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Tamanho
            </span>
            {tamSel && (
              <span className="text-xs text-text-muted">— {tamDesc[tamSel]}</span>
            )}
          </div>
          <a href="#" className="text-xs text-primary underline">
            Guia de tamanhos
          </a>
        </div>
        
        {/* Botões de tamanho */}
        <div className="flex gap-1.5 flex-wrap">
          {tamanhos.map((t) => (
            <button
              key={t}
              onClick={() => t !== '40' && setTamSel(t)} // Clica = seleciona (exceto 40)
              className={`min-w-[42px] h-[38px] border-[1.5px] bg-white rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center px-2 ${
                tamSel === t
                  ? 'border-primary bg-primary text-white' // Selecionado: azul
                  : t === '40'
                  ? 'opacity-35 cursor-not-allowed line-through border-surface-border text-text-primary' // 40: desabilitado
                  : 'border-surface-border text-text-primary hover:border-primary-mid' // Normal
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-text-hint mt-1.5">
          Tam. 40 indisponível
        </div>
      </div>

      {/* -----------------------------------------
          DIVISOR
          ----------------------------------------- */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          MODALIDADE DE PREÇO
          Card que mostra a modalidade atual. Hover/click abre outras opções.
          ----------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Modalidade de preço
          </span>
        </div>

        {/* Container com eventos de mouse (hover desktop) */}
        <div onMouseEnter={handleModHoverEnter} onMouseLeave={handleModHoverLeave}>
          
          {/* CARD DA MODALIDADE SELECIONADA */}
          <div
            className="border-[1.5px] border-primary rounded-xl p-3 bg-white flex items-center gap-2.5 cursor-pointer transition-all hover:border-primary-mid shadow-[0_0_0_1px_#0C447C]"
            onClick={toggleModalidadeMobile} // Click no mobile alterna
          >
            <span className="text-xl">{mod.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[13px]">{mod.label}</span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: mod.badgeBg, color: mod.badgeColor }}
                >
                  {mod.badge}
                </span>
              </div>
              <div className="text-[11px] text-text-hint mt-0.5">
                🚚 {mod.prazo} · 🛡️ {mod.garantia} · por {mod.envia}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[13px] font-bold text-text-primary">
                {mod.precoPix}
              </div>
              <div className="text-[10px] text-success-dark font-semibold">
                no PIX
              </div>
            </div>
            {/* Setinha que gira quando aberto */}
            <div
              className="text-text-hint text-xs ml-1 transition-transform duration-200"
              style={{ transform: modalidadeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▾
            </div>
          </div>

          {/* HINT: Instrução para usuário (desktop vs mobile) */}
          <div className="hidden md:flex text-[11px] text-text-hint items-center gap-1 mt-1.5 select-none">
            <span>↕</span> Passe o mouse para ver outras modalidades
          </div>
          <div className="flex md:hidden text-[11px] text-text-hint items-center gap-1 mt-1.5 select-none">
            <span>↕</span> Toque para ver outras modalidades de preço
          </div>

          {/* DROPDOWN: Outras modalidades (aparece quando modalidadeOpen = true) */}
          {modalidadeOpen && (
            <div className="flex flex-col gap-1.5 mt-2 animate-[slideDown_0.2s_ease]">
              {(Object.keys(modalidades) as Modalidade[])
                .filter((k) => k !== modalidadeSel) // Mostra todas EXCETO a selecionada
                .map((key) => {
                  const m = modalidades[key];
                  return (
                    <div
                      key={key}
                      className="border-[1.5px] border-surface-border rounded-xl p-3 bg-white flex items-center gap-2.5 cursor-pointer transition-all hover:border-primary-mid hover:bg-primary-light"
                      onClick={() => selecionarModalidade(key)} // Clica = seleciona
                    >
                      <span className="text-lg">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[13px]">{m.label}</span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: m.badgeBg, color: m.badgeColor }}
                          >
                            {m.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-hint mt-0.5">
                          🚚 {m.prazo} · 🛡️ {m.garantia}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-extrabold text-sm text-text-primary">
                          {m.precoPix}{' '}
                          <span className="text-[10px] text-text-muted font-medium">
                            PIX
                          </span>
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {m.precoNormal} cartão
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* -----------------------------------------
          DIVISOR
          ----------------------------------------- */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          CHAT COM VENDEDOR
          Bloco com ícone, status online e botão
          ----------------------------------------- */}
      <ChatVendedor 
  vendedorNome={vendedor}
  status="online"
  tempoResposta="Responde em minutos"
  onClick={() => {
    // Aqui você abre o chat real, modal, ou redireciona
    console.log('Abrir chat com:', vendedor);
  }}
/>
    </div>
  );
}