import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoRegraPontosProps = {
  id: string;
  valorGasto: string;
  pontos: string;
  onValorGastoChange: (valor: string) => void;
  onPontosChange: (valor: string) => void;
};

export function CampoRegraPontos({
  id,
  valorGasto,
  pontos,
  onValorGastoChange,
  onPontosChange,
}: CampoRegraPontosProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
      <div className="space-y-2">
        <Label htmlFor={`${id}-valor`}>Valor gasto</Label>
        <div className="relative">
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            R$
          </span>
          <Input
            id={`${id}-valor`}
            inputMode="decimal"
            value={valorGasto}
            onChange={(evento) => onValorGastoChange(evento.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <span className="text-muted-foreground hidden pb-2 text-sm sm:block">
        gera
      </span>
      <div className="space-y-2">
        <Label htmlFor={`${id}-pontos`}>Quantidade de pontos</Label>
        <div className="relative">
          <Input
            id={`${id}-pontos`}
            inputMode="decimal"
            value={pontos}
            onChange={(evento) => onPontosChange(evento.target.value)}
            className="pr-16"
          />
          <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            pontos
          </span>
        </div>
      </div>
    </div>
  );
}
