'use client';

import { useKeenSlider, KeenSliderPlugin } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { useEffect, useState } from 'react';

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

export const RotatingProductCarousel = () => {
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

  const products = [
    { id: 1, title: 'iPhone 15 Pro', price: 'R$ 7.999', emoji: '📱' },
    { id: 2, title: 'MacBook Air M3', price: 'R$ 8.499', emoji: '💻' },
    { id: 3, title: 'AirPods Pro', price: 'R$ 2.199', emoji: '🎧' },
    { id: 4, title: 'Apple Watch', price: 'R$ 3.999', emoji: '⌚' },
    { id: 5, title: 'iPad Pro', price: 'R$ 9.499', emoji: '📱' },
    { id: 6, title: 'HomePod', price: 'R$ 2.999', emoji: '🔊' },
  ];

  return (
    <div className="w-full py-8">
      <div className="wrapper">
        <div 
          className="scene"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="carousel keen-slider" ref={sliderRef}>
            {products.map((product) => (
              <div key={product.id} className="carousel__cell">
                <div className="w-full h-full bg-white rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                    <span className="text-3xl">{product.emoji}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                    {product.title}
                  </h3>
                  <p className="text-xl font-bold text-gray-900 mb-3">
                    {product.price}
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                    Ver detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .wrapper {
          display: flex;
          justify-content: center;
        }
        .scene {
          width: 300px;
          height: 250px;
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
          width: 280px;
          left: 10px;
          height: 250px;
          border-radius: 1rem;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default RotatingProductCarousel;