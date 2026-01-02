'use client';

import { useKeenSlider, KeenSliderPlugin } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { useEffect, useState } from 'react';
import FeaturedProductCard from './FeaturedProductCard';

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
  const [isHovering, setIsHovering] = useState(false);
  const [sliderRef, sliderInstanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      selector: '.carousel__cell',
      renderMode: 'custom',
      mode: 'free-snap',
    },
    [carousel]
  );

  // Auto-play que pausa no hover
  useEffect(() => {
    if (!sliderInstanceRef.current || isHovering) return;

    const interval = setInterval(() => {
      sliderInstanceRef.current?.next();
    }, 3000);

    return () => clearInterval(interval);
  }, [sliderInstanceRef, isHovering]);

  // DADOS FICTÍCIOS DIRETO NO ARQUIVO - 5 PRODUTOS
  const featuredProducts = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      title: 'Smart Watch Pro',
      description: 'Relógio inteligente premium',
      originalPrice: 899.90,
      currentPrice: 699.90,
      discount: 22,
      hasFreeShipping: true,
      isFeatured: true,
      rating: 4.8,
      reviewCount: 127,
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      title: 'Fone Bluetooth',
      description: 'Cancelamento de ruído ativo',
      originalPrice: 599.90,
      currentPrice: 449.90,
      hasFreeShipping: true,
      isFeatured: true,
      rating: 4.6,
      reviewCount: 89,
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
      title: 'Caixa de Som',
      description: 'À prova d\'água IPX7',
      currentPrice: 329.90,
      hasFreeShipping: false,
      isFeatured: true,
      rating: 4.7,
      reviewCount: 56,
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop',
      title: 'Tablet Pro 12.9"',
      description: 'Tela Retina 256GB',
      originalPrice: 4299.90,
      currentPrice: 3799.90,
      discount: 12,
      hasFreeShipping: true,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 203,
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
      title: 'Smartphone Flagship',
      description: 'Câmera 108MP, 512GB',
      originalPrice: 5999.90,
      currentPrice: 4999.90,
      discount: 17,
      hasFreeShipping: true,
      isFeatured: true,
      rating: 4.8,
      reviewCount: 312,
    },
  ];

  return (
    <div className="w-full py-12">
      <div className="wrapper">
        <div 
          className="scene"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="carousel keen-slider" ref={sliderRef}>
            {featuredProducts.map((product) => (
              <div key={product.id} className="carousel__cell">
                <FeaturedProductCard {...product} />
              </div>
            ))}
          </div>
        </div>
      </div>

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