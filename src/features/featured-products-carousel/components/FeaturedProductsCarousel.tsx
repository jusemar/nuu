// FeaturedProductsCarousel.tsx - VERSÃO LIMPA
'use client';

import { useKeenSlider, KeenSliderPlugin } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { useEffect, useState } from 'react';
import FeaturedProductCard from './FeaturedProductCard';
import { useFeaturedProducts } from '../hooks/useFeaturedProducts';

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
  const { products, isLoading, error } = useFeaturedProducts();
  
  const [sliderRef, sliderInstanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      selector: '.carousel__cell',
      renderMode: 'custom',
      mode: 'free-snap',
    },
    [carousel]
  );

  useEffect(() => {
    if (!sliderInstanceRef.current || isHovering) return;

    const interval = setInterval(() => {
      sliderInstanceRef.current?.next();
    }, 3000);

    return () => clearInterval(interval);
  }, [sliderInstanceRef, isHovering]);

  if (isLoading) return <div className="h-[450px] flex items-center justify-center">Carregando...</div>;
  if (error) return <div className="h-[450px] flex items-center justify-center text-red-600">Erro ao carregar</div>;
  if (products.length === 0) return <div className="h-[450px] flex items-center justify-center">Nenhum produto</div>;

  return (
    <div className="wrapper">
      <div 
        className="scene"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="carousel keen-slider" ref={sliderRef}>
          {products.map((product) => (
            <div key={product.id} className="carousel__cell">
              <FeaturedProductCard {...product} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 420px; /* ALTURA FIXA IGUAL AOS BANNERS */
        }
        .scene {
          width: 320px;
          height: 100%;
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