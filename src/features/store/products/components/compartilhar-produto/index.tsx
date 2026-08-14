"use client";

import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandX,
} from "@tabler/icons-react";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "react-share";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PropriedadesCompartilharProduto = {
  nomeProduto: string;
  urlProduto: string;
};

/** Menu controlado de compartilhamento exibido sobre a imagem principal da PDP. */
export function CompartilharProduto({
  nomeProduto,
  urlProduto,
}: PropriedadesCompartilharProduto) {
  const [linkCopiado, setLinkCopiado] = useState(false);

  async function copiarLink(mensagem = "Link copiado!") {
    try {
      await navigator.clipboard.writeText(urlProduto);
      setLinkCopiado(true);
      toast.success(mensagem);
      window.setTimeout(() => setLinkCopiado(false), 2_000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-background/90 text-foreground hover:bg-background absolute top-3 right-3 z-20 size-11 rounded-full shadow-md backdrop-blur-sm"
              aria-label="Compartilhar produto"
            >
              <Share2 aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          Compartilhar
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-48">
        <DropdownMenuLabel>Compartilhar</DropdownMenuLabel>
        <DropdownMenuItem asChild className="py-2.5">
          <WhatsappShareButton
            url={urlProduto}
            title={nomeProduto}
            separator={"\n"}
            resetButtonStyle={false}
          >
            <IconBrandWhatsapp aria-hidden="true" />
            WhatsApp
          </WhatsappShareButton>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="py-2.5">
          <FacebookShareButton url={urlProduto} resetButtonStyle={false}>
            <IconBrandFacebook aria-hidden="true" />
            Facebook
          </FacebookShareButton>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="py-2.5">
          <TwitterShareButton
            url={urlProduto}
            title={`Confira ${nomeProduto} na nossa loja`}
            resetButtonStyle={false}
          >
            <IconBrandX aria-hidden="true" />X
          </TwitterShareButton>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="py-2.5"
          onSelect={() =>
            void copiarLink(
              "Link copiado! Cole no Instagram para compartilhar.",
            )
          }
        >
          <IconBrandInstagram aria-hidden="true" />
          Instagram
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="py-2.5" onSelect={() => void copiarLink()}>
          {linkCopiado ? (
            <Check aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
          {linkCopiado ? "Link copiado" : "Copiar link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
