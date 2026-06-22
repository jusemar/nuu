"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type OpcaoMapeamentoFornecedor = {
  valor: string;
  label: string;
};

export type LinhaMapeamentoFornecedor = {
  id: string;
  nomeOrigem: string;
  descricaoOrigem?: string;
  amostra?: string | null;
  campoDestino?: string | null;
  situacao?: string | null;
  confianca?: number;
  obrigatorioSemOrigem?: boolean;
  textoResolucao?: string;
};

export type CampoObrigatorioMapeamentoFornecedor =
  | string
  | {
      valor: string;
      label: string;
    };

export const CAMPOS_OBRIGATORIOS_MAPEAMENTO_FORNECEDOR = [
  { valor: "codigo_fornecedor", label: "Código fornecedor" },
  { valor: "nome_produto", label: "Nome do produto" },
  { valor: "preco_fornecedor", label: "Preço fornecedor" },
  { valor: "estoque_fornecedor", label: "Estoque fornecedor" },
  { valor: "categoria_fornecedor", label: "Categoria da loja" },
  { valor: "marca_fornecedor", label: "Marca da loja" },
] satisfies Array<{ valor: string; label: string }>;

export type TabelaMapeamentoCamposFornecedorProps = {
  tipoOrigem: "arquivo" | "api";
  titulo: string;
  subtitulo: string;
  labelPrimeiraColuna: string;
  labelAmostra: string;
  linhas: LinhaMapeamentoFornecedor[];
  opcoesDestino: OpcaoMapeamentoFornecedor[];
  camposObrigatorios?: CampoObrigatorioMapeamentoFornecedor[];
  action?: (formData: FormData) => void | Promise<void>;
  camposOcultos?: Array<{ nome: string; valor: string }>;
  textoCheckbox?: string;
  mostrarCheckbox?: boolean;
  textoAcaoPrincipal: string;
  tipoBotaoAcaoPrincipal?: "submit" | "button";
  hrefAcaoPrincipal?: string;
  textoRodape?: string;
  estadoVazio?: string;
};

function limitarConfianca(valor?: number) {
  if (typeof valor !== "number" || Number.isNaN(valor)) return 0;

  return Math.min(Math.max(valor, 0), 100);
}

function obterTomConfianca(confianca: number) {
  if (confianca >= 80) return "bg-emerald-500";
  if (confianca >= 50) return "bg-amber-500";
  return "bg-slate-300";
}

function obterTextoConfianca(confianca: number) {
  if (confianca >= 80) return "Alta";
  if (confianca >= 50) return "Média";
  return "Baixa";
}

function obterIconeSituacao(situacao?: string | null) {
  if (situacao === "pendente") return CircleDashed;
  if (situacao === "conflito") return CircleAlert;
  return CheckCircle2;
}

function formatarSituacao(situacao?: string | null) {
  if (!situacao) return "Pendente";

  const rotulos: Record<string, string> = {
    automatico: "Automático",
    confirmado: "Confirmado",
    detectado_automaticamente: "Detectado",
    vindo_do_mapeamento_salvo: "Padrão salvo",
    pendente: "Pendente",
    conflito: "Conflito",
    obrigatorio_sem_origem: "Obrigatório sem origem",
  };

  return rotulos[situacao] ?? situacao.replace(/_/g, " ");
}

function obterLabelDestino(
  valor: string | null | undefined,
  opcoesDestino: OpcaoMapeamentoFornecedor[],
) {
  if (!valor) return "Não mapear";

  return opcoesDestino.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

function normalizarCamposObrigatorios(
  campos: CampoObrigatorioMapeamentoFornecedor[],
  opcoesDestino: OpcaoMapeamentoFornecedor[],
) {
  return campos.map((campo) => {
    if (typeof campo !== "string") return campo;

    return {
      valor: campo,
      label: obterLabelDestino(campo, opcoesDestino),
    };
  });
}

function BadgeObrigatorio({ obrigatorio }: { obrigatorio: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        obrigatorio
          ? "w-fit border-slate-300 bg-slate-100 text-slate-800"
          : "w-fit border-slate-200 bg-white text-slate-500"
      }
    >
      {obrigatorio ? "Obrigatório" : "Opcional"}
    </Badge>
  );
}

function StatusLinhaMapeamento({
  linha,
}: {
  linha: LinhaMapeamentoFornecedor;
}) {
  if (linha.obrigatorioSemOrigem) {
    return (
      <p className="text-sm font-medium text-amber-700">
        {linha.textoResolucao ?? "Resolver na Conciliação"}
      </p>
    );
  }

  return <IndicadorConfianca valor={linha.confianca} />;
}

function IndicadorConfianca({ valor }: { valor?: number }) {
  const confianca = limitarConfianca(valor);

  return (
    <div className="min-w-[120px] space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">
          {obterTextoConfianca(confianca)}
        </span>
        <span className="text-xs font-semibold text-slate-900">
          {confianca}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${obterTomConfianca(confianca)}`}
          style={{ width: `${confianca}%` }}
        />
      </div>
    </div>
  );
}

function SelectDestino({
  linha,
  opcoesDestino,
  valor,
  aoAlterar,
}: {
  linha: LinhaMapeamentoFornecedor;
  opcoesDestino: OpcaoMapeamentoFornecedor[];
  valor: string;
  aoAlterar: (valor: string) => void;
}) {
  return (
    <select
      value={valor}
      onChange={(evento) => aoAlterar(evento.target.value)}
      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-xs transition-colors outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
    >
      <option value="">Não mapear</option>
      {opcoesDestino.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.label}
        </option>
      ))}
    </select>
  );
}

function LinhaMobile({
  linha,
  opcoesDestino,
  labelPrimeiraColuna,
  labelAmostra,
  valorDestino,
  aoAlterarDestino,
  obrigatorio,
}: {
  linha: LinhaMapeamentoFornecedor;
  opcoesDestino: OpcaoMapeamentoFornecedor[];
  labelPrimeiraColuna: string;
  labelAmostra: string;
  valorDestino: string;
  aoAlterarDestino: (valor: string) => void;
  obrigatorio: boolean;
}) {
  const IconeSituacao = obterIconeSituacao(linha.situacao);

  return (
    <div
      className={`rounded-xl border p-3 shadow-xs ${
        linha.obrigatorioSemOrigem
          ? "border-amber-200 bg-amber-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            {labelPrimeiraColuna}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">
            {linha.nomeOrigem}
          </p>
          {linha.descricaoOrigem ? (
            <p className="mt-0.5 text-xs text-slate-500">
              {linha.descricaoOrigem}
            </p>
          ) : null}
        </div>
        <Badge
          variant="outline"
          className="shrink-0 gap-1 rounded-md border-slate-200 bg-slate-50 text-slate-700"
        >
          <IconeSituacao className="h-3.5 w-3.5" />
          {formatarSituacao(linha.situacao)}
        </Badge>
      </div>
      <div className="mt-3 rounded-lg bg-slate-50 p-2">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {labelAmostra}
        </p>
        <p className="mt-1 truncate text-sm text-slate-800">
          {linha.amostra || "-"}
        </p>
      </div>
      <div className="mt-3 grid gap-3">
        {linha.obrigatorioSemOrigem ? (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2 text-sm font-medium text-slate-900">
            {obterLabelDestino(linha.campoDestino, opcoesDestino)}
          </div>
        ) : (
          <SelectDestino
            linha={linha}
            opcoesDestino={opcoesDestino}
            valor={valorDestino}
            aoAlterar={aoAlterarDestino}
          />
        )}
        <BadgeObrigatorio obrigatorio={obrigatorio} />
        <StatusLinhaMapeamento linha={linha} />
      </div>
    </div>
  );
}

export function TabelaMapeamentoCamposFornecedor({
  tipoOrigem,
  titulo,
  subtitulo,
  labelPrimeiraColuna,
  labelAmostra,
  linhas,
  opcoesDestino,
  camposObrigatorios = CAMPOS_OBRIGATORIOS_MAPEAMENTO_FORNECEDOR,
  action,
  camposOcultos = [],
  textoCheckbox = "Salvar este mapeamento como padrão deste fornecedor",
  mostrarCheckbox = true,
  textoAcaoPrincipal,
  tipoBotaoAcaoPrincipal = "submit",
  hrefAcaoPrincipal,
  textoRodape,
  estadoVazio = "Nenhum campo recebido para mapear.",
}: TabelaMapeamentoCamposFornecedorProps) {
  const camposObrigatoriosNormalizados = useMemo(
    () => normalizarCamposObrigatorios(camposObrigatorios, opcoesDestino),
    [camposObrigatorios, opcoesDestino],
  );
  const camposObrigatoriosSet = useMemo(
    () => new Set(camposObrigatoriosNormalizados.map((campo) => campo.valor)),
    [camposObrigatoriosNormalizados],
  );
  const linhasSubmetidas = useMemo(
    () => linhas.filter((linha) => !linha.obrigatorioSemOrigem),
    [linhas],
  );
  const destinosIniciais = useMemo(
    () =>
      Object.fromEntries(
        linhasSubmetidas.map((linha) => [linha.id, linha.campoDestino ?? ""]),
      ),
    [linhasSubmetidas],
  );
  const [destinosSelecionados, setDestinosSelecionados] =
    useState<Record<string, string>>(destinosIniciais);

  useEffect(() => {
    setDestinosSelecionados(destinosIniciais);
  }, [destinosIniciais]);

  const linhasMapeadas = linhas.filter(
    (linha) => !linha.obrigatorioSemOrigem && destinosSelecionados[linha.id],
  ).length;
  const camposObrigatoriosSemOrigem = camposObrigatoriosNormalizados.filter(
    (campo) => !Object.values(destinosSelecionados).includes(campo.valor),
  );
  const obrigatoriosSemOrigem = camposObrigatoriosSemOrigem.length;
  const linhasComPendencias = useMemo(
    () => [
      ...linhas,
      ...camposObrigatoriosSemOrigem.map((campo) => ({
        id: `obrigatorio-sem-origem-${campo.valor}`,
        nomeOrigem: "—",
        descricaoOrigem: "Obrigatório sem origem",
        amostra: tipoOrigem === "api" ? "Sem origem na API" : "Sem origem",
        campoDestino: campo.valor,
        situacao: "obrigatorio_sem_origem",
        confianca: 0,
        obrigatorioSemOrigem: true,
        textoResolucao: "Resolver na Conciliação",
      })),
    ],
    [camposObrigatoriosSemOrigem, linhas, tipoOrigem],
  );
  const obrigatoriosOk = linhas.filter((linha) => {
    const destino = linha.obrigatorioSemOrigem
      ? linha.campoDestino
      : destinosSelecionados[linha.id];

    return Boolean(
      destino &&
        camposObrigatoriosSet.has(destino) &&
        !linha.obrigatorioSemOrigem,
    );
  }).length;
  const conflitos = linhas.filter(
    (linha) => linha.situacao === "conflito",
  ).length;

  return (
    <form
      action={action}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      {camposOcultos.map((campo) => (
        <input
          key={campo.nome}
          type="hidden"
          name={campo.nome}
          value={campo.valor}
        />
      ))}
      {linhasSubmetidas.map((linha) => (
        <div key={linha.id} className="hidden">
          <input
            type="hidden"
            name="nomeColunaOrigem"
            value={linha.nomeOrigem}
          />
          <input
            type="hidden"
            name="campoDestino"
            value={destinosSelecionados[linha.id] ?? ""}
          />
        </div>
      ))}

      <div className="border-b border-slate-200 bg-linear-to-b from-white to-slate-50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge
              variant="outline"
              className="mb-2 rounded-md border-slate-200 bg-white text-[11px] font-semibold tracking-wide text-slate-600 uppercase"
            >
              {tipoOrigem === "api" ? "API" : "Arquivo"}
            </Badge>
            <h2 className="text-lg font-semibold text-slate-950">{titulo}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitulo}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xs sm:min-w-[420px] xl:grid-cols-4">
            <div className="px-2 py-1.5">
              <p className="text-[11px] font-medium text-slate-500">
                Campos mapeados
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-950">
                {linhasMapeadas}
              </p>
            </div>
            <div className="px-2 py-1.5">
              <p className="text-[11px] font-medium text-slate-500">
                Obrigatórios OK
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-950">
                {obrigatoriosOk}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 px-2 py-1.5">
              <p className="text-[11px] font-medium text-slate-500">
                Obrigatórios sem origem
              </p>
              <p className="mt-0.5 text-lg font-semibold text-amber-700">
                {obrigatoriosSemOrigem}
              </p>
            </div>
            <div className="px-2 py-1.5">
              <p className="text-[11px] font-medium text-slate-500">
                Conflitos
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-950">
                {conflitos}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">
          Os campos obrigatórios da loja aparecem sinalizados. Quando a origem
          não fornece um campo obrigatório, ele será resolvido na etapa de
          Conciliação.
        </p>
      </div>

      {linhasComPendencias.length === 0 ? (
        <div className="flex min-h-44 items-center justify-center p-8 text-center text-sm text-slate-500">
          {estadoVazio}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1080px] table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[22%]" />
                <col className="w-[31%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    {labelPrimeiraColuna}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    {labelAmostra}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    Mapear para
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    Obrigatório
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    Confiança / Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linhasComPendencias.map((linha) => {
                  const IconeSituacao = obterIconeSituacao(linha.situacao);
                  const valorDestino = linha.obrigatorioSemOrigem
                    ? (linha.campoDestino ?? "")
                    : (destinosSelecionados[linha.id] ?? "");
                  const obrigatorio = Boolean(
                    valorDestino && camposObrigatoriosSet.has(valorDestino),
                  );

                  return (
                    <tr
                      key={linha.id}
                      className={
                        linha.obrigatorioSemOrigem
                          ? "border-y border-amber-200 bg-amber-50/40 hover:bg-amber-50/60"
                          : "bg-white hover:bg-slate-50/70"
                      }
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="min-w-0 overflow-hidden">
                          <p
                            className="truncate font-semibold text-slate-950"
                            title={linha.nomeOrigem}
                          >
                            {linha.nomeOrigem}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {linha.descricaoOrigem ? (
                              <span
                                className="max-w-full truncate text-xs text-slate-500"
                                title={linha.descricaoOrigem}
                              >
                                {linha.descricaoOrigem}
                              </span>
                            ) : null}
                            <Badge
                              variant="outline"
                              className="gap-1 rounded-md border-slate-200 bg-white text-[11px] text-slate-600"
                            >
                              <IconeSituacao className="h-3.5 w-3.5" />
                              {formatarSituacao(linha.situacao)}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-700">
                        <p
                          className="truncate rounded-md bg-slate-50 px-2.5 py-1.5 font-mono text-xs"
                          title={linha.amostra ?? undefined}
                        >
                          {linha.amostra || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {linha.obrigatorioSemOrigem ? (
                          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2 text-sm font-medium text-slate-900">
                            {obterLabelDestino(
                              linha.campoDestino,
                              opcoesDestino,
                            )}
                          </div>
                        ) : (
                          <SelectDestino
                            linha={linha}
                            opcoesDestino={opcoesDestino}
                            valor={valorDestino}
                            aoAlterar={(valor) =>
                              setDestinosSelecionados((atuais) => ({
                                ...atuais,
                                [linha.id]: valor,
                              }))
                            }
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <BadgeObrigatorio obrigatorio={obrigatorio} />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <StatusLinhaMapeamento linha={linha} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {linhasComPendencias.map((linha) => (
              <LinhaMobile
                key={linha.id}
                linha={linha}
                labelPrimeiraColuna={labelPrimeiraColuna}
                labelAmostra={labelAmostra}
                valorDestino={destinosSelecionados[linha.id] ?? ""}
                aoAlterarDestino={(valor) =>
                  setDestinosSelecionados((atuais) => ({
                    ...atuais,
                    [linha.id]: valor,
                  }))
                }
                opcoesDestino={opcoesDestino}
                obrigatorio={Boolean(
                  (linha.obrigatorioSemOrigem
                    ? linha.campoDestino
                    : destinosSelecionados[linha.id]) &&
                    camposObrigatoriosSet.has(
                      linha.obrigatorioSemOrigem
                        ? (linha.campoDestino ?? "")
                        : (destinosSelecionados[linha.id] ?? ""),
                    ),
                )}
              />
            ))}
          </div>
        </>
      )}

      <div className="grid gap-4 border-t border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-1.5">
          {mostrarCheckbox ? (
            <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                name="salvarParaFornecedor"
                value="true"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-950"
              />
              <span>{textoCheckbox}</span>
            </label>
          ) : null}
          {textoRodape ? (
            <p className="text-xs text-slate-500">{textoRodape}</p>
          ) : null}
          {obrigatoriosSemOrigem > 0 ? (
            <p className="text-xs font-medium text-amber-700">
              Existe {obrigatoriosSemOrigem} campo
              {obrigatoriosSemOrigem === 1 ? "" : "s"} obrigatório
              {obrigatoriosSemOrigem === 1 ? "" : "s"} sem origem na{" "}
              {tipoOrigem === "api" ? "API" : "origem"}.{" "}
              {obrigatoriosSemOrigem === 1 ? "Ele" : "Eles"} deverá
              {obrigatoriosSemOrigem === 1 ? "" : "o"} ser resolvido
              {obrigatoriosSemOrigem === 1 ? "" : "s"} na Conciliação antes da
              publicação.
            </p>
          ) : null}
        </div>
        {hrefAcaoPrincipal ? (
          <Button asChild className="h-10 min-w-[210px] gap-2">
            <a href={hrefAcaoPrincipal}>
              {textoAcaoPrincipal}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button
            type={tipoBotaoAcaoPrincipal}
            className="h-10 min-w-[210px] gap-2"
          >
            {textoAcaoPrincipal}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
