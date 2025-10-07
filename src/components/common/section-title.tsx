import { Star, Zap, Flame, TrendingUp, Sparkles } from "lucide-react";

interface SectionTitleProps {
  children: React.ReactNode;
  icon?: "star" | "zap" | "flame" | "trendingUp" | "sparkles";
}

const SectionTitle = ({ 
  children, 
  icon = "sparkles"
}: SectionTitleProps) => {
  const icons = {
    star: { component: Star, color: "text-yellow-500" },
    zap: { component: Zap, color: "text-blue-500" },
    flame: { component: Flame, color: "text-orange-500" },
    trendingUp: { component: TrendingUp, color: "text-green-500" },
    sparkles: { component: Sparkles, color: "text-purple-500" }
  };

  const { component: IconComponent, color: iconColor } = icons[icon];

  return (
    <div className="flex flex-col items-center gap-3 px-5 mb-4">
      <div className="flex items-center gap-2">
        <IconComponent size={24} className={iconColor} />
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {children}
        </h2>
      </div>
      <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
    </div>
  );
};

export default SectionTitle;