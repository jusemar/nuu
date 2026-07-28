import { LockKeyhole, type LucideIcon,RotateCcw, ShieldCheck } from "lucide-react";

type VarianteBeneficioProduto = "neutro" | "sucesso" | "atencao";

export type BeneficioProdutoPdp = {
  icone: LucideIcon;
  texto: string;
  variante?: VarianteBeneficioProduto;
};

/** Sinais institucionais exibidos na PDP sem qualquer regra comercial. */
export const beneficiosConfiancaCompraPdp: BeneficioProdutoPdp[] = [
  { icone: RotateCcw, texto: "Devolução grátis em 30 dias" },
  { icone: ShieldCheck, texto: "Garantia de 12 meses" },
  { icone: LockKeyhole, texto: "Compra 100% segura" },
];

type ItemBeneficioProdutoPdpProps = BeneficioProdutoPdp;

type BeneficiosProdutoPdpProps = {
  beneficios: BeneficioProdutoPdp[];
  className?: string;
};

const classesPorVariante: Record<VarianteBeneficioProduto, string> = {
  neutro: "text-muted-foreground",
  sucesso: "text-success",
  atencao: "text-muted-foreground",
};

export function ItemBeneficioProdutoPdp({
  icone: Icone,
  texto,
  variante = "neutro",
}: ItemBeneficioProdutoPdpProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 text-xs leading-5">
      <Icone
        aria-hidden="true"
        className={`size-4 shrink-0 ${classesPorVariante[variante]}`}
        strokeWidth={1.8}
      />
      <span className="min-w-0 whitespace-nowrap text-muted-foreground">
        {texto}
      </span>
    </div>
  );
}

/** Lista compacta de benefícios e sinais de confiança exclusiva da PDP. */
export function BeneficiosProdutoPdp({
  beneficios,
  className,
}: BeneficiosProdutoPdpProps) {
  return (
    <section
      aria-label="Benefícios e sinais de confiança"
      className={`grid min-w-0 grid-cols-1 gap-x-6 gap-y-1.5 min-[640px]:grid-cols-2 ${className ?? ""}`}
    >
      {beneficios.map((beneficio) => (
        <ItemBeneficioProdutoPdp key={beneficio.texto} {...beneficio} />
      ))}
    </section>
  );
}
