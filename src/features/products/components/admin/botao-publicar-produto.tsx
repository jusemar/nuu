"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { publicarProdutoAdmin } from "@/features/products/actions/publicar-produto-admin";

interface BotaoPublicarProdutoProps {
  produtoId: string;
  publicado: boolean;
  aoPublicar: () => void;
}

export function BotaoPublicarProduto({
  produtoId,
  publicado,
  aoPublicar,
}: BotaoPublicarProdutoProps) {
  const router = useRouter();
  const [publicando, setPublicando] = useState(false);

  async function publicar() {
    if (publicando || publicado) return;
    setPublicando(true);
    try {
      const resultado = await publicarProdutoAdmin(produtoId);
      if (!resultado.sucesso) {
        toast.error("Não foi possível publicar o produto", {
          description: resultado.erro,
        });
        return;
      }

      aoPublicar();
      toast.success("Produto publicado e disponível na loja.");
      router.refresh();
    } catch {
      toast.error("Não foi possível publicar o produto.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={publicar}
      disabled={publicando || publicado}
    >
      {publicado ? (
        <CheckCircle2 className="mr-2 h-4 w-4" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      {publicando
        ? "Publicando..."
        : publicado
          ? "Produto publicado"
          : "Publicar produto"}
    </Button>
  );
}
