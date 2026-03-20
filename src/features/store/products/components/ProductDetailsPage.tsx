"use client";

import { useState, useRef } from "react";

type Modalidade = "estoque" | "prevenda" | "drop" | "fabrica";
type Aba = "descricao" | "especificacoes" | "avaliacoes" | "entrega";
type Cor = "preto" | "branco" | "azul" | "vermelho";
type Tamanho = "38" | "39" | "40" | "41" | "42" | "43" | "44";

// =====================================================================
// DESIGN TOKENS - Paleta de cores definida
// =====================================================================
const T = {
  primary:      "#0C447C",      // Azul corporativo
  primaryMid:   "#1E3A8A",      // Azul médio para hover
  primaryLight: "#EFF6FF",      // Azul claro para fundos
  accent:       "#EF9F27",      // Âmbar para destaques/urgência
  accentDark:   "#B45309",      // Âmbar escuro
  accentLight:  "#FFFBEB",      // Âmbar claro
  success:      "#14B8A6",      // Teal para sucesso/PIX
  successLight: "#F0FDFA",      // Teal claro
  successDark:  "#0F766E",      // Teal escuro
  text:         "#1F2937",      // Texto principal
  muted:        "#6B7280",      // Texto secundário
  hint:         "#9CA3AF",      // Texto terciário
  border:       "#E5E7EB",      // Bordas
  borderMid:    "#D1D5DB",      // Bordas médias
  bg:           "#F8F8F6",      // Fundo da página
  surface:      "#FFFFFF",      // Fundo de cards
  danger:       "#DC2626",      // Vermelho para erros
};

// =====================================================================
// DADOS DO PRODUTO
// =====================================================================
const produto = {
  nome: "Aether Run Pro X",
  marca: "AETHER",
  sku: "ATH-RUN-PRX-42",
  vendedor: "Sport Elite Store",
  vendedorRating: 98,
  descricao: "Performance máxima para quem não aceita menos que o melhor. O Aether Run Pro X combina tecnologia de amortecimento dinâmico AetherFoam v3 com cabedal em malha Flyknit respirável. Placa de carbono integrada para máximo retorno de energia. Ideal para corridas de longa distância e treinos intensos.",
  imagens: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=90",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&q=90",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&q=90",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=900&q=90",
  ],
  cores: { preto: "#1a1a1a", branco: "#f5f5f0", azul: "#1d4ed8", vermelho: "#dc2626" } as Record<Cor, string>,
  tamanhos: ["38","39","40","41","42","43","44"] as Tamanho[],
  rating: 4.8,
  totalAvaliacoes: 2341,
  estoque: 47,
  especificacoes: [
    { label: "Material do Cabedal", valor: "Malha Flyknit Pro" },
    { label: "Solado", valor: "Borracha vulcanizada grip 360°" },
    { label: "Amortecimento", valor: "AetherFoam v3 + Placa de carbono" },
    { label: "Peso", valor: "228g (par no 42)" },
    { label: "Drop", valor: "8mm" },
    { label: "Indicado para", valor: "Asfalto, pista e esteira" },
    { label: "Garantia", valor: "12 meses" },
    { label: "Origem", valor: "Brasil" },
  ],
  avaliacoes: [
    { nome: "Rodrigo M.", data: "12 Mar 2025", estrelas: 5, comentario: "Melhor tênis que já usei para corrida. O amortecimento é incrível e meu joelho não dói mais após treinos longos.", iniciais: "RM", cor: T.primaryLight },
    { nome: "Camila S.", data: "8 Mar 2025", estrelas: 5, comentario: "Leve, confortável e com um design impecável. Recebi em 2 dias pelo estoque próprio. Super recomendo!", iniciais: "CS", cor: T.successLight },
    { nome: "Felipe A.", data: "1 Mar 2025", estrelas: 4, comentario: "Produto excelente, só fiquei sem 1 estrela porque o tamanho fechou um pouco. Peça meio número acima.", iniciais: "FA", cor: T.accentLight },
  ],
  upsell: [
    { nome: "Meia Compressão Pro", preco: "R$ 89,90", img: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80", tag: "Mais vendido" },
    { nome: "Bolsa Running Pack", preco: "R$ 249,90", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80", tag: null },
    { nome: "Óculos Sport Shield", preco: "R$ 319,90", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80", tag: "Novo" },
    { nome: "Camiseta Dry-Fit Ultra", preco: "R$ 149,90", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80", tag: null },
  ],
};

// =====================================================================
// MODALIDADES DE PREÇO
// =====================================================================
const modalidades = {
  estoque:  { 
    label: "Estoque Próprio",     
    badge: "Entrega rápida",       
    badgeBg: T.successLight, 
    badgeColor: T.success,    
    precoNormal: "R$ 799,90", 
    precoParc: "3x de R$ 253,97 sem juros", 
    precoPix: "R$ 679,91", 
    prazo: "2 a 5 dias úteis",   
    envia: "Sport Elite Store",  
    garantia: "12 meses", 
    icon: "🏪" 
  },
  prevenda: { 
    label: "Pré-Venda",           
    badge: "Reserve já",           
    badgeBg: T.primaryLight, 
    badgeColor: T.primary,    
    precoNormal: "R$ 749,90", 
    precoParc: "3x de R$ 237,97 sem juros", 
    precoPix: "R$ 637,41", 
    prazo: "15 a 25 dias úteis", 
    envia: "Sport Elite Store",  
    garantia: "12 meses", 
    icon: "📅" 
  },
  drop:     { 
    label: "Dropshipping",        
    badge: "Direto do fornecedor", 
    badgeBg: "#EDE7F6",      
    badgeColor: "#6D28D9",    
    precoNormal: "R$ 699,90", 
    precoParc: "3x de R$ 221,97 sem juros", 
    precoPix: "R$ 594,91", 
    prazo: "10 a 18 dias úteis", 
    envia: "Fornecedor Central", 
    garantia: "6 meses",  
    icon: "🚚" 
  },
  fabrica:  { 
    label: "Fábrica / Lote",      
    badge: "Menor preço",          
    badgeBg: T.accentLight,  
    badgeColor: T.accentDark, 
    precoNormal: "R$ 599,90", 
    precoParc: "3x de R$ 189,97 sem juros", 
    precoPix: "R$ 509,91", 
    prazo: "30 a 45 dias úteis", 
    envia: "Fábrica Parceira",   
    garantia: "6 meses",  
    icon: "🏭" 
  },
};

// =====================================================================
// TRANSPORTADORAS
// =====================================================================
const transportadoras = [
  { nome: "Total Express",  prazo: "5 dias úteis", valor: "Grátis",    destaque: true  },
  { nome: "Correios PAC",   prazo: "4 dias úteis", valor: "R$ 18,90",  destaque: false },
  { nome: "Correios SEDEX", prazo: "2 dias úteis", valor: "R$ 34,90",  destaque: false },
  { nome: "Jadlog Package", prazo: "3 dias úteis", valor: "R$ 22,90",  destaque: false },
];

// =====================================================================
// PARCELAMENTOS
// =====================================================================
const parcelamentos = [
  { parcelas: 1,  valor: "R$ 799,90", total: "R$ 799,90", semJuros: true  },
  { parcelas: 2,  valor: "R$ 399,95", total: "R$ 799,90", semJuros: true  },
  { parcelas: 3,  valor: "R$ 266,63", total: "R$ 799,90", semJuros: true  },
  { parcelas: 4,  valor: "R$ 207,98", total: "R$ 831,92", semJuros: false },
  { parcelas: 5,  valor: "R$ 168,46", total: "R$ 842,30", semJuros: false },
  { parcelas: 6,  valor: "R$ 142,30", total: "R$ 853,80", semJuros: false },
  { parcelas: 8,  valor: "R$ 109,72", total: "R$ 877,76", semJuros: false },
  { parcelas: 10, valor: "R$ 89,65",  total: "R$ 896,50", semJuros: false },
];

// =====================================================================
// CUPONS
// =====================================================================
const cuponsValidos: Record<string, { desconto: number; label: string }> = {
  PRIMEIRA10: { desconto: 10, label: "10% de desconto para novos clientes" },
  FRETE15:    { desconto: 15, label: "15% OFF especial" },
  RUN20:      { desconto: 20, label: "20% para corredores" },
};

const FRETE_GRATIS_MIN = 299;

// =====================================================================
// COMPONENTE DE ESTRELAS
// =====================================================================
function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ 
          color: i <= Math.round(rating) ? T.accent : T.borderMid, 
          fontSize: size === "lg" ? 15 : 11 
        }}>★</span>
      ))}
    </span>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export function ProductDetail() {
  // Estados
  const [imgAtiva, setImgAtiva]               = useState(0);
  const [corSel, setCorSel]                   = useState<Cor>("preto");
  const [tamSel, setTamSel]                   = useState<Tamanho | null>(null);
  const [modalidadeSel, setModalidadeSel]     = useState<Modalidade>("estoque");
  const [modalidadeOpen, setModalidadeOpen]   = useState(false);
  const [aba, setAba]                         = useState<Aba>("descricao");
  const [qty, setQty]                         = useState(1);
  const [termos, setTermos]                   = useState(false);
  const [cepDigitado, setCepDigitado]         = useState("");
  const [cepConfirmado, setCepConfirmado]     = useState("");
  const [transSel, setTransSel]               = useState<number | null>(null);
  const [mostrarTransp, setMostrarTransp]     = useState(false);
  const [favoritado, setFavoritado]           = useState(false);
  const [modalPgto, setModalPgto]             = useState(false);
  const [parcSel, setParcSel]                 = useState(0);
  const [showShare, setShowShare]             = useState(false);
  const [cartCount, setCartCount]             = useState(0);
  const [cupomInput, setCupomInput]           = useState("");
  const [cupomAplicado, setCupomAplicado]     = useState<null | { desconto: number; label: string; code: string }>(null);
  const [cupomErro, setCupomErro]             = useState("");
  const [showCupomField, setShowCupomField]   = useState(false);
  const hoverTimerRef                         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mod = modalidades[modalidadeSel];
  const precoPixBase  = parseFloat(mod.precoPix.replace("R$ ","").replace(",","."));
  const precoNormBase = parseFloat(mod.precoNormal.replace("R$ ","").replace(",","."));
  const descontoPix   = Math.round((1 - precoPixBase / precoNormBase) * 100);
  const precoFinalPix = cupomAplicado ? precoPixBase * (1 - cupomAplicado.desconto / 100) : precoPixBase;
  const formatBRL     = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Frete grátis progressivo
  const valorCarrinho = precoPixBase * qty;
  const freteGratisAtingido = valorCarrinho >= FRETE_GRATIS_MIN;
  const progressoFrete = Math.min((valorCarrinho / FRETE_GRATIS_MIN) * 100, 100);
  const faltaFrete = Math.max(FRETE_GRATIS_MIN - valorCarrinho, 0);

  // Handlers modalidade (hover desktop / click mobile)
  function handleModHoverEnter() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setModalidadeOpen(true), 150);
  }
  function handleModHoverLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setModalidadeOpen(false), 200);
  }
  function selecionarModalidade(key: Modalidade) {
    setModalidadeSel(key);
    setModalidadeOpen(false);
  }
  function toggleModalidadeMobile() {
    setModalidadeOpen(o => !o);
  }

  // Handlers CEP
  function consultarCep() {
    const s = cepDigitado.replace(/\D/g,"");
    if (s.length === 8) { setCepConfirmado(cepDigitado); setMostrarTransp(true); setTransSel(null); }
  }
  function formatCepInput(v: string) {
    const s = v.replace(/\D/g,"").slice(0,8);
    setCepDigitado(s.length > 5 ? `${s.slice(0,5)}-${s.slice(5)}` : s);
    if (s.length < 8) { setMostrarTransp(false); setTransSel(null); }
  }

  // Handlers cupom
  function aplicarCupom() {
    const code = cupomInput.trim().toUpperCase();
    if (cuponsValidos[code]) { 
      setCupomAplicado({ ...cuponsValidos[code], code }); 
      setCupomErro(""); 
    } else { 
      setCupomErro("Cupom inválido ou expirado."); 
      setCupomAplicado(null); 
    }
  }
  function removerCupom() { 
    setCupomAplicado(null); 
    setCupomInput(""); 
    setCupomErro(""); 
  }

  const tamDesc: Record<Tamanho, string> = { 
    "38":"23.5cm","39":"24.5cm","40":"25cm","41":"25.5cm","42":"26cm","43":"27cm","44":"27.5cm" 
  };

  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:T.bg, minHeight:"100vh", color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .28s ease both}
        .as{animation:scaleIn .18s ease both}
        .asd{animation:slideDown .2s ease both}

        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px}

        .thumb{width:64px;height:64px;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:all .15s;background:#fff;flex-shrink:0}
        .thumb img{width:100%;height:100%;object-fit:cover;display:block}
        .thumb.on{border-color:${T.primary}}
        .thumb:not(.on){opacity:.5}
        .thumb:not(.on):hover{opacity:.8}

        .mimg{position:relative;background:#EFEFED;border-radius:14px;overflow:hidden;aspect-ratio:1/1;width:100%}
        .mimg img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s ease}
        .mimg:hover img{transform:scale(1.035)}

        .div{height:1px;background:${T.border};width:100%}

        .buybox{background:#fff;border:1px solid ${T.border};border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:16px;position:sticky;top:72px}

        .mcard{border:1.5px solid ${T.border};border-radius:10px;padding:12px 14px;transition:all .15s;background:#fff;display:flex;align-items:center;gap:11px}
        .mcard.on{border-color:${T.primary};box-shadow:0 0 0 1px ${T.primary}}
        .mcard-trigger{cursor:pointer}
        .mcard-trigger:hover{border-color:${T.primaryMid}}
        .mcard-option{cursor:pointer}
        .mcard-option:hover{border-color:${T.primaryMid};background:${T.primaryLight}}

        .tab{padding:10px 0;font-size:13px;font-weight:600;color:${T.hint};border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap;font-family:inherit}
        .tab.on{color:${T.primary};border-bottom-color:${T.primary}}

        .btnp{background:${T.primary};color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;padding:14px;cursor:pointer;transition:all .15s;width:100%;font-family:inherit;letter-spacing:.01em}
        .btnp:hover:not(:disabled){background:${T.primaryMid};transform:translateY(-1px)}
        .btnp:disabled{background:${T.border};color:${T.hint};cursor:not-allowed;transform:none}
        .btnout{background:#fff;color:${T.primary};border:1.5px solid ${T.primary};border-radius:10px;font-size:14px;font-weight:600;padding:13px;cursor:pointer;transition:all .15s;width:100%;font-family:inherit}
        .btnout:hover{background:${T.primaryLight}}
        .btnout:disabled{border-color:${T.border};color:${T.hint};cursor:not-allowed}

        .qbtn{width:30px;height:30px;border:1.5px solid ${T.border};background:#fff;border-radius:7px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${T.text};transition:border-color .15s;font-family:inherit;line-height:1}
        .qbtn:hover{border-color:${T.primary}}

        .inp{border:1.5px solid ${T.border};border-radius:8px;padding:9px 12px;font-size:13px;outline:none;font-family:inherit;transition:border-color .15s;background:#fff;width:100%}
        .inp:focus{border-color:${T.primary}}

        .frow{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ${T.border};border-radius:8px;cursor:pointer;transition:all .15s;background:#fff}
        .frow.on{border-color:${T.primary};background:${T.primaryLight}}
        .frow:hover:not(.on){border-color:${T.primaryMid}}

        .srow{display:flex;justify-content:space-between;align-items:center;padding:11px 16px;border-bottom:1px solid #F3F4F6}
        .srow:nth-child(odd){background:#FAFAFA}
        .srow:last-child{border-bottom:none}

        .rcard{background:#fff;border:1px solid #F3F4F6;border-radius:10px;padding:16px}

        .ucard{background:#fff;border:1px solid #F3F4F6;border-radius:10px;overflow:hidden;cursor:pointer;transition:all .18s}
        .ucard:hover{box-shadow:0 6px 20px rgba(0,0,0,.08);transform:translateY(-2px)}
        .ucard img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}

        .moverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:flex-end;justify-content:center}
        @media(min-width:640px){.moverlay{align-items:center}}
        .mbox{background:#fff;border-radius:18px 18px 0 0;padding:22px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
        @media(min-width:640px){.mbox{border-radius:16px}}

        .prow{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ${T.border};border-radius:8px;cursor:pointer;transition:all .15s}
        .prow.on{border-color:${T.primary};background:${T.primaryLight}}

        .shdd{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid ${T.border};border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.1);padding:5px;min-width:155px;z-index:30}
        .shdd button{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;font-size:13px;background:none;border:none;cursor:pointer;border-radius:6px;font-family:inherit;color:${T.text};transition:background .1s}
        .shdd button:hover{background:${T.primaryLight}}

        .sbtrack{flex:1;height:5px;border-radius:99px;background:#F3F4F6;overflow:hidden}
        .sbfill{height:5px;border-radius:99px;background:${T.accent}}

        .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}

        .tbtn{min-width:42px;height:38px;border:1.5px solid ${T.border};background:#fff;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;color:${T.text};padding:0 8px;display:flex;align-items:center;justify-content:center}
        .tbtn:hover:not(.on):not(.off){border-color:${T.primaryMid}}
        .tbtn.on{border-color:${T.primary};background:${T.primary};color:#fff}
        .tbtn.off{opacity:.35;cursor:not-allowed;text-decoration:line-through}

        .cbtn{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:all .15s;flex-shrink:0}
        .cbtn.on{outline:2px solid ${T.primary};outline-offset:2px}

        .banner{background:linear-gradient(135deg,${T.primary} 0%,${T.primaryMid} 100%);border-radius:12px;padding:14px 16px;color:#fff;display:flex;align-items:center;gap:12px;overflow:hidden;position:relative}
        .banner::after{content:'';position:absolute;right:-20px;top:-20px;width:90px;height:90px;background:rgba(255,255,255,.06);border-radius:50%}

        .pix-block{background:${T.successLight};border:1px solid #99F6E4;border-radius:10px;padding:12px 14px}

        .frete-progress-track{height:6px;border-radius:99px;background:${T.border};overflow:hidden;margin-top:8px}
        .frete-progress-fill{height:6px;border-radius:99px;background:${T.success};transition:width .4s ease}

        .mod-hint{font-size:11px;color:${T.hint};display:flex;align-items:center;gap:4px;margin-top:6px;user-select:none}
        @media(max-width:768px){.mod-hint{display:none}}
        .mod-hint-mobile{font-size:11px;color:${T.hint};display:none;align-items:center;gap:4px;margin-top:6px;user-select:none}
        @media(max-width:768px){.mod-hint-mobile{display:flex}}

        @media(max-width:1024px){
          .pgrid{grid-template-columns:1fr 1fr!important}
          .col3{display:none!important}
        }
        @media(max-width:640px){
          .pgrid{grid-template-columns:1fr!important}
          .ugrid{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>

      {/* HEADER */}
      <header style={{ background:"#fff", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:40 }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <span style={{ fontWeight:800, fontSize:18, letterSpacing:"-0.04em", color:T.primary }}>AETHER<span style={{ color:T.hint, fontWeight:400, fontSize:12, marginLeft:2 }}>store</span></span>
          <div style={{ flex:1, maxWidth:420, display:"flex" }}>
            <div style={{ display:"flex", width:"100%", border:`1.5px solid ${T.border}`, borderRadius:9, overflow:"hidden" }}>
              <input placeholder="Buscar produtos..." style={{ flex:1, border:"none", padding:"8px 14px", fontSize:13, outline:"none", fontFamily:"inherit", background:"transparent" }} />
              <button style={{ background:T.primary, border:"none", padding:"0 16px", cursor:"pointer", display:"flex", alignItems:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
          </div>
          <nav style={{ display:"flex", gap:22 }}>
            {["Coleções","Novidades","Promoções"].map(n=>(
              <a key={n} href="#" style={{ fontSize:13, color:T.muted, textDecoration:"none", fontWeight:500 }}
                onMouseEnter={e=>e.currentTarget.style.color=T.primary}
                onMouseLeave={e=>e.currentTarget.style.color=T.muted}>{n}</a>
            ))}
          </nav>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ width:36, height:36, background:T.primaryLight, border:`1px solid ${T.border}`, borderRadius:9, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <button onClick={()=>setCartCount(c=>c+1)} style={{ position:"relative", background:T.primary, color:"#fff", border:"none", borderRadius:9, padding:"8px 14px", display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Carrinho
              {cartCount>0&&<span style={{ position:"absolute", top:-6, right:-6, background:T.danger, color:"#fff", fontSize:9, fontWeight:700, width:17, height:17, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #fff" }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"10px 24px", display:"flex", gap:6, fontSize:12, color:T.hint, alignItems:"center" }}>
        {["Home","Tênis","Corrida"].map(b=>(
          <span key={b} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <a href="#" style={{ color:T.hint, textDecoration:"none" }}
              onMouseEnter={e=>e.currentTarget.style.color=T.primary}
              onMouseLeave={e=>e.currentTarget.style.color=T.hint}>{b}</a>
            <span style={{ color:T.borderMid }}>/</span>
          </span>
        ))}
        <span style={{ color:T.primary, fontWeight:600 }}>Aether Run Pro X</span>
      </div>

      {/* MAIN GRID */}
      <main style={{ maxWidth:1280, margin:"0 auto", padding:"4px 24px 80px" }}>
        <div className="pgrid" style={{ display:"grid", gridTemplateColumns:"420px 1fr 300px", gap:24, alignItems:"start" }}>

          {/* COL 1 — GALERIA */}
          <div style={{ display:"flex", gap:10, alignItems:"flex-start", position:"sticky", top:70 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {produto.imagens.map((img,i)=>(
                <div key={i} className={`thumb ${i===imgAtiva?"on":""}`} onClick={()=>setImgAtiva(i)}>
                  <img src={img} alt={`vista ${i+1}`} />
                </div>
              ))}
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
              <div className="mimg">
                <img src={produto.imagens[imgAtiva]} alt="Produto" />
                <div style={{ position:"absolute", top:12, left:12, background:T.accent, color:"#fff", fontSize:10, fontWeight:800, padding:"4px 10px", borderRadius:99, letterSpacing:".06em" }}>LANÇAMENTO</div>
                <div style={{ position:"absolute", top:12, right:12, display:"flex", flexDirection:"column", gap:6 }}>
                  <button onClick={()=>setFavoritado(f=>!f)} style={{ width:32, height:32, background:"#fff", border:`1.5px solid ${T.border}`, borderRadius:99, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                    {favoritado ? "❤️" : "🤍"}
                  </button>
                  <div style={{ position:"relative" }}>
                    <button onClick={()=>setShowShare(s=>!s)} style={{ width:32, height:32, background:"#fff", border:`1.5px solid ${T.border}`, borderRadius:99, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </button>
                    {showShare&&(
                      <div className="shdd as">
                        {[["📘","Facebook"],["🐦","Twitter / X"],["🔗","Copiar link"]].map(([icon,label])=>(
                          <button key={label} onClick={()=>setShowShare(false)}><span>{icon}</span>{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={()=>setImgAtiva(i=>(i-1+produto.imagens.length)%produto.imagens.length)} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", width:28, height:28, background:"rgba(255,255,255,.9)", border:"none", borderRadius:99, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:T.text }}>‹</button>
                <button onClick={()=>setImgAtiva(i=>(i+1)%produto.imagens.length)} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", width:28, height:28, background:"rgba(255,255,255,.9)", border:"none", borderRadius:99, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:T.text }}>›</button>
                <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
                  {produto.imagens.map((_,i)=>(
                    <span key={i} onClick={()=>setImgAtiva(i)} style={{ width:i===imgAtiva?16:5, height:5, borderRadius:99, background:i===imgAtiva?T.primary:"#ccc", cursor:"pointer", transition:"width .2s" }} />
                  ))}
                </div>
              </div>
              {/* Banner Frete Grátis */}
              <div className="banner">
                <div style={{ fontSize:22, flexShrink:0 }}>🏃</div>
                <div style={{ flex:1, zIndex:1 }}>
                  <div style={{ fontSize:11, fontWeight:800, letterSpacing:".04em", marginBottom:2 }}>FRETE GRÁTIS</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.75)", lineHeight:1.5 }}>Nas compras acima de R$ 299 com estoque próprio.</div>
                </div>
                <div style={{ background:"rgba(255,255,255,.18)", borderRadius:7, padding:"5px 10px", fontSize:11, fontWeight:700, color:"#fff", whiteSpace:"nowrap", zIndex:1 }}>Ver condições</div>
              </div>
            </div>
          </div>

          {/* COL 2 — INFO */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:T.hint, letterSpacing:".1em", textTransform:"uppercase" }}>{produto.marca}</span>
              <span style={{ width:3, height:3, borderRadius:"50%", background:T.borderMid, display:"inline-block" }} />
              <span style={{ fontSize:11, color:T.hint }}>SKU: {produto.sku}</span>
            </div>

            <h1 style={{ fontSize:26, fontWeight:800, lineHeight:1.2, letterSpacing:"-0.03em", color:T.text }}>{produto.nome}</h1>

            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <Stars rating={produto.rating} size="lg" />
              <span style={{ fontSize:13, fontWeight:700 }}>{produto.rating}</span>
              <a href="#" style={{ fontSize:12, color:T.muted, textDecoration:"underline" }}>{produto.totalAvaliacoes.toLocaleString("pt-BR")} avaliações</a>
              <span style={{ width:3, height:3, borderRadius:"50%", background:T.borderMid, display:"inline-block" }} />
              <span style={{ fontSize:12, color:T.muted }}>Vendido por <a href="#" style={{ color:T.primary, fontWeight:600, textDecoration:"none" }}>{produto.vendedor}</a></span>
              <span className="badge" style={{ background:T.successLight, color:T.success }}>{produto.vendedorRating}% positivo</span>
            </div>

            <div className="div" />
            <p style={{ fontSize:13, color:T.muted, lineHeight:1.75 }}>{produto.descricao}</p>
            <div className="div" />

            {/* Cor */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:T.text, textTransform:"uppercase", letterSpacing:".06em" }}>Cor</span>
                <span style={{ fontSize:12, color:T.muted, fontWeight:500, textTransform:"capitalize" }}>{corSel}</span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {(Object.keys(produto.cores) as Cor[]).map(cor=>(
                  <button key={cor} className={`cbtn ${corSel===cor?"on":""}`} onClick={()=>setCorSel(cor)} title={cor}
                    style={{ background:produto.cores[cor], borderColor: produto.cores[cor]==="#f5f5f0" ? T.borderMid : produto.cores[cor] }} />
                ))}
              </div>
            </div>

            {/* Tamanho */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.text, textTransform:"uppercase", letterSpacing:".06em" }}>Tamanho</span>
                  {tamSel && <span style={{ fontSize:12, color:T.muted }}>— {tamDesc[tamSel]}</span>}
                </div>
                <a href="#" style={{ fontSize:12, color:T.primary, textDecoration:"underline" }}>Guia de tamanhos</a>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {produto.tamanhos.map(t=>(
                  <button key={t} className={`tbtn ${tamSel===t?"on":""} ${t==="40"?"off":""}`}
                    onClick={()=>t!=="40"&&setTamSel(t as Tamanho)}>{t}</button>
                ))}
              </div>
              <div style={{ fontSize:11, color:T.hint, marginTop:6 }}>Tam. 40 indisponível</div>
            </div>

            <div className="div" />

            {/* MODALIDADE DE PREÇO */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:T.text, textTransform:"uppercase", letterSpacing:".06em" }}>Modalidade de preço</span>
              </div>

              <div onMouseEnter={handleModHoverEnter} onMouseLeave={handleModHoverLeave}>
                <div className="mcard on mcard-trigger" onClick={toggleModalidadeMobile}>
                  <span style={{ fontSize:20 }}>{mod.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, fontSize:13 }}>{mod.label}</span>
                      <span className="badge" style={{ background:mod.badgeBg, color:mod.badgeColor }}>{mod.badge}</span>
                    </div>
                    <div style={{ fontSize:11, color:T.hint, marginTop:2 }}>🚚 {mod.prazo} · 🛡️ {mod.garantia} · por {mod.envia}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{mod.precoPix}</div>
                    <div style={{ fontSize:10, color:T.successDark, fontWeight:600 }}>no PIX</div>
                  </div>
                  <div style={{ color:T.hint, fontSize:12, marginLeft:4, transition:"transform .2s", transform: modalidadeOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
                </div>

                <div className="mod-hint"><span>↕</span> Passe o mouse para ver outras modalidades</div>
                <div className="mod-hint-mobile"><span>↕</span> Toque para ver outras modalidades de preço</div>

                {modalidadeOpen && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }} className="asd">
                    {(Object.keys(modalidades) as Modalidade[]).filter(k=>k!==modalidadeSel).map(key=>{
                      const m = modalidades[key];
                      return (
                        <div key={key} className="mcard mcard-option" onClick={()=>selecionarModalidade(key)}>
                          <span style={{ fontSize:18 }}>{m.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                              <span style={{ fontWeight:700, fontSize:13 }}>{m.label}</span>
                              <span className="badge" style={{ background:m.badgeBg, color:m.badgeColor, fontSize:10 }}>{m.badge}</span>
                            </div>
                            <div style={{ fontSize:11, color:T.hint, marginTop:1 }}>🚚 {m.prazo} · 🛡️ {m.garantia}</div>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontWeight:800, fontSize:14, color:T.text }}>{m.precoPix} <span style={{ fontSize:10, color:T.muted, fontWeight:500 }}>PIX</span></div>
                            <div style={{ fontSize:11, color:T.muted }}>{m.precoNormal} cartão</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="div" />

            {/* Chat */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:T.primaryLight, border:`1px solid ${T.border}`, borderRadius:10 }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:34, height:34, background:T.primary, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>💬</div>
                <span style={{ position:"absolute", bottom:-1, right:-1, width:9, height:9, background:T.success, borderRadius:"50%", border:`2px solid ${T.primaryLight}` }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Falar com o vendedor</div>
                <div style={{ fontSize:11, color:T.successDark, fontWeight:500 }}>● Online agora · Responde em minutos</div>
              </div>
              <button style={{ background:"none", border:`1.5px solid ${T.primary}`, borderRadius:7, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:T.primary }}>Chat</button>
            </div>
          </div>

          {/* COL 3 — BUY BOX */}
          <div className="col3">
            <div className="buybox">
              {/* PREÇO */}
              <div>
                <div style={{ fontSize:12, color:T.hint, marginBottom:6 }}>
                  De <span style={{ textDecoration:"line-through" }}>{mod.precoNormal}</span> no cartão
                </div>
                <div className="pix-block">
                  <div style={{ fontSize:11, fontWeight:700, color:T.success, textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>
                    💸 PIX — {descontoPix}% de desconto
                  </div>
                  <div style={{ fontSize:28, fontWeight:800, color:T.text, letterSpacing:"-0.03em", lineHeight:1 }}>
                    {cupomAplicado ? formatBRL(precoFinalPix) : mod.precoPix}
                  </div>
                  <div style={{ fontSize:12, color:T.successDark, marginTop:3 }}>Preço final ao pagar com PIX</div>
                  {cupomAplicado && (
                    <div style={{ fontSize:11, color:T.successDark, fontWeight:700, marginTop:2 }}>
                      + cupom {cupomAplicado.code}: -{cupomAplicado.desconto}% adicional
                    </div>
                  )}
                </div>
                <div style={{ fontSize:12, color:T.muted, marginTop:8 }}>
                  ou <strong style={{ color:T.text }}>{mod.precoParc}</strong>
                </div>
                <button onClick={()=>setModalPgto(true)} style={{ fontSize:12, color:T.primary, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit", padding:"4px 0 0", display:"block" }}>
                  Ver todas as formas de pagamento
                </button>
              </div>

              <div className="div" />

              {/* QUANTIDADE */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>Quantidade</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button className="qbtn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                    <span style={{ fontSize:14, fontWeight:700, minWidth:22, textAlign:"center" }}>{qty}</span>
                    <button className="qbtn" onClick={()=>setQty(q=>q+1)}>+</button>
                  </div>
                </div>
                <div style={{ fontSize:11, color: produto.estoque<=10 ? T.danger : T.success, fontWeight:600 }}>
                  {produto.estoque<=10 ? `⚠️ Apenas ${produto.estoque} unidades!` : `✓ ${produto.estoque} unidades disponíveis`}
                </div>
              </div>

              {/* FRETE GRÁTIS PROGRESSIVO */}
              <div style={{ background: freteGratisAtingido ? T.successLight : T.primaryLight, border:`1px solid ${freteGratisAtingido ? "#99F6E4" : T.border}`, borderRadius:10, padding:"11px 13px" }}>
                {freteGratisAtingido ? (
                  <div style={{ fontSize:12, fontWeight:700, color:T.success }}>
                    🚚 Parabéns! Você ganhou <strong>frete grátis</strong>!
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:12, color:T.text }}>
                      🚚 Falta <strong style={{ color:T.primary }}>{formatBRL(faltaFrete)}</strong> para ganhar frete grátis
                    </div>
                    <div className="frete-progress-track">
                      <div className="frete-progress-fill" style={{ width:`${progressoFrete}%` }} />
                    </div>
                    <div style={{ fontSize:10, color:T.hint, marginTop:4 }}>
                      Carrinho: {formatBRL(valorCarrinho)} / mín. {formatBRL(FRETE_GRATIS_MIN)}
                    </div>
                  </>
                )}
              </div>

              {/* FRETE CEP */}
              <div style={{ border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", background:"#F9FAFB" }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.text, textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>Calcular Frete</div>
                <div style={{ display:"flex", gap:6 }}>
                  <input className="inp" type="text" placeholder="00000-000" value={cepDigitado}
                    onChange={e=>formatCepInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&consultarCep()}
                    style={{ flex:1, fontSize:13, background:"#fff" }} />
                  <button onClick={consultarCep} style={{ background:T.primary, color:"#fff", border:"none", borderRadius:8, padding:"9px 14px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>OK</button>
                </div>
                {mostrarTransp && (
                  <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:5 }} className="au">
                    {transSel !== null ? (
                      <div>
                        <div className="frow on">
                          <div style={{ flex:1, fontSize:12, fontWeight:600 }}>{transportadoras[transSel].nome}</div>
                          <div style={{ fontSize:11, color:T.hint }}>{transportadoras[transSel].prazo}</div>
                          <div style={{ fontSize:13, fontWeight:700, color: transportadoras[transSel].valor==="Grátis" ? T.success : T.text }}>{transportadoras[transSel].valor}</div>
                          <button onClick={()=>setTransSel(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:T.primary, textDecoration:"underline", fontFamily:"inherit", whiteSpace:"nowrap", padding:0 }}>alterar</button>
                        </div>
                        <div style={{ marginTop:5, fontSize:11, color:T.muted }}>📍 Entregando para <strong>{cepConfirmado}</strong></div>
                      </div>
                    ) : (
                      transportadoras.map((t,i)=>(
                        <label key={i} className="frow" onClick={()=>setTransSel(i)} style={{ cursor:"pointer" }}>
                          <input type="radio" name="transp" checked={false} onChange={()=>setTransSel(i)} style={{ accentColor:T.primary, flexShrink:0 }} />
                          <div style={{ flex:1, fontSize:12, fontWeight:500, color:T.text }}>
                            {t.nome}
                            {t.destaque && <span className="badge" style={{ background:T.successLight, color:T.success, marginLeft:5, fontSize:9 }}>Recomendado</span>}
                          </div>
                          <div style={{ fontSize:11, color:T.hint }}>{t.prazo}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:t.valor==="Grátis"?T.success:T.text }}>{t.valor}</div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* CUPOM */}
              {!cupomAplicado ? (
                <div>
                  {!showCupomField ? (
                    <button onClick={()=>setShowCupomField(true)} style={{ fontSize:12, color:T.primary, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit", padding:0 }}>
                      🏷️ Tenho um cupom de desconto
                    </button>
                  ) : (
                    <div className="asd">
                      <div style={{ display:"flex", gap:6 }}>
                        <input className="inp" placeholder="Ex: PRIMEIRA10" value={cupomInput}
                          onChange={e=>{ setCupomInput(e.target.value.toUpperCase()); setCupomErro(""); }}
                          onKeyDown={e=>e.key==="Enter"&&aplicarCupom()}
                          style={{ flex:1, fontSize:12, textTransform:"uppercase", letterSpacing:".04em" }} />
                        <button onClick={aplicarCupom} style={{ background:T.accent, color:"#fff", border:"none", borderRadius:8, padding:"9px 13px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>Aplicar</button>
                      </div>
                      {cupomErro && <div style={{ fontSize:11, color:T.danger, marginTop:5, fontWeight:500 }}>{cupomErro}</div>}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ border:`1.5px solid #99F6E4`, borderRadius:10, padding:"10px 12px", background:T.successLight }} className="asd">
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:T.success }}>✓ Cupom aplicado</div>
                      <div style={{ fontSize:11, color:T.successDark, marginTop:1 }}>{cupomAplicado.label}</div>
                    </div>
                    <button onClick={removerCupom} style={{ fontSize:11, color:T.hint, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit" }}>Remover</button>
                  </div>
                </div>
              )}

              <div className="div" />

              {/* TERMOS */}
              <label style={{ display:"flex", gap:8, alignItems:"flex-start", cursor:"pointer" }}>
                <div onClick={()=>setTermos(t=>!t)} style={{ width:16, height:16, borderRadius:4, border:`2px solid ${termos?T.primary:T.borderMid}`, background:termos?T.primary:"transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                  {termos&&<span style={{ color:"#fff", fontSize:10, fontWeight:800 }}>✓</span>}
                </div>
                <span style={{ fontSize:11, color:T.muted, lineHeight:1.6 }}>
                  Li e aceito os <a href="#" style={{ color:T.primary, fontWeight:600 }}>Termos</a> e a <a href="#" style={{ color:T.primary, fontWeight:600 }}>Política de Privacidade</a>
                </span>
              </label>

              {/* BOTÕES */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button className="btnp" disabled={!termos||!tamSel} onClick={()=>{ if(termos&&tamSel) setCartCount(c=>c+1); }}>
                  {!tamSel ? "Selecione um tamanho" : !termos ? "Aceite os termos" : "Comprar agora"}
                </button>
                <button className="btnout" disabled={!tamSel} onClick={()=>{ if(tamSel) setCartCount(c=>c+1); }}>
                  Adicionar ao carrinho
                </button>
              </div>

              <div className="div" />

              {/* GARANTIAS */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  { icon:"🔄", text:"Devolução grátis em 30 dias" },
                  { icon:"🛡️", text:"Garantia de 12 meses" },
                  { icon:"🔒", text:"Compra 100% segura" },
                ].map(g=>(
                  <div key={g.text} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.muted }}>
                    <span style={{ fontSize:13 }}>{g.icon}</span>{g.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ABAS */}
        <div style={{ marginTop:64 }}>
          <div style={{ display:"flex", gap:28, borderBottom:`1px solid ${T.border}`, marginBottom:28 }}>
            {(["descricao","especificacoes","avaliacoes","entrega"] as Aba[]).map(a=>(
              <button key={a} className={`tab ${aba===a?"on":""}`} onClick={()=>setAba(a)}>
                {a==="descricao"?"Descrição":a==="especificacoes"?"Especificações":a==="avaliacoes"?"Avaliações":"Entrega"}
              </button>
            ))}
          </div>

          {aba==="descricao"&&(
            <div className="au" style={{ maxWidth:680, display:"flex", flexDirection:"column", gap:12 }}>
              <p style={{ fontSize:14, color:T.muted, lineHeight:1.8 }}>O <strong style={{ color:T.text }}>Aether Run Pro X</strong> foi desenvolvido em parceria com atletas de elite. Com tecnologia <strong style={{ color:T.text }}>AetherFoam v3</strong>, cada passada é amortecida com precisão milimétrica.</p>
              <p style={{ fontSize:14, color:T.muted, lineHeight:1.8 }}>A placa de carbono integrada oferece retorno de energia para superar seus limites, enquanto o cabedal em <strong style={{ color:T.text }}>Flyknit Pro</strong> garante ventilação e ajuste perfeitos.</p>
              <p style={{ fontSize:14, color:T.muted, lineHeight:1.8 }}>Ideal do treino leve à competição de alto nível.</p>
            </div>
          )}

          {aba==="especificacoes"&&(
            <div className="au" style={{ maxWidth:560, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden", background:"#fff" }}>
              {produto.especificacoes.map((e,i)=>(
                <div key={i} className="srow">
                  <span style={{ fontSize:13, color:T.muted }}>{e.label}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{e.valor}</span>
                </div>
              ))}
            </div>
          )}

          {aba==="avaliacoes"&&(
            <div className="au" style={{ maxWidth:680, display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:12, padding:"20px 24px", display:"flex", gap:28, alignItems:"center" }}>
                <div style={{ textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontSize:48, fontWeight:800, lineHeight:1, color:T.text }}>{produto.rating}</div>
                  <Stars rating={produto.rating} size="lg" />
                  <div style={{ fontSize:11, color:T.hint, marginTop:4 }}>{produto.totalAvaliacoes.toLocaleString("pt-BR")} avaliações</div>
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                  {[5,4,3,2,1].map(s=>(
                    <div key={s} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12 }}>
                      <span style={{ color:T.muted, width:8 }}>{s}</span>
                      <span style={{ color:T.accent }}>★</span>
                      <div className="sbtrack"><div className="sbfill" style={{ width:`${s===5?82:s===4?11:s===3?4:s===2?2:1}%` }}/></div>
                      <span style={{ color:T.hint, minWidth:30 }}>{s===5?"82%":s===4?"11%":s===3?"4%":s===2?"2%":"1%"}</span>
                    </div>
                  ))}
                </div>
              </div>
              {produto.avaliacoes.map((av,i)=>(
                <div key={i} className="rcard">
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:av.cor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:T.primary, flexShrink:0 }}>{av.iniciais}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{av.nome}</div>
                      <div style={{ fontSize:11, color:T.hint }}>{av.data}</div>
                    </div>
                    <Stars rating={av.estrelas} />
                  </div>
                  <p style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{av.comentario}</p>
                </div>
              ))}
            </div>
          )}

          {aba==="entrega"&&(
            <div className="au" style={{ maxWidth:560, display:"flex", flexDirection:"column", gap:8 }}>
              {(Object.keys(modalidades) as Modalidade[]).map(key=>{
                const m=modalidades[key];
                return(
                  <div key={key} style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:20 }}>{m.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{m.label}</div>
                      <div style={{ fontSize:11, color:T.hint, marginTop:1 }}>Enviado por: {m.envia}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{m.prazo}</div>
                      <div style={{ fontSize:11, color:T.hint }}>Garantia: {m.garantia}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ background:"#F9FAFB", border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px", fontSize:12, color:T.muted, lineHeight:1.7 }}>
                <strong style={{ color:T.text }}>Política:</strong> Prazos a partir da confirmação do pagamento. Frete grátis acima de R$ 299 no estoque próprio.
              </div>
            </div>
          )}
        </div>

        {/* UPSELL */}
        <div style={{ marginTop:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <h2 style={{ fontSize:17, fontWeight:800, whiteSpace:"nowrap", color:T.text }}>Compre junto</h2>
            <div style={{ flex:1, height:1, background:T.border }} />
          </div>
          <div className="ugrid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {produto.upsell.map((u,i)=>(
              <div key={i} className="ucard">
                <div style={{ position:"relative" }}>
                  <img src={u.img} alt={u.nome} />
                  {u.tag&&<span style={{ position:"absolute", top:8, left:8, background:T.accent, color:"#fff", fontSize:9, fontWeight:800, padding:"3px 8px", borderRadius:99 }}>{u.tag}</span>}
                </div>
                <div style={{ padding:"10px 12px 14px" }}>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:500, marginBottom:4, lineHeight:1.4 }}>{u.nome}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{u.preco}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${T.border}`, background:"#fff" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <span style={{ fontWeight:800, fontSize:15, color:T.primary }}>AETHER<span style={{ color:T.hint, fontWeight:400, fontSize:11, marginLeft:2 }}>store</span></span>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {["Sobre nós","Contato","Privacidade","Termos","Trocas e devoluções"].map(l=>(
              <a key={l} href="#" style={{ fontSize:12, color:T.hint, textDecoration:"none" }}
                onMouseEnter={e=>e.currentTarget.style.color=T.primary}
                onMouseLeave={e=>e.currentTarget.style.color=T.hint}>{l}</a>
            ))}
          </div>
          <span style={{ fontSize:12, color:T.borderMid }}>© 2025 Aether Store</span>
        </div>
      </footer>

      {/* MODAL PAGAMENTO */}
      {modalPgto&&(
        <div className="moverlay" onClick={()=>setModalPgto(false)}>
          <div className="mbox au" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:T.text }}>Formas de Pagamento</h3>
              <button onClick={()=>setModalPgto(false)} style={{ width:30, height:30, background:"#F3F4F6", border:"none", borderRadius:99, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>
            <div style={{ background:T.successLight, border:"1.5px solid #99F6E4", borderRadius:10, padding:"13px 15px", marginBottom:6, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:22 }}>💸</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text }}>PIX</div>
                <div style={{ fontSize:12, color:T.muted }}>Preço final — aprovação instantânea</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:20, fontWeight:800, color:T.text }}>{cupomAplicado ? formatBRL(precoFinalPix) : mod.precoPix}</div>
                <div style={{ fontSize:11, color:T.successDark, fontWeight:700 }}>{descontoPix}% de desconto já aplicado</div>
              </div>
            </div>
            <div style={{ fontSize:11, color:T.muted, marginBottom:14, paddingLeft:4 }}>O desconto PIX já está incluído no valor acima.</div>
            <div style={{ fontSize:10, fontWeight:700, color:T.hint, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Cartão de Crédito — preço normal</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {parcelamentos.map((p,i)=>(
                <label key={i} className={`prow ${parcSel===i?"on":""}`} onClick={()=>setParcSel(i)}>
                  <input type="radio" name="pgto" checked={parcSel===i} onChange={()=>setParcSel(i)} style={{ accentColor:T.primary }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{p.parcelas}x de {p.valor}</div>
                    <div style={{ fontSize:11, color:T.hint }}>Total: {p.total}</div>
                  </div>
                  {p.semJuros&&<span style={{ background:T.successLight, color:T.successDark, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99 }}>sem juros</span>}
                </label>
              ))}
            </div>
            <button onClick={()=>setModalPgto(false)} style={{ marginTop:14, width:"100%", background:T.primary, color:"#fff", border:"none", borderRadius:9, padding:13, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}