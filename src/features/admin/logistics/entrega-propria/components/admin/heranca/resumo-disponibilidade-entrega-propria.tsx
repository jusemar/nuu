import { Badge } from "@/components/ui/badge";
import { descreverOrigemModoHerdado } from "@/features/logistica/lib/disponibilidade/resolver-modo-herdado";
import type { DisponibilidadeEntregaPropria } from "@/features/logistica/lib/entrega-propria/resolver-disponibilidade-entrega-propria";

/** Valor efetivo + origem da disponibilidade (mesma regra da loja). */
export function ResumoDisponibilidadeEntregaPropria({
  disponibilidade,
  carregando = false,
}: {
  disponibilidade: DisponibilidadeEntregaPropria;
  carregando?: boolean;
}) {
  const { ativo, origem } = disponibilidade;
  const textoOrigem =
    origem.tipo === "logistica-fornecedor"
      ? "Logística do fornecedor"
      : descreverOrigemModoHerdado(origem);

  return (
    <div
      className={`space-y-1 rounded-md p-3 text-sm ${
        ativo ? "bg-emerald-50 text-emerald-900" : "bg-gray-50 text-gray-800"
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
        <span className="font-medium">Origem:</span> {textoOrigem}
      </p>
      <p className="text-xs">
        {ativo
          ? "Entrega Própria é oferecida onde houver preço aplicável e Agenda Geográfica."
          : "Entrega Própria não é oferecida. Frete Externo e Retirada seguem independentes."}
      </p>
    </div>
  );
}
