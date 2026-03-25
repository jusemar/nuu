// ==========================================
// COMPONENTE: UpsellSection
// ==========================================
// Responsabilidade: Mostrar produtos relacionados ("Compre junto")
// O que faz: Exibe grid de produtos adicionais que o cliente pode querer comprar junto
// Recebe: Array de produtos para venda cruzada (upsell)
// Estados: Nenhum (componente puramente visual)

'use client'; // Pode ser client se quiser adicionar interações depois (clique, carrinho)

// ==========================================
// INTERFACE DO ITEM DE UPSELL
// Define o formato de cada produto na lista
// ==========================================
interface UpsellItem {
  nome: string;      // Nome do produto ex: "Meia Compressão Pro"
  preco: string;     // Preço formatado ex: "R$ 89,90"
  img: string;       // URL da imagem
  tag: string | null; // Tag opcional ex: "Mais vendido", "Novo", ou null
}

// ==========================================
// INTERFACE DAS PROPS
// ==========================================
interface UpsellSectionProps {
  produtos: UpsellItem[]; // Array de produtos para mostrar
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function UpsellSection({ produtos }: UpsellSectionProps) {
  
  // Se não tiver produtos, não renderiza nada
  // Isso evita mostrar uma seção vazia
  if (!produtos || produtos.length === 0) return null;

  return (
    // Container principal com margem superior grande
    <div className="mt-16">
      
      {/* -----------------------------------------
          CABEÇALHO: Título + linha decorativa
          ----------------------------------------- */}
      <div className="flex items-center gap-3.5 mb-5">
        {/* Título "Compre junto" */}
        <h2 className="text-base font-extrabold whitespace-nowrap text-text-primary">
          Compre junto
        </h2>
        {/* Linha cinza que ocupa o resto do espaço */}
        <div className="flex-1 h-px bg-surface-border" />
      </div>

      {/* -----------------------------------------
          GRID DE PRODUTOS
          ----------------------------------------- */}
      {/* 
        grid: layout em grade
        grid-cols-2: 2 colunas no mobile (padrão)
        md:grid-cols-4: 4 colunas em telas médias (768px+)
        gap-3.5: espaçamento entre os cards (14px)
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        
        {/* Mapeia o array de produtos e cria um card para cada um */}
        {produtos.map((produto, index) => (
          /* 
            CARD DO PRODUTO
            bg-white: fundo branco
            border: borda cinza
            border-[#F3F4F6]: cor específica da borda (cinza muito claro)
            rounded-xl: cantos arredondados
            overflow-hidden: esconde conteúdo que ultrapassa (imagem não vaza)
            cursor-pointer: mão ao passar mouse
            hover:shadow-lg: sombra maior ao passar mouse
            hover:-translate-y-0.5: sobe 2px ao passar mouse (efeito flutuar)
            transition-all: animação suave de todas as propriedades
          */
          <div 
            key={index} 
            className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            {/* Container da imagem */}
            <div className="relative">
              {/* Imagem do produto */}
              {/* 
                w-full: largura 100% do card
                aspect-square: proporção 1:1 (quadrada)
                object-cover: cobre todo o espaço sem distorcer
              */}
              <img 
                src={produto.img} 
                alt={produto.nome} 
                className="w-full aspect-square object-cover"
              />
              
              {/* TAG (só aparece se existir) */}
              {/* 
                absolute: posicionamento absoluto dentro do relative
                top-2 left-2: 8px de distância do topo e esquerda
                bg-accent: cor âmbar/laranja (já corrigimos isso!)
                text-white: texto branco
                text-[9px]: fonte muito pequena
                font-extrabold: negrito forte
                px-2: padding horizontal
                py-0.5: padding vertical pequeno
                rounded-full: formato de pílula/cápsula
              */}
              {produto.tag && (
                <span className="absolute top-2 left-2 bg-accent text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  {produto.tag}
                </span>
              )}
            </div>
            
            {/* Informações do produto (abaixo da imagem) */}
            <div className="p-2.5">
              {/* Nome do produto */}
              {/* 
                text-xs: fonte pequena (12px)
                text-text-muted: cor cinza
                font-medium: peso médio
                mb-1: margem inferior pequena
                line-clamp-2: limita a 2 linhas (se for maior, coloca ...)
              */}
              <div className="text-xs text-text-muted font-medium mb-1 line-clamp-2">
                {produto.nome}
              </div>
              
              {/* Preço */}
              {/* 
                text-sm: fonte média (14px)
                font-extrabold: negrito forte
                text-text-primary: cor escura do texto principal
              */}
              <div className="text-sm font-extrabold text-text-primary">
                {produto.preco}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}