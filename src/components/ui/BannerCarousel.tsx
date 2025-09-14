'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


interface Banner {
  mobileSrc: string;  // imagem para mobile
  desktopSrc: string; // imagem para desktop
  alt: string;
}


interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  return (
    <div className="relative mx-4 md:mx-6 lg:mx-8">
      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="w-full"
      >
        {banners.map((banner, index) => (
          
          <SwiperSlide key={index}>
  <picture>
    <source 
      media="(min-width: 768px)" 
      srcSet={banner.desktopSrc}  // ← nova propriedade
    />
    <img 
      src={banner.mobileSrc}      // ← nova propriedade  
      alt={banner.alt} 
      className="w-full max-h-[400px] md:max-h-[500px] lg:max-h-[600px] object-contain"
    />
  </picture>
</SwiperSlide>
        ))}
        
        {/* Barra de progresso */}
        <div className="autoplay-progress absolute right-4 bottom-4 z-10 w-12 h-12 flex items-center justify-center font-bold text-blue-500">
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <circle 
              cx="24" 
              cy="24" 
              r="20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="4"
              className="stroke-dashoffset-[calc(125.6*(1-var(--progress)))] stroke-dasharray-[125.6] -rotate-90"
            />
          </svg>
        </div>
      </Swiper>
    </div>
  );
}