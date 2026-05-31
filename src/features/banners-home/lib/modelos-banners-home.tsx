import type {
  ModeloSvgBannerHome,
  VariacaoVisualBannerHome,
} from "../types/banners-home.types";

type FundoBannerHomeProps = {
  modelo: string;
  compacto?: boolean;
};

export const classesVariacaoPrincipal: Record<
  VariacaoVisualBannerHome,
  {
    fundo: string;
    selo: string;
    titulo: string;
    apoio: string;
    preco: string;
    botao: string;
    detalhe: string;
  }
> = {
  azul_ambar: {
    fundo: "bg-gradient-to-br from-[#0A4F8A] via-[#0B6CB5] to-[#0873C4]",
    selo: "bg-amber-400/20 text-amber-200",
    titulo: "text-white",
    apoio: "text-blue-100/90",
    preco: "text-amber-200",
    botao: "bg-amber-500 text-[#1C0A00]",
    detalhe: "border-white/20 bg-white/10 text-sky-100",
  },
  verde: {
    fundo: "bg-gradient-to-br from-[#0F5132] via-[#15803D] to-[#16A34A]",
    selo: "bg-emerald-200/20 text-emerald-100",
    titulo: "text-white",
    apoio: "text-emerald-50/90",
    preco: "text-lime-100",
    botao: "bg-lime-300 text-green-950",
    detalhe: "border-white/20 bg-white/10 text-emerald-50",
  },
  grafite: {
    fundo: "bg-gradient-to-br from-[#111827] via-[#374151] to-[#4B5563]",
    selo: "bg-slate-100/15 text-slate-100",
    titulo: "text-white",
    apoio: "text-slate-100/90",
    preco: "text-amber-200",
    botao: "bg-white text-slate-950",
    detalhe: "border-white/20 bg-white/10 text-slate-100",
  },
};

export const classesVariacaoSecundaria: Record<
  VariacaoVisualBannerHome,
  {
    fundo: string;
    selo: string;
    titulo: string;
    apoio: string;
    botao: string;
  }
> = {
  azul_ambar: {
    fundo: "bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]",
    selo: "bg-blue-700/10 text-blue-900",
    titulo: "text-blue-950",
    apoio: "text-blue-800",
    botao: "bg-blue-700 text-white",
  },
  verde: {
    fundo: "bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]",
    selo: "bg-green-700/10 text-green-900",
    titulo: "text-green-900",
    apoio: "text-green-800",
    botao: "bg-green-600 text-white",
  },
  grafite: {
    fundo: "bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]",
    selo: "bg-slate-900/10 text-slate-900",
    titulo: "text-slate-950",
    apoio: "text-slate-700",
    botao: "bg-slate-900 text-white",
  },
};

export function normalizarModeloSvgBannerHome(
  modelo: string | null | undefined,
): ModeloSvgBannerHome {
  if (
    modelo === "ondas_comerciais" ||
    modelo === "formas_promocionais" ||
    modelo === "linhas_institucionais"
  ) {
    return modelo;
  }

  return "ondas_comerciais";
}

export function normalizarVariacaoVisualBannerHome(
  variacao: string | null | undefined,
): VariacaoVisualBannerHome {
  if (
    variacao === "azul_ambar" ||
    variacao === "verde" ||
    variacao === "grafite"
  ) {
    return variacao;
  }

  return "azul_ambar";
}

export function FundoSvgBannerHome({ modelo, compacto }: FundoBannerHomeProps) {
  const modeloNormalizado = normalizarModeloSvgBannerHome(modelo);

  if (modeloNormalizado === "formas_promocionais") {
    return (
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 400 220"
      >
        <circle
          cx="330"
          cy="22"
          r={compacto ? "78" : "96"}
          fill="currentColor"
          opacity=".14"
        />
        <circle cx="42" cy="208" r="82" fill="currentColor" opacity=".1" />
        <path d="M238 190 400 56v164H236z" fill="currentColor" opacity=".08" />
      </svg>
    );
  }

  if (modeloNormalizado === "linhas_institucionais") {
    return (
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 400 220"
      >
        <path
          d="M-12 186C74 126 130 254 228 178c68-53 92-102 184-72"
          fill="none"
          stroke="currentColor"
          strokeWidth="18"
          opacity=".12"
        />
        <path
          d="M220 0h180v220H282c-20-52-12-111-62-220Z"
          fill="currentColor"
          opacity=".08"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 400 220"
    >
      <circle cx="344" cy="40" r="108" fill="currentColor" opacity=".12" />
      <circle cx="50" cy="222" r="92" fill="currentColor" opacity=".1" />
      <path
        d="M256 0h144v220H292c34-72 20-147-36-220Z"
        fill="currentColor"
        opacity=".08"
      />
    </svg>
  );
}
