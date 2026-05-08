import { Lightbulb, Shield, Layers, MapPin, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const levels = [
  {
    number: 1,
    title: "CEPs Específicos",
    description: "Exceções pontuais com preço próprio",
    icon: Shield,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    border: "border-amber-200",
    bg: "bg-amber-50/50",
    badge: "Prioridade máxima",
    badgeVariant:
      "bg-amber-100 text-amber-700 hover:bg-amber-100" as const,
  },
  {
    number: 2,
    title: "Regiões",
    description: "Grupos de bairros com um único preço de frete",
    icon: Layers,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50/50",
    badge: "2ª prioridade",
    badgeVariant:
      "bg-blue-100 text-blue-700 hover:bg-blue-100" as const,
  },
  {
    number: 3,
    title: "Bairros Avulsos",
    description: "Bairros independentes, fora de qualquer região",
    icon: MapPin,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    border: "border-slate-200",
    bg: "bg-slate-50/50",
    badge: "3ª prioridade",
    badgeVariant:
      "bg-slate-100 text-slate-700 hover:bg-slate-100" as const,
  },
  {
    number: 4,
    title: "Não atendemos",
    description: "Endereço fora da área de entrega própria",
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    border: "border-red-200",
    bg: "bg-red-50/50",
    badge: "Sem cobertura",
    badgeVariant: "bg-red-100 text-red-700 hover:bg-red-100" as const,
  },
];

function LevelCard({
  level,
}: {
  level: (typeof levels)[number];
}) {
  const Icon = level.icon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-3 transition-colors",
        level.border,
        level.bg
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          level.iconBg
        )}
      >
        <Icon className={cn("h-5 w-5", level.iconColor)} />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {level.title}
          </span>
          <Badge variant="secondary" className={cn("text-xs", level.badgeVariant)}>
            {level.badge}
          </Badge>
        </div>
        <span className="text-xs text-gray-500">{level.description}</span>
      </div>
    </div>
  );
}

export function EntregaPropriaInfoCard() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value="como-funciona"
        className="rounded-lg border border-blue-200 bg-blue-50/30 px-4"
      >
        <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline">
          <span className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Como funciona a Entrega Própria
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-1">
            <p className="mb-2 text-xs text-gray-500">
              Quando o cliente digita o CEP na loja, o sistema verifica as
              zonas de entrega nesta ordem:
            </p>

            {levels.map((level) => (
              <LevelCard key={level.number} level={level} />
            ))}

            <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2.5">
              <span className="text-sm leading-5 text-amber-800">
                <strong>Importante:</strong> Um CEP específico cadastrado sempre
                prevalece, mesmo que o bairro esteja incluído em uma região. Use
                CEPs específicos para criar exceções de preço.
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
