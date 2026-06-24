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
      impacto?: string;
      estrategiaPadrao?: string;
    };

export type OpcaoValorPadraoLoja = {
  id: string;
  nome: string;
};

export const CAMPOS_OBRIGATORIOS_MAPEAMENTO_FORNECEDOR = [
  { valor: "codigo_fornecedor", label: "Código fornecedor" },
  { valor: "nome_produto", label: "Nome do produto" },
  { valor: "categoria_fornecedor", label: "Categoria da loja" },
  { valor: "marca_fornecedor", label: "Marca da loja" },
  { valor: "preco_fornecedor", label: "Preço principal/modalidade" },
] satisfies Array<{ valor: string; label: string }>;

export const CAMPOS_IMPORTANTES_MAPEAMENTO_FORNECEDOR = [
  { valor: "ncm", label: "NCM", impacto: "Gera alerta fiscal" },
  { valor: "ean_gtin", label: "EAN/GTIN", impacto: "Gera alerta comercial" },
  { valor: "imagens", label: "Imagem principal/imagens" },
  { valor: "peso", label: "Peso", impacto: "Gera alerta de frete" },
  { valor: "altura", label: "Altura", impacto: "Gera alerta de frete" },
  { valor: "largura", label: "Largura", impacto: "Gera alerta de frete" },
  {
    valor: "comprimento",
    label: "Comprimento",
    impacto: "Gera alerta de frete",
  },
  { valor: "estoque_fornecedor", label: "Estoque" },
  { valor: "prazo_entrega", label: "Prazo de entrega" },
  { valor: "descricao", label: "Descrição" },
  { valor: "grupo_origem", label: "Grupo de origem do fornecedor" },
  { valor: "subgrupo_origem", label: "Subgrupo de origem do fornecedor" },
] satisfies Array<{ valor: string; label: string; impacto?: string }>;

export type TabelaMapeamentoCamposFornecedorProps = {
  tipoOrigem: "arquivo" | "api";
  titulo: string;
  subtitulo: string;
  labelPrimeiraColuna: string;
  labelAmostra: string;
  linhas: LinhaMapeamentoFornecedor[];
  opcoesDestino: OpcaoMapeamentoFornecedor[];
  camposObrigatorios?: CampoObrigatorioMapeamentoFornecedor[];
  camposImportantes?: CampoObrigatorioMapeamentoFornecedor[];
  categoriasLoja?: OpcaoValorPadraoLoja[];
  marcasLoja?: OpcaoValorPadraoLoja[];
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

function normalizarCamposMapeamento(
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

function obterMotivoSemOrigem(tipoOrigem: "arquivo" | "api") {
  return tipoOrigem === "api"
    ? "Não enviado pela API"
    : "Não encontrado no arquivo";
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

function ConfiguracaoPrecoVisual() {
  return (
    <div className="mt-2 grid gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-xs text-slate-700 sm:grid-cols-3">
      <label className="grid gap-1">
        <span className="font-medium text-slate-600">Modalidade</span>
        <select className="h-8 rounded-md border border-blue-100 bg-white px-2 text-xs outline-none focus:border-blue-300">
          <option>Dropshipping</option>
          <option>Estoque próprio</option>
          <option>Pré-venda</option>
          <option>Sob encomenda</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="font-medium text-slate-600">Uso do preço</span>
        <select className="h-8 rounded-md border border-blue-100 bg-white px-2 text-xs outline-none focus:border-blue-300">
          <option>Preço de venda</option>
          <option>Custo fornecedor</option>
        </select>
      </label>
      <label className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5">
        <input
          type="checkbox"
          defaultChecked
          className="h-3.5 w-3.5 rounded border-blue-200 accent-blue-700"
        />
        <span>Card principal</span>
      </label>
      <label className="grid gap-1 sm:col-span-3">
        <span className="font-medium text-slate-600">Prazo da modalidade</span>
        <input
          className="h-8 rounded-md border border-blue-100 bg-white px-2 text-xs outline-none focus:border-blue-300"
          placeholder="Ex: 3 a 5 dias úteis"
        />
      </label>
    </div>
  );
}

type EstrategiaResolucaoVisual =
  | "valor_padrao"
  | "conciliacao"
  | "rascunho"
  | "ignorar";

function SelectEstrategiaVisual({
  tipo,
  valor,
  aoAlterar,
}: {
  tipo: "obrigatorio" | "importante";
  valor: EstrategiaResolucaoVisual;
  aoAlterar: (valor: EstrategiaResolucaoVisual) => void;
}) {
  const opcoes =
    tipo === "obrigatorio"
      ? [
          ["valor_padrao", "Valor padrão para todos"],
          ["conciliacao", "Preencher item a item na Conciliação"],
          ["rascunho", "Publicar como rascunho até preencher"],
        ]
      : [
          ["valor_padrao", "Valor padrão para todos"],
          ["conciliacao", "Resolver na Conciliação"],
          ["ignorar", "Ignorar por enquanto"],
          ["rascunho", "Publicar como rascunho até preencher"],
        ];

  return (
    <select
      value={valor}
      onChange={(evento) =>
        aoAlterar(evento.target.value as EstrategiaResolucaoVisual)
      }
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
    >
      {opcoes.map(([opcao, label]) => (
        <option key={opcao} value={opcao}>
          {label}
        </option>
      ))}
    </select>
  );
}

function obterEstrategiaInicial(
  valorPadrao: string | undefined,
  tipo: "obrigatorio" | "importante",
): EstrategiaResolucaoVisual {
  if (
    valorPadrao === "valor_padrao" ||
    valorPadrao === "conciliacao" ||
    valorPadrao === "rascunho" ||
    valorPadrao === "ignorar"
  ) {
    return valorPadrao;
  }

  return tipo === "obrigatorio" ? "valor_padrao" : "conciliacao";
}

function CampoValorPadraoVisual({
  campo,
  categoriasLoja,
  marcasLoja,
}: {
  campo: { valor: string; label: string };
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: OpcaoValorPadraoLoja[];
}) {
  if (campo.valor === "categoria_fornecedor") {
    return (
      <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400">
        <option>Selecionar categoria</option>
        {categoriasLoja.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nome}
          </option>
        ))}
      </select>
    );
  }

  if (campo.valor === "marca_fornecedor") {
    return (
      <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400">
        <option>Selecionar marca</option>
        {marcasLoja.map((marca) => (
          <option key={marca.id} value={marca.id}>
            {marca.nome}
          </option>
        ))}
      </select>
    );
  }

  if (
    campo.valor === "altura" ||
    campo.valor === "largura" ||
    campo.valor === "comprimento"
  ) {
    return (
      <input
        type="number"
        min="0"
        step="0.01"
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
        placeholder="Ex: 20"
      />
    );
  }

  if (campo.valor === "peso") {
    return (
      <input
        type="number"
        min="0"
        step="0.001"
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
        placeholder="Ex: 0.5"
      />
    );
  }

  if (campo.valor === "estoque_fornecedor") {
    return (
      <input
        type="number"
        min="0"
        step="1"
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
        placeholder="Ex: 10"
      />
    );
  }

  if (campo.valor === "preco_fornecedor") {
    return (
      <div>
        <input
          type="number"
          min="0"
          step="0.01"
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
          placeholder="Ex: 99.90"
        />
        <ConfiguracaoPrecoVisual />
      </div>
    );
  }

  const placeholders: Record<string, string> = {
    ncm: "Ex: 6204.62.00",
    ean_gtin: "Ex: 7890000000000",
    garantia: "Ex: 90 dias",
    prazo_entrega: "Ex: 3 a 5 dias úteis",
    codigo_fornecedor: "Ex: 110012",
    nome_produto: "Ex: Nome padrão",
  };

  return (
    <input
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
      placeholder={placeholders[campo.valor] ?? `Ex: ${campo.label}`}
    />
  );
}

function ValorOuObservacaoVisual({
  campo,
  estrategia,
  categoriasLoja,
  marcasLoja,
}: {
  campo: { valor: string; label: string };
  estrategia: EstrategiaResolucaoVisual;
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: OpcaoValorPadraoLoja[];
}) {
  if (estrategia === "valor_padrao") {
    return (
      <CampoValorPadraoVisual
        campo={campo}
        categoriasLoja={categoriasLoja}
        marcasLoja={marcasLoja}
      />
    );
  }

  const mensagens: Record<EstrategiaResolucaoVisual, string> = {
    valor_padrao: "",
    conciliacao: "Será definido produto por produto na Conciliação.",
    rascunho: "Produto ficará como rascunho até este campo ser preenchido.",
    ignorar: "Será ignorado por enquanto e exibido apenas como alerta.",
  };

  return (
    <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      {mensagens[estrategia]}
    </p>
  );
}

function SecaoCamposSemOrigem({
  titulo,
  descricao,
  tipoOrigem,
  campos,
  tipo,
  categoriasLoja,
  marcasLoja,
}: {
  titulo: string;
  descricao: string;
  tipoOrigem: "arquivo" | "api";
  campos: Array<{
    valor: string;
    label: string;
    impacto?: string;
    estrategiaPadrao?: string;
  }>;
  tipo: "obrigatorio" | "importante";
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: OpcaoValorPadraoLoja[];
}) {
  const estrategiasIniciais = Object.fromEntries(
    campos.map((campo) => [
      campo.valor,
      obterEstrategiaInicial(campo.estrategiaPadrao, tipo),
    ]),
  ) as Record<string, EstrategiaResolucaoVisual>;
  const [estrategias, setEstrategias] =
    useState<Record<string, EstrategiaResolucaoVisual>>(estrategiasIniciais);
  const obrigatorio = tipo === "obrigatorio";

  if (campos.length === 0) return null;

  return (
    <section
      className={`border-t px-4 py-4 sm:px-5 ${
        obrigatorio
          ? "border-amber-200 bg-amber-50/35"
          : "border-blue-100 bg-blue-50/25"
      }`}
    >
      <div className="mb-3 flex flex-col gap-1">
        <h3
          className={`text-sm font-semibold ${
            obrigatorio ? "text-amber-900" : "text-slate-900"
          }`}
        >
          {titulo}
        </h3>
        <p className="max-w-3xl text-sm text-slate-600">{descricao}</p>
        <p className="max-w-4xl text-xs font-medium text-slate-500">
          Quando escolher “Valor padrão para todos”, informe o valor agora.
          Quando escolher “Preencher item a item”, a correção acontecerá na
          Conciliação.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="hidden grid-cols-[1.05fr_0.9fr_1.2fr_1.4fr] border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase lg:grid">
          <span>Campo da loja</span>
          <span>Motivo</span>
          <span>Estratégia</span>
          <span>Valor / Observação</span>
        </div>
        {campos.map((campo) => (
          <article
            key={campo.valor}
            className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 lg:grid-cols-[1.05fr_0.9fr_1.2fr_1.4fr] lg:items-start"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Campo da loja
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                {campo.label}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  obrigatorio ? "text-amber-700" : "text-blue-700"
                }`}
              >
                {obrigatorio
                  ? "Obrigatório para publicar"
                  : "Não bloqueia publicação"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Motivo
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {obterMotivoSemOrigem(tipoOrigem)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Estratégia
              </p>
              <SelectEstrategiaVisual
                tipo={tipo}
                valor={
                  estrategias[campo.valor] ?? estrategiasIniciais[campo.valor]
                }
                aoAlterar={(valor) =>
                  setEstrategias((atuais) => ({
                    ...atuais,
                    [campo.valor]: valor,
                  }))
                }
              />
              <Badge
                variant="outline"
                className={
                  obrigatorio
                    ? "mt-2 border-amber-200 bg-amber-50 text-amber-800"
                    : "mt-2 border-blue-200 bg-blue-50 text-blue-700"
                }
              >
                {campo.impacto ??
                  (obrigatorio ? "Bloqueia publicação" : "Gera alerta")}
              </Badge>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Valor / Observação
              </p>
              <ValorOuObservacaoVisual
                campo={campo}
                estrategia={
                  estrategias[campo.valor] ?? estrategiasIniciais[campo.valor]
                }
                categoriasLoja={categoriasLoja}
                marcasLoja={marcasLoja}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
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
          <div>
            <SelectDestino
              linha={linha}
              opcoesDestino={opcoesDestino}
              valor={valorDestino}
              aoAlterar={aoAlterarDestino}
            />
            {valorDestino === "preco_fornecedor" ? (
              <ConfiguracaoPrecoVisual />
            ) : null}
          </div>
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
  camposImportantes = CAMPOS_IMPORTANTES_MAPEAMENTO_FORNECEDOR,
  categoriasLoja = [],
  marcasLoja = [],
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
    () => normalizarCamposMapeamento(camposObrigatorios, opcoesDestino),
    [camposObrigatorios, opcoesDestino],
  );
  const camposImportantesNormalizados = useMemo(
    () => normalizarCamposMapeamento(camposImportantes, opcoesDestino),
    [camposImportantes, opcoesDestino],
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
  const camposImportantesSemOrigem = camposImportantesNormalizados.filter(
    (campo) => !Object.values(destinosSelecionados).includes(campo.valor),
  );
  const obrigatoriosSemOrigem = camposObrigatoriosSemOrigem.length;
  const importantesSemOrigem = camposImportantesSemOrigem.length;
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
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xs sm:min-w-[520px] xl:grid-cols-5">
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
            <div className="rounded-lg bg-blue-50 px-2 py-1.5">
              <p className="text-[11px] font-medium text-slate-500">
                Importantes sem origem
              </p>
              <p className="mt-0.5 text-lg font-semibold text-blue-700">
                {importantesSemOrigem}
              </p>
            </div>
            <div
              className={`px-2 py-1.5 ${
                conflitos > 0 ? "rounded-lg bg-red-50" : ""
              }`}
            >
              <p className="text-[11px] font-medium text-slate-500">
                Conflitos
              </p>
              <p
                className={`mt-0.5 text-lg font-semibold ${
                  conflitos > 0 ? "text-red-700" : "text-slate-950"
                }`}
              >
                {conflitos}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">
          Você pode continuar para Vínculos, mas produtos com campos
          obrigatórios pendentes não poderão ser publicados até a Conciliação.
        </p>
      </div>

      {linhas.length === 0 ? (
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
                {linhas.map((linha) => {
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
                          <div>
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
                            {valorDestino === "preco_fornecedor" ? (
                              <ConfiguracaoPrecoVisual />
                            ) : null}
                          </div>
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
            {linhas.map((linha) => (
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

      <SecaoCamposSemOrigem
        titulo="Campos obrigatórios sem origem"
        descricao="Esses campos são necessários para publicar produtos simples. Defina uma estratégia ou eles serão resolvidos na Conciliação."
        tipoOrigem={tipoOrigem}
        campos={camposObrigatoriosSemOrigem}
        tipo="obrigatorio"
        categoriasLoja={categoriasLoja}
        marcasLoja={marcasLoja}
      />

      <SecaoCamposSemOrigem
        titulo="Campos importantes sem origem"
        descricao="Esses campos não bloqueiam a publicação, mas podem gerar alertas ou exigir revisão."
        tipoOrigem={tipoOrigem}
        campos={camposImportantesSemOrigem}
        tipo="importante"
        categoriasLoja={categoriasLoja}
        marcasLoja={marcasLoja}
      />

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
