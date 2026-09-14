import { Badge } from "@/components/ui/badge";
import { descreverOrigemFreteExterno } from "@/features/logistica/lib/disponibilidade/resolver-disponibilidade-frete-externo";
import type { DisponibilidadeFreteExterno } from "@/features/logistica/types/disponibilidade-frete-externo";

/** Valor efetivo + origem, calculados pela mesma regra usada na loja. */
export function ResumoFreteExternoEfetivo({
  disponibilidade,
  carregando = false,
}: {
  disponibilidade: DisponibilidadeFreteExterno;
  carregando?: boolean;
}) {
  const ativo = disponibilidade.ativo;

  return (
    <div
      className={`space-y-1 rounded-md p-3 text-sm ${
        ativo ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
      }`}
      aria-live="polite"
    >
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-medium">Valor efetivo:</span>
        <Badge variant={ativo ? "default" : "outline"}>
          {ativo ? "Ativado" : "Desativado"}
        </Badge>
        {carregando ? <span className="text-xs">atualizando…</span> : null}
      </p>
      <p>
        <span className="font-medium">Origem:</span>{" "}
        {descreverOrigemFreteExterno(disponibilidade.origem)}
      </p>
      <p className="text-xs">
        {ativo
          ? "Fretes externos podem aparecer, respeitando as regras específicas e classificações logísticas."
          : "PAC, Sedex, Jadlog e demais fretes externos não serão cotados. Entrega Própria e Retirada continuam independentes."}
      </p>
    </div>
  );
}
