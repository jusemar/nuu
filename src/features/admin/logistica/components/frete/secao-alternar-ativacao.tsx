import React from "react";
import { Button } from "@/components/ui/button";

export function LinhaAlternarAtivacao({
  ativo,
  aoAlternar,
}: {
  ativo: boolean;
  aoAlternar: () => Promise<void>;
}) {
  return (
    <form action={aoAlternar} className="mt-3">
      <Button type="submit" variant="secondary" size="sm">
        {ativo ? "Desativar" : "Ativar"}
      </Button>
    </form>
  );
}
