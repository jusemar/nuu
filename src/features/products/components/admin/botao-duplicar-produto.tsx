"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { duplicarProdutoAdmin } from "@/features/products/actions/duplicar-produto-admin";

interface BotaoDuplicarProdutoProps {
  produtoId: string;
  produtoNome: string;
}

export function BotaoDuplicarProduto({
  produtoId,
  produtoNome,
}: BotaoDuplicarProdutoProps) {
  const router = useRouter();
  const [duplicando, setDuplicando] = useState(false);

  async function duplicar() {
    if (duplicando) return;

    const confirmado = window.confirm(
      `Duplicar “${produtoNome}” como um novo produto inativo?`,
    );
    if (!confirmado) return;

    setDuplicando(true);
    try {
      const resultado = await duplicarProdutoAdmin(produtoId);
      if (!resultado.sucesso) {
        toast.error("Não foi possível duplicar o produto", {
          description: resultado.erro,
        });
        return;
      }

      toast.success("Produto duplicado como rascunho.");
      router.push(`/admin/products/${resultado.produtoId}/edit`);
    } catch {
      toast.error("Não foi possível duplicar o produto.");
    } finally {
      setDuplicando(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={duplicar}
      disabled={duplicando}
    >
      <Copy className="mr-2 h-4 w-4" />
      {duplicando ? "Duplicando..." : "Duplicar produto"}
    </Button>
  );
}
