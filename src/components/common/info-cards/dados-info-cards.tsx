import { CreditCard, Headset, ShieldCheck, Truck } from "lucide-react";

export interface CardConfianca {
  numero: string;
  titulo: string;
  descricao: string;
  href: string;
  link: string;
  icone: React.ComponentType<{ className?: string }>;
}

export const dadosInfoCards: CardConfianca[] = [
  {
    numero: "01",
    titulo: "Entrega rápida",
    descricao: "Despacho em até 24h e entregas ágeis para capitais.",
    href: "/",
    link: "Zonas de entrega",
    icone: Truck,
  },
  {
    numero: "02",
    titulo: "Pagamento seguro",
    descricao: "Checkout protegido e opções de pagamento confiáveis.",
    href: "/",
    link: "Métodos aceitos",
    icone: CreditCard,
  },
  {
    numero: "03",
    titulo: "Garantia estendida",
    descricao: "Cobertura adicional para comprar com tranquilidade.",
    href: "/",
    link: "Saiba mais",
    icone: ShieldCheck,
  },
  {
    numero: "04",
    titulo: "Suporte 24/7",
    descricao: "Atendimento via chat, WhatsApp e telefone.",
    href: "/",
    link: "Fale conosco",
    icone: Headset,
  },
];
