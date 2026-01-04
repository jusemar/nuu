// FeaturedProductsCarousel.tsx
'use client';

import { useKeenSlider, KeenSliderPlugin } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { useEffect, useState } from 'react';
import FeaturedProductCard from './FeaturedProductCard';

// ✅ IMPORTANDO O HOOK QUE CRIAMOS
// O hook é responsável por buscar os dados dos produtos
import { useFeaturedProducts } from '../hooks/useFeaturedProducts';

/**
 * Plugin do Keen Slider que cria o efeito 3D de rotação
 * Essa parte é específica da biblioteca de carousel
 */
const carousel: KeenSliderPlugin = (slider) => {
  const z = 300;
  
  function rotate() {
    const deg = 360 * slider.track.details.progress;
    slider.container.style.transform = `translateZ(-${z}px) rotateY(${-deg}deg)`;
  }
  
  slider.on('created', () => {
    const deg = 360 / slider.slides.length;
    slider.slides.forEach((element, idx) => {
      element.style.transform = `rotateY(${deg * idx}deg) translateZ(${z}px)`;
    });
    rotate();
  });
  
  slider.on('detailsChanged', rotate);
};

export const FeaturedProductsCarousel = () => {
  // Estado para controlar se o mouse está sobre o carousel
  const [isHovering, setIsHovering] = useState(false);
  
  // ✅ USANDO O HOOK PARA BUSCAR OS DADOS
  // O hook retorna 4 coisas:
  // 1. products: array de produtos (vazio enquanto carrega)
  // 2. isLoading: true quando está buscando dados
  // 3. error: objeto de erro se algo der errado
  // 4. refetch: função para buscar os dados novamente
  const { products, isLoading, error } = useFeaturedProducts();
  
  // Configuração do carousel com Keen Slider
  const [sliderRef, sliderInstanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      selector: '.carousel__cell',
      renderMode: 'custom',
      mode: 'free-snap',
    },
    [carousel]
  );

  // Auto-play que pausa quando o mouse está sobre o carousel
  useEffect(() => {
    if (!sliderInstanceRef.current || isHovering) return;

    const interval = setInterval(() => {
      sliderInstanceRef.current?.next();
    }, 3000);

    return () => clearInterval(interval);
  }, [sliderInstanceRef, isHovering]);

  // ✅ TRATAMENTO DE ESTADOS DO HOOK
  
  // Se está carregando, mostra mensagem de loading
  if (isLoading) {
    return (
      <div className="w-full py-12 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos em destaque...</p>
        </div>
      </div>
    );
  }

  // Se deu erro, mostra mensagem de erro
  if (error) {
    return (
      <div className="w-full py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar produtos</h3>
          <p className="text-red-600 text-sm">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Se não há produtos (mesmo depois de carregar)
  if (products.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-yellow-800 font-semibold">Nenhum produto em destaque</h3>
          <p className="text-yellow-600 text-sm mt-2">Volte mais tarde para ver nossas novidades</p>
        </div>
      </div>
    );
  }

  // ✅ RENDERIZAÇÃO PRINCIPAL (quando tudo está ok)
  return (
    <div className="w-full py-12">
      {/* Título da seção */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Produtos em Destaque</h2>
        <p className="text-gray-600">Descubra nossas seleções especiais que estão fazendo sucesso</p>
      </div>

      {/* Container do carousel 3D */}
      <div className="wrapper">
        <div 
          className="scene"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="carousel keen-slider" ref={sliderRef}>
            {/* ✅ MAPEANDO OS PRODUTOS DO HOOK
                Agora usamos 'products' que veio do hook,
                não mais o array fixo de dados fictícios */}
            {products.map((product) => (
              <div key={product.id} className="carousel__cell">
                {/* ✅ PASSANDO OS DADOS PARA O CARD
                    Cada produto do array vai virar um FeaturedProductCard */}
                <FeaturedProductCard {...product} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores de navegação (pontinhos embaixo) */}
      <div className="flex justify-center mt-8 space-x-3">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => sliderInstanceRef.current?.moveToIdx(index)}
            className="w-3 h-3 rounded-full bg-gray-300 hover:bg-blue-600 transition-colors"
            aria-label={`Ir para produto ${index + 1}`}
          />
        ))}
      </div>

      {/* Instrução para o usuário */}
      <p className="text-center text-gray-500 text-sm mt-6">
        Passe o mouse sobre o carousel para pausar a rotação automática
      </p>

      {/* ✅ ESTILOS CSS INLINE (necessários para o efeito 3D) */}
      <style jsx>{`
        .wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 500px;
        }
        .scene {
          width: 320px;
          height: 450px;
          perspective: 1000px;
          position: relative;
        }
        .scene .carousel.keen-slider {
          width: 100%;
          height: 100%;
          overflow: visible;
          position: absolute;
          transform: translateZ(-288px);
          transform-style: preserve-3d;
        }
        .carousel__cell {
          position: absolute;
          width: 300px;
          left: 10px;
          height: auto;
          border-radius: 1rem;
          overflow: visible;
        }
      `}</style>
    </div>
  );
};

export default FeaturedProductsCarousel;