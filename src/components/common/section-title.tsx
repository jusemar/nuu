import { Flame, Sparkles, Star, TrendingUp, Zap } from "lucide-react";

interface SectionTitleProps {
  children: React.ReactNode;
  icon?: "star" | "zap" | "flame" | "trendingUp" | "sparkles";
}

const SectionTitle = ({ children, icon = "sparkles" }: SectionTitleProps) => {
  const icons = {
    star: { component: Star, color: "text-primary" },
    zap: { component: Zap, color: "text-primary" },
    flame: { component: Flame, color: "text-accent-brand" },
    trendingUp: { component: TrendingUp, color: "text-success" },
    sparkles: { component: Sparkles, color: "text-primary" },
  };

  const { component: IconComponent, color: iconColor } = icons[icon];

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2.5">
        <span className="border-border bg-card flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm">
          <IconComponent size={19} className={iconColor} />
        </span>
        <h2 className="text-foreground text-xl leading-tight font-bold tracking-tight sm:text-2xl">
          {children}
        </h2>
      </div>
      <div className="bg-border h-px w-full max-w-[140px]" />
    </div>
  );
};

export default SectionTitle;
