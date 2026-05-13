import type { UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type CampoCupomProps = {
  mensagemCupom: string | null;
  register: UseFormRegister<CheckoutVisitanteSchema>;
};

export function CampoCupom({ mensagemCupom, register }: CampoCupomProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="cupom">Cupom</Label>
        <Input
          id="cupom"
          placeholder="PRIMEIRA10"
          className="uppercase"
          {...register("cupom")}
        />
      </div>

      {mensagemCupom ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {mensagemCupom}
        </p>
      ) : null}
    </section>
  );
}
