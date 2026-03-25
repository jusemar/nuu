'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  imagens: string[];
  isLancamento?: boolean;
}

export function ProductGallery({ 
  imagens, 
  isLancamento = true 
}: ProductGalleryProps) {
  const [imgAtiva, setImgAtiva] = useState(0);

  const proximaImagem = () => {
    setImgAtiva((atual) => (atual + 1) % imagens.length);
  };
  
  const imagemAnterior = () => {
    setImgAtiva((atual) => (atual - 1 + imagens.length) % imagens.length);
  };

  return (
    <div className="flex gap-3 items-start sticky top-[70px]">
      {/* Miniaturas */}
      <div className="flex flex-col gap-2">
        {imagens.map((img, index) => (
          <button
            key={index}
            onClick={() => setImgAtiva(index)}
            className={`
              w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
              ${index === imgAtiva 
                ? 'border-primary opacity-100' 
                : 'border-transparent opacity-50 hover:opacity-80'
              }
            `}
          >
            <Image
              src={img}
              alt={`Vista ${index + 1}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Imagem Principal */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-square group">
          <Image
            src={imagens[imgAtiva]}
            alt="Produto"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority
          />
          
          {/* Badge LANÇAMENTO */}
          {isLancamento && (
           <span 
  className="absolute top-3 left-3 text-white text-[10px] font-extrabold px-3 py-1 rounded-full tracking-wider z-10 shadow-md"
  style={{ backgroundColor: '#EF9F27' }}
>
  LANÇAMENTO
</span>
          )}
          
          {/* Navegação */}
          <button
            onClick={imagemAnterior}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
          >
            ‹
          </button>
          <button
            onClick={proximaImagem}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
          >
            ›
          </button>
          
          {/* Indicadores */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {imagens.map((_, index) => (
              <button
                key={index}
                onClick={() => setImgAtiva(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === imgAtiva ? 'w-4 bg-primary' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Banner Frete Grátis - ESTILO LIMPO SEM GRADIENTE */}   
<div className="bg-primary rounded-xl p-6 text-white flex items-center gap-3 relative min-h-[80px] pr-4">
  <div className="text-2xl flex-shrink-0 relative z-10">🏃</div>
  <div className="flex-1 relative z-10">
    <div className="text-[11px] font-extrabold tracking-wider mb-0.5">FRETE GRÁTIS</div>
    <div className="text-[11px] text-white/75 leading-relaxed">
      Compras acima de R$ 299,00.
    </div>
  </div>
  <button className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-[11px]
   font-bold whitespace-nowrap relative z-10 transition-colors !mr-4">
  Ver condições
</button>
 

  <div className="absolute -right-5 -top-5 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
</div>
        
      </div>
    </div>
  );
}