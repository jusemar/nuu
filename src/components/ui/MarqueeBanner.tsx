// /src/components/ui/MarqueeBanner.tsx
'use client';

import Marquee from "react-fast-marquee";

interface MarqueeBannerProps {
  text: string;
  speed?: number;
}

export function MarqueeBanner({ text, speed = 50 }: MarqueeBannerProps) {
  return (
    <div className="bg-orange-500 text-white py-2">
      <Marquee speed={speed} gradient={false} pauseOnHover={true}>
        {text}
      </Marquee>
    </div>
  );
}