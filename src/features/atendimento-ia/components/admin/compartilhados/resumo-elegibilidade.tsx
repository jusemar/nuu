import { AlertTriangle, Ban, CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type {
  AlertaPublicacao,
  BloqueioPublicacao,
  StatusElegibilidadePublicacao,
} from "../../../types/admin/publicacao";
export type ResumoElegibilidadeDto = {
  status: StatusElegibilidadePublicacao;
  hashAvaliado: string;
  bloqueios: BloqueioPublicacao[];
  alertas: AlertaPublicacao[];
  revisao: string;
  execucoes: number;
  casosObrigatorios: number;
};
export function ResumoElegibilidade({
  valor,
}: {
  valor: ResumoElegibilidadeDto | null;
}) {
  if (!valor)
    return (
      <p className="text-muted-foreground text-xs">
        Elegibilidade indisponível para esta versão.
      </p>
    );
  const Icone =
    valor.status === "elegivel"
      ? CheckCircle2
      : valor.status === "bloqueado" || valor.status === "obsoleto"
        ? Ban
        : Clock3;
  return (
    <details className="mt-3 rounded-lg border p-3">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Icone className="size-4" />
        <Badge
          variant={
            valor.status === "elegivel"
              ? "success"
              : valor.status === "bloqueado" || valor.status === "obsoleto"
                ? "destructive"
                : "warning"
          }
        >
          {valor.status}
        </Badge>
        <span>Publicação ainda não disponível</span>
      </summary>
      <div className="text-muted-foreground mt-3 space-y-2 text-xs">
        <p>
          Hash avaliado: <code>{valor.hashAvaliado.slice(0, 16)}</code>
        </p>
        <p>
          Revisão considerada: {valor.revisao} · testes: {valor.execucoes} ·
          casos obrigatórios: {valor.casosObrigatorios}
        </p>
        {valor.bloqueios.length > 0 && (
          <div>
            <p className="text-foreground font-medium">Bloqueios</p>
            <ul>
              {valor.bloqueios.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        )}
        {valor.alertas.length > 0 && (
          <div>
            <p className="text-foreground flex items-center gap-1 font-medium">
              <AlertTriangle className="size-3" />
              Alertas — exigirão justificativa do Gestor
            </p>
            <ul>
              {valor.alertas.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
