"use client";

import { Check, Gem, RotateCcw } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";

import { salvarProgramaFidelidade } from "../../actions/salvar-programa-fidelidade";
import type {
  CategoriaFidelidade,
  ConfiguracaoFidelidade,
  RegraCategoriaFidelidade,
} from "../../types/programa-fidelidade.types";
import { ConfiguracoesProgramaFidelidade } from "./configuracoes-programa-fidelidade";
import { PainelCategoriasFidelidade } from "./painel-categorias-fidelidade";
import { RecursosFuturosFidelidade } from "./recursos-futuros-fidelidade";

function Metrica({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {rotulo}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
        {valor}
      </div>
      <div className="text-muted-foreground mt-0.5 text-xs">{detalhe}</div>
    </div>
  );
}

export function PaginaProgramaFidelidadeAdmin({
  categorias,
  configuracao: configuracaoInicial,
  regras: regrasIniciais,
  versao: versaoInicial,
}: {
  categorias: CategoriaFidelidade[];
  configuracao: ConfiguracaoFidelidade;
  regras: RegraCategoriaFidelidade[];
  versao: number;
}) {
  const [configuracao, setConfiguracao] = useState(configuracaoInicial);
  const [regras, setRegras] = useState(regrasIniciais);
  const [persistido, setPersistido] = useState({
    configuracao: configuracaoInicial,
    regras: regrasIniciais,
    versao: versaoInicial,
  });
  const [alterado, setAlterado] = useState(false);
  const [salvando, iniciarSalvamento] = useTransition();
  const totais = useMemo(() => {
    const emitidos = categorias.reduce(
      (soma, categoria) => soma + categoria.pontosUltimos30Dias,
      0,
    );
    const personalizadas = regras.filter((regra) => regra.personalizada).length;
    const passivo =
      configuracao.pontosConversao > 0
        ? (emitidos * configuracao.valorCredito) / configuracao.pontosConversao
        : 0;
    return { emitidos, personalizadas, passivo };
  }, [categorias, regras, configuracao]);

  function alterarConfiguracao(mudanca: Partial<ConfiguracaoFidelidade>) {
    setConfiguracao((atual) => ({ ...atual, ...mudanca }));
    setAlterado(true);
  }
  function alterarRegra(
    id: string,
    mudanca: Partial<RegraCategoriaFidelidade>,
  ) {
    setRegras((atuais) =>
      atuais.map((regra) =>
        regra.categoriaId === id ? { ...regra, ...mudanca } : regra,
      ),
    );
    setAlterado(true);
  }
  function descartar() {
    setConfiguracao(persistido.configuracao);
    setRegras(persistido.regras);
    setAlterado(false);
  }
  function salvar() {
    iniciarSalvamento(async () => {
      const resultado = await salvarProgramaFidelidade({
        configuracao,
        regras,
        versao: persistido.versao,
      });
      if (!resultado.sucesso) {
        toast.error(resultado.mensagem);
        return;
      }
      const novoPersistido = {
        configuracao: resultado.configuracao,
        regras: resultado.regras,
        versao: resultado.versao,
      };
      setConfiguracao(novoPersistido.configuracao);
      setRegras(novoPersistido.regras);
      setPersistido(novoPersistido);
      setAlterado(false);
      toast.success(resultado.mensagem);
    });
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        <header className="bg-background/95 sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
              <Gem className="size-5" />
            </span>
            <div>
              <h1 className="text-lg leading-tight font-semibold">
                Programa de Fidelidade
              </h1>
              <p className="text-muted-foreground text-xs">
                {configuracao.nomePublico} · configuração administrativa
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-card flex items-center gap-2.5 rounded-full border py-1.5 pr-2 pl-3">
              <span
                className={`size-2 rounded-full ${configuracao.ativo ? "bg-success" : "bg-muted-foreground/50"}`}
              />
              <span className="text-sm font-medium">
                {configuracao.ativo ? "Ativo" : "Pausado"}
              </span>
              <Switch
                checked={configuracao.ativo}
                onCheckedChange={(ativo) => alterarConfiguracao({ ativo })}
                aria-label="Ativar programa"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Descartar alterações"
              disabled={!alterado || salvando}
              onClick={descartar}
            >
              <RotateCcw />
            </Button>
            <Button disabled={!alterado || salvando} onClick={salvar}>
              <Check />
              {salvando
                ? "Salvando..."
                : alterado
                  ? "Salvar alterações"
                  : "Sem alterações"}
            </Button>
          </div>
        </header>
        <Badge variant="outline">
          Configurações reais · métricas operacionais ainda demonstrativas
        </Badge>
        <section
          aria-label="Resumo do programa"
          className="bg-card grid grid-cols-2 divide-x divide-y rounded-xl border shadow-sm sm:grid-cols-4 sm:divide-y-0"
        >
          <Metrica
            rotulo="Pontos emitidos"
            valor={totais.emitidos.toLocaleString("pt-BR")}
            detalhe="exemplo · últimos 30 dias"
          />
          <Metrica
            rotulo="Passivo estimado"
            valor={`R$ ${totais.passivo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
            detalhe="exemplo · crédito a resgatar"
          />
          <Metrica
            rotulo="Regra padrão"
            valor={`R$ 1 = ${configuracao.pontosPorReal} pt`}
            detalhe="acúmulo base"
          />
          <Metrica
            rotulo="Categorias ajustadas"
            valor={`${totais.personalizadas} de ${categorias.length}`}
            detalhe="com regra personalizada"
          />
        </section>
        <Tabs defaultValue="regras" className="gap-5">
          <TabsList className="grid h-11 w-full grid-cols-3 gap-1 p-1 sm:flex sm:w-fit">
            <TabsTrigger value="regras" className="px-4">
              Regras gerais
            </TabsTrigger>
            <TabsTrigger value="categorias" className="px-4">
              Categorias{" "}
              <span className="bg-background text-muted-foreground ml-1 rounded-full px-1.5 py-0.5 text-[11px]">
                {categorias.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="futuro" className="px-4">
              Em breve
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="regras"
            className="animate-in fade-in-50 duration-300"
          >
            <ConfiguracoesProgramaFidelidade
              valor={configuracao}
              alterar={alterarConfiguracao}
            />
          </TabsContent>
          <TabsContent
            value="categorias"
            className="animate-in fade-in-50 duration-300"
          >
            <PainelCategoriasFidelidade
              categorias={categorias}
              regras={regras}
              pontosPadrao={configuracao.pontosPorReal}
              atualizar={alterarRegra}
            />
          </TabsContent>
          <TabsContent
            value="futuro"
            className="animate-in fade-in-50 duration-300"
          >
            <RecursosFuturosFidelidade />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
