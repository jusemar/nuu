// src/components/ui/countdown-timer.tsx
"use client";

import { useCountdown } from "@/hooks/use-countdown";

interface CountdownTimerProps {
 targetDate: string;

}

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const timeLeft = useCountdown(targetDate);
  return (
    <div className="flex justify-center items-center gap-2">
      {/* Dias (se houver) */}
      {timeLeft.days > 0 && (
        <>
          <TimeUnit value={timeLeft.days} label="DIAS" />
          <Separator />
        </>
      )}
      
      {/* Horas */}
      <TimeUnit value={timeLeft.hours} label="HORAS" />
      <Separator />
      
      {/* Minutos */}
      <TimeUnit value={timeLeft.minutes} label="MIN" />
      <Separator />
      
      {/* Segundos */}
      <TimeUnit value={timeLeft.seconds} label="SEG" />
    </div>
  );
};

// Componente auxiliar com cores INVERTIDAS
const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="text-center">
    <div className="bg-gradient-to-br from-white to-orange-100 rounded-lg px-4 py-4 min-w-[50px] shadow-sm border border-orange-200">
      <span className="text-2xl font-mono font-bold tracking-tighter text-orange-700">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs font-medium text-white opacity-90 mt-1 block tracking-wide">{label}</span>
  </div>
);

// Separador em branco para contrastar
const Separator = () => (
  <span className="text-xl font-bold text-white opacity-80 mx-1">:</span>
);