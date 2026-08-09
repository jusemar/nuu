import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * As quatro etapas de PROCESSAMENTO, idênticas para as duas origens.
 *
 * A aquisição dos dados fica fora desta lista de propósito: enviar um arquivo e
 * buscar na API é a única coisa que realmente difere entre origem `arquivo` e
 * origem `api`. Ela entra no stepper como um passo inicial rotulado por quem
 * chama (`rotuloAquisicao`), e daí em diante o caminho é o mesmo.
 */
export const PASSOS_PROCESSAMENTO_FORNECEDOR = [
  "Mapeamento",
  "Vinculação",
  "Conciliação",
  "Publicação",
] as const;

export type PassoProcessamentoFornecedor =
  (typeof PASSOS_PROCESSAMENTO_FORNECEDOR)[number];

export type OrigemFluxoFornecedor =
  | { tipo: "arquivo" }
  | { tipo: "api"; provedor: string };

type PassosFluxoFornecedorProps = {
  /** Etapa de processamento em que o gestor está agora. */
  passoAtual: PassoProcessamentoFornecedor;
  origem: OrigemFluxoFornecedor;
  /** Rótulo do passo de aquisição. Ex.: "Selecionar arquivo", "Buscar dados". */
  rotuloAquisicao: string;
  /** Nome do fornecedor em processamento, quando conhecido. */
  fornecedor?: string | null;
};

function rotuloOrigem(origem: OrigemFluxoFornecedor) {
  return origem.tipo === "arquivo"
    ? "Origem: Arquivo"
    : `Origem: API · ${origem.provedor}`;
}

/**
 * Cabeçalho de etapas do fluxo de fornecedores — um só para as duas origens.
 *
 * Antes deste componente existia um stepper privado da importação por arquivo e
 * nenhum na integração por API: o gestor não tinha como perceber que os dois
 * caminhos levam ao mesmo processo. O desenho aqui é o mesmo que já estava em
 * uso (círculo numerado, traço de ligação, rótulo abaixo) — só ficou
 * compartilhado e ganhou a origem como contexto.
 *
 * A origem aparece como um badge discreto, nunca como bifurcação: saber de onde
 * o dado veio ajuda, mas não muda o que o gestor precisa fazer a seguir.
 */
export function PassosFluxoFornecedor({
  passoAtual,
  origem,
  rotuloAquisicao,
  fornecedor,
}: PassosFluxoFornecedorProps) {
  const passos = [rotuloAquisicao, ...PASSOS_PROCESSAMENTO_FORNECEDOR];
  // A aquisição já aconteceu sempre que este cabeçalho aparece — quem está numa
  // etapa de processamento já enviou o arquivo ou já buscou os dados.
  const indiceAtual = PASSOS_PROCESSAMENTO_FORNECEDOR.indexOf(passoAtual) + 1;

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 text-slate-700"
        >
          {rotuloOrigem(origem)}
        </Badge>
        {fornecedor ? (
          <span className="truncate text-sm font-medium text-slate-700">
            {fornecedor}
          </span>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <ol className="flex min-w-max items-start">
          {passos.map((passo, indice) => {
            const atual = indice === indiceAtual;
            const concluido = indice < indiceAtual;

            return (
              <li
                key={passo}
                className="flex min-w-[140px] items-start last:min-w-[96px]"
                aria-current={atual ? "step" : undefined}
              >
                <div className="flex min-w-0 flex-col items-center text-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium shadow-sm ${
                      atual
                        ? "border-slate-950 bg-slate-950 text-white"
                        : concluido
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {concluido ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      indice + 1
                    )}
                  </div>
                  <p
                    className={`mt-1.5 max-w-[104px] text-[11px] leading-tight font-medium ${
                      atual
                        ? "text-slate-950"
                        : concluido
                          ? "text-slate-700"
                          : "text-slate-400"
                    }`}
                  >
                    {passo}
                  </p>
                </div>
                {indice < passos.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className={`mt-3.5 h-0.5 flex-1 rounded-full ${
                      concluido ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
