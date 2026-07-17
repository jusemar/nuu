"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Layers3,
  Loader2,
  LockKeyhole,
  Settings2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useFluxoAlteracaoEmMassa } from "../../../hooks/alteracao-em-massa/use-fluxo-alteracao-em-massa";
import { calcularPreviewAlteracaoEmMassa } from "../../../lib/alteracao-em-massa/calcular-preview-alteracao-em-massa";
import type { OperacaoAlteracaoEmMassa } from "../../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type {
  DadosAlteracaoEmMassa,
  ProdutoAlteracaoEmMassa,
} from "../../../types/alteracao-em-massa.types";
import type { ResultadoAplicacaoAlteracaoEmMassa } from "../../../types/resultado-alteracao-em-massa.types";
import { ConfiguradorOperacoesProdutos } from "./configurador-operacoes-produtos";
import { PreviewAlteracoesProdutos } from "./preview-alteracoes-produtos";

type Props = {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  produtosSelecionados: ProdutoAlteracaoEmMassa[];
  dados: DadosAlteracaoEmMassa;
  onAplicacaoConcluida: () => void;
  onAtualizarListagem: () => Promise<void>;
};

export function PainelConfiguracaoVisual({
  aberto,
  onOpenChange,
  produtosSelecionados,
  dados,
  onAplicacaoConcluida,
  onAtualizarListagem,
}: Props) {
  const [operacoes, setOperacoes] = useState<OperacaoAlteracaoEmMassa[]>([]);
  const [camposAtivos, setCamposAtivos] = useState(0);
  const [chaveEditor, setChaveEditor] = useState(0);
  const [visaoMobile, setVisaoMobile] = useState<"configuracao" | "preview">(
    "configuracao",
  );
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
  const receberOperacoes = useCallback(
    (novas: OperacaoAlteracaoEmMassa[]) => setOperacoes(novas),
    [],
  );
  const receberCamposAtivos = useCallback(
    (quantidade: number) => setCamposAtivos(quantidade),
    [],
  );
  const preview = useMemo(
    () =>
      calcularPreviewAlteracaoEmMassa(produtosSelecionados, operacoes, dados),
    [dados, operacoes, produtosSelecionados],
  );
  const produtosIds = useMemo(
    () => produtosSelecionados.map((produto) => produto.id),
    [produtosSelecionados],
  );
  const fluxo = useFluxoAlteracaoEmMassa({
    produtosIds,
    operacoes,
    onSucesso: onAplicacaoConcluida,
    onAtualizarListagem,
  });
  const assinaturaOperacoes = JSON.stringify(operacoes);
  const assinaturaProdutos = produtosIds.join(",");
  useEffect(() => {
    fluxo.invalidarPreview();
  }, [assinaturaOperacoes, assinaturaProdutos, fluxo.invalidarPreview]);
  const previewExibido = fluxo.previewServidor?.linhas ?? preview;
  const simples = produtosSelecionados.filter(
    (produto) => produto.tipoProduto === "simple",
  ).length;
  const variaveis = produtosSelecionados.length - simples;
  const conflitos = previewExibido.filter(
    (linha) => linha.resultado === "conflito",
  ).length;
  const semAlteracao = previewExibido.filter(
    (linha) => linha.resultado === "sem_alteracao",
  ).length;
  const podeAplicar = Boolean(
    fluxo.previewServidor &&
      fluxo.previewServidor.resumo.conflitos === 0 &&
      fluxo.previewServidor.resumo.alteracoesEfetivas > 0 &&
      !fluxo.revisando &&
      !fluxo.aplicando,
  );

  function descartarAlteracoes() {
    setOperacoes([]);
    setCamposAtivos(0);
    setChaveEditor((atual) => atual + 1);
    setVisaoMobile("configuracao");
    fluxo.invalidarPreview();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(novoEstado) => {
        if (!novoEstado && confirmacaoAberta) {
          setConfirmacaoAberta(false);
          return;
        }
        if (!novoEstado && (fluxo.revisando || fluxo.aplicando)) return;
        onOpenChange(novoEstado);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="grid h-[100dvh] w-screen max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 rounded-none border-0 p-0 sm:max-w-none lg:h-[96dvh] lg:w-[96vw] lg:rounded-xl lg:border"
      >
        <DialogHeader className="border-b bg-white px-4 py-3 text-left sm:px-6">
          <div className="flex items-start gap-3 pr-10">
            <div className="hidden rounded-lg bg-blue-50 p-2 text-blue-700 sm:block">
              <Layers3 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>Configurar alterações</DialogTitle>
                <Badge variant="outline">Aplicação em massa</Badge>
              </div>
              <DialogDescription className="mt-1">
                {produtosSelecionados.length} selecionado(s) · {simples} simples
                elegível(is)
                {variaveis > 0
                  ? ` · ${variaveis} variável(is) ignorado(s)`
                  : ""}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar configuração"
              className="absolute top-3 right-3"
              disabled={fluxo.revisando || fluxo.aplicando}
            >
              <X className="size-5" />
            </Button>
          </div>
          <div
            className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950"
            role="note"
          >
            <LockKeyhole className="size-4 shrink-0" />
            <span>
              <strong>Aplicação protegida.</strong> Revise no servidor antes de
              confirmar; produtos alterados após o preview serão bloqueados.
            </span>
          </div>
          {fluxo.erroControlado ? (
            <div
              className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
              role="alert"
            >
              {fluxo.erroControlado}
            </div>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 overflow-hidden bg-slate-50/50">
          <div className="flex border-b bg-white p-2 lg:hidden" role="tablist">
            <Button
              type="button"
              variant={visaoMobile === "configuracao" ? "secondary" : "ghost"}
              className="flex-1"
              role="tab"
              aria-selected={visaoMobile === "configuracao"}
              onClick={() => setVisaoMobile("configuracao")}
            >
              <Settings2 className="size-4" /> Configuração
            </Button>
            <Button
              type="button"
              variant={visaoMobile === "preview" ? "secondary" : "ghost"}
              className="flex-1"
              role="tab"
              aria-selected={visaoMobile === "preview"}
              onClick={() => setVisaoMobile("preview")}
            >
              <Eye className="size-4" /> Revisão
              {conflitos > 0 && (
                <Badge variant="destructive">{conflitos}</Badge>
              )}
            </Button>
          </div>

          {fluxo.resultado ? (
            <ResultadoAplicacao
              resultado={fluxo.resultado}
              onVoltar={() => onOpenChange(false)}
              onNovaAlteracao={() => {
                fluxo.limparResultado();
                if (fluxo.resultado?.status === "sucesso") {
                  descartarAlteracoes();
                  onOpenChange(false);
                }
              }}
              onGerarNovoPreview={() => {
                fluxo.limparResultado();
                void fluxo.revisar();
              }}
              erroAtualizacao={fluxo.erroAtualizacao}
              atualizandoListagem={fluxo.atualizandoListagem}
              onAtualizarListagem={() => void fluxo.atualizarListagem()}
            />
          ) : (
            <div className="grid h-[calc(100%-3.25rem)] min-h-0 lg:h-full lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_430px]">
              <main
                className={cn(
                  "min-h-0 overflow-y-auto p-4 sm:p-5 lg:block lg:p-6",
                  visaoMobile !== "configuracao" && "hidden",
                )}
              >
                <div className="mx-auto max-w-5xl">
                  <ConfiguradorOperacoesProdutos
                    key={chaveEditor}
                    dados={dados}
                    produtosSelecionados={produtosSelecionados}
                    onOperacoesChange={receberOperacoes}
                    onCamposAtivosChange={receberCamposAtivos}
                  />
                </div>
              </main>

              <aside
                className={cn(
                  "min-h-0 overflow-y-auto border-l bg-white p-4 sm:p-5 lg:sticky lg:top-0 lg:block",
                  visaoMobile !== "preview" && "hidden",
                )}
                aria-label="Revisão das alterações"
              >
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <Resumo
                    rotulo="Selecionados"
                    valor={
                      fluxo.previewServidor?.resumo.produtosSelecionados ??
                      produtosSelecionados.length
                    }
                  />
                  <Resumo
                    rotulo="Simples válidos"
                    valor={
                      fluxo.previewServidor?.resumo.produtosSimples ?? simples
                    }
                  />
                  <Resumo
                    rotulo="Variáveis ignorados"
                    valor={
                      fluxo.previewServidor?.resumo.produtosIgnorados ??
                      variaveis
                    }
                  />
                  <Resumo rotulo="Operações válidas" valor={operacoes.length} />
                  <Resumo
                    rotulo="Conflitos"
                    valor={conflitos}
                    destaque={conflitos > 0}
                  />
                  <Resumo rotulo="Sem mudança" valor={semAlteracao} />
                </div>
                {fluxo.previewServidor && (
                  <div className="mb-3 space-y-2">
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="size-3" /> Preview validado no
                      servidor
                    </Badge>
                    <div
                      className="flex flex-wrap gap-1"
                      aria-label="Campos que serão alterados"
                    >
                      {fluxo.previewServidor.resumo.campos.map((campo) => (
                        <Badge key={campo} variant="outline">
                          {campo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <PreviewAlteracoesProdutos linhas={previewExibido} />
              </aside>
            </div>
          )}
        </div>

        {!fluxo.resultado && (
          <footer className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">{camposAtivos}</strong>{" "}
              campo(s) ativo(s) · {operacoes.length} operação(ões) válida(s)
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="outline"
                onClick={descartarAlteracoes}
                disabled={camposAtivos === 0}
              >
                Descartar alterações
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const concluido = await fluxo.revisar();
                  if (concluido) setVisaoMobile("preview");
                }}
                disabled={
                  operacoes.length === 0 || fluxo.revisando || fluxo.aplicando
                }
              >
                {fluxo.revisando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Eye className="size-4" />
                )}
                Revisar alterações
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="col-span-2" tabIndex={0}>
                    <Button
                      disabled={!podeAplicar}
                      onClick={() => setConfirmacaoAberta(true)}
                      className="w-full sm:w-auto"
                    >
                      {fluxo.aplicando ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Confirmar e aplicar
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!fluxo.previewServidor
                    ? "Gere o preview no servidor antes de confirmar."
                    : conflitos > 0
                      ? "Resolva os conflitos antes de aplicar."
                      : "Aplicar alterações revisadas."}
                </TooltipContent>
              </Tooltip>
            </div>
          </footer>
        )}
        {confirmacaoAberta && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/45 p-4">
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="titulo-confirmacao-massa"
              aria-describedby="descricao-confirmacao-massa"
              className="w-full max-w-md rounded-xl border bg-white p-5 shadow-xl"
            >
              <h2
                id="titulo-confirmacao-massa"
                className="text-lg font-semibold"
              >
                Confirmar alterações em massa?
              </h2>
              <p
                id="descricao-confirmacao-massa"
                className="text-muted-foreground mt-2 text-sm"
              >
                Esta ação atualizará{" "}
                {fluxo.previewServidor?.resumo.produtosSimples ?? 0} produto(s)
                simples. Produtos variáveis continuarão ignorados.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmacaoAberta(false)}
                  disabled={fluxo.aplicando}
                >
                  Cancelar
                </Button>
                <Button
                  autoFocus
                  disabled={fluxo.aplicando}
                  onClick={async () => {
                    await fluxo.aplicar();
                    setConfirmacaoAberta(false);
                  }}
                >
                  {fluxo.aplicando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {fluxo.aplicando ? "Aplicando..." : "Confirmar aplicação"}
                </Button>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultadoAplicacao({
  resultado,
  onVoltar,
  onNovaAlteracao,
  onGerarNovoPreview,
  erroAtualizacao,
  atualizandoListagem,
  onAtualizarListagem,
}: {
  resultado: ResultadoAplicacaoAlteracaoEmMassa;
  onVoltar: () => void;
  onNovaAlteracao: () => void;
  onGerarNovoPreview: () => void;
  erroAtualizacao: string | null;
  atualizandoListagem: boolean;
  onAtualizarListagem: () => void;
}) {
  const possuiConflito = resultado.detalhes.some(
    (item) => item.conflitoConcorrencia,
  );
  return (
    <main className="h-full overflow-y-auto p-5 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6 rounded-xl border bg-white p-5 shadow-sm sm:p-7">
        <div className="text-center">
          {resultado.status === "sucesso" ? (
            <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
          ) : (
            <AlertTriangle className="mx-auto size-10 text-amber-600" />
          )}
          <h2 className="mt-3 text-xl font-semibold">Resultado da aplicação</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Status: {resultado.status}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Resumo rotulo="Alterados" valor={resultado.alterados} />
          <Resumo rotulo="Ignorados" valor={resultado.ignorados} />
          <Resumo rotulo="Sem mudança" valor={resultado.semMudanca} />
          <Resumo
            rotulo="Erros"
            valor={resultado.erros}
            destaque={resultado.erros > 0}
          />
        </div>
        {erroAtualizacao ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
            role="alert"
          >
            <p>
              <strong>As alterações foram salvas.</strong> {erroAtualizacao}
            </p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={onAtualizarListagem}
              disabled={atualizandoListagem}
            >
              {atualizandoListagem ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Tentar atualizar a listagem
            </Button>
          </div>
        ) : null}
        {resultado.detalhes.some((item) => item.resultado === "erro") && (
          <div className="space-y-2">
            <h3 className="font-semibold">Detalhes</h3>
            {resultado.detalhes
              .filter((item) => item.resultado === "erro")
              .map((item) => (
                <div
                  key={item.produtoId}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
                >
                  <p className="font-medium">{item.produto}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    SKU: {item.sku}
                  </p>
                  <dl className="mt-2 grid gap-1 text-amber-950 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium">Status</dt>
                      <dd>Falha</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Entidade / campo</dt>
                      <dd>
                        {item.entidade ?? "lote"}
                        {item.campoVersao ? ` · ${item.campoVersao}` : ""}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-amber-900">{item.mensagem}</p>
                  {item.versaoEsperada && item.versaoEncontrada ? (
                    <div className="mt-2 rounded border border-amber-200 bg-white/70 p-2 font-mono text-[11px] break-all">
                      <p>Esperada: {item.versaoEsperada}</p>
                      <p>Encontrada: {item.versaoEncontrada}</p>
                      <p>Etapa: {item.etapa}</p>
                    </div>
                  ) : null}
                  {item.orientacao ? (
                    <p className="mt-2 font-medium text-amber-950">
                      {item.orientacao}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onVoltar}>
            Voltar à listagem
          </Button>
          <Button onClick={onNovaAlteracao}>
            {resultado.status === "sucesso"
              ? "Realizar nova alteração"
              : "Voltar à configuração"}
          </Button>
          {possuiConflito ? (
            <Button onClick={onGerarNovoPreview}>Gerar novo preview</Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Resumo({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-slate-50 p-3",
        destaque && "border-amber-300 bg-amber-50",
      )}
    >
      <p className="text-muted-foreground text-xs">{rotulo}</p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  );
}
