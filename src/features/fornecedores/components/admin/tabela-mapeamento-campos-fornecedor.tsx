"use client";

import { AlertCircle, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EstadoAplicarMapeamentoFornecedor } from "@/features/fornecedores/actions/aplicar-mapeamento-colunas-fornecedor";
import type {
  ConfiguracaoComercialMapeamentoFornecedor,
  EstrategiaPrazoEntregaFornecedor,
  ModalidadeComercialFornecedor,
} from "@/features/fornecedores/types/mapeamento-fornecedor.types";

import { BotaoSubmitComEstado } from "./botao-submit-com-estado";

/**
 * Preenche o lugar da Server Action quando o componente é usado sem `action`
 * (fluxo Laquila). Precisa existir fora do componente para manter identidade
 * estável entre renders e nunca reiniciar o `useActionState`.
 */
async function acaoMapeamentoIndisponivel(): Promise<EstadoAplicarMapeamentoFornecedor> {
  return null;
}

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

export const VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA =
  "__combinar_campos_categoria";

export type EstrategiaRegraMapeamentoFornecedor =
  | "valor_padrao_todos"
  | "conciliacao"
  | "rascunho"
  | "ignorar";

export type RegraMapeamentoFornecedor = {
  campoDestino: string;
  campoLabel: string;
  tipo: "obrigatorio" | "importante";
  estrategia: EstrategiaRegraMapeamentoFornecedor;
  valorPadraoId?: string;
  valorPadraoLabel?: string;
  valorPadraoTexto?: string;
};

export type RegistroCombinacaoCategoriaFornecedor = Record<
  string,
  string | number | null | undefined
>;

export type RegraCategoriaCombinacaoFornecedor = {
  estrategia: "combinacao_campos_api";
  camposApi: string[];
  campoApi1: string;
  campoApi2: string;
  traducoes: Array<{
    chave: string;
    valores: string[];
    categoriaId?: string;
    categoriaLabel?: string;
    quantidade: number;
  }>;
};

export type DadosTemporariosMapeamentoFornecedor = {
  destinosSelecionados: Record<string, string>;
  regras: RegraMapeamentoFornecedor[];
  categoriaCombinacao?: RegraCategoriaCombinacaoFornecedor;
  configuracaoComercial?: ConfiguracaoComercialMapeamentoFornecedor;
};

export type OpcoesAcionamentoMapeamentoFornecedor = {
  salvarComoPadrao: boolean;
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
  camposCombinacaoCategoria?: OpcaoMapeamentoFornecedor[];
  registrosCombinacaoCategoria?: RegistroCombinacaoCategoriaFornecedor[];
  camposCombinacaoCategoriaPadrao?: {
    campoApi1: string;
    campoApi2: string;
  };
  /**
   * Server Action do fluxo por arquivo. Recebe o estado anterior porque é
   * consumida por `useActionState`: é assim que a falha volta para a tela sem
   * derrubar o formulário. O fluxo Laquila não usa esta prop — ele aciona por
   * `aoAcionarPrincipal`.
   */
  action?: (
    estadoAnterior: EstadoAplicarMapeamentoFornecedor,
    formData: FormData,
  ) => Promise<EstadoAplicarMapeamentoFornecedor>;
  camposOcultos?: Array<{ nome: string; valor: string }>;
  nomeCampoConfiguracaoFluxo?: string;
  textoCheckbox?: string;
  mostrarCheckbox?: boolean;
  configuracaoInicial?: DadosTemporariosMapeamentoFornecedor | null;
  mostrarConfiguracaoComercial?: boolean;
  textoAcaoPrincipal: string;
  tipoBotaoAcaoPrincipal?: "submit" | "button";
  hrefAcaoPrincipal?: string;
  aoAcionarPrincipal?: (
    dados: DadosTemporariosMapeamentoFornecedor,
    opcoes: OpcoesAcionamentoMapeamentoFornecedor,
  ) => void | Promise<void>;
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

function obterLabelDestino(
  valor: string | null | undefined,
  opcoesDestino: OpcaoMapeamentoFornecedor[],
) {
  if (!valor) return "Ignorar";

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
    <div className="w-full min-w-0 space-y-1.5 sm:min-w-[120px]">
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
  permitirCombinarCampos = false,
}: {
  linha: LinhaMapeamentoFornecedor;
  opcoesDestino: OpcaoMapeamentoFornecedor[];
  valor: string;
  aoAlterar: (valor: string) => void;
  permitirCombinarCampos?: boolean;
}) {
  return (
    <select
      value={valor}
      onChange={(evento) => aoAlterar(evento.target.value)}
      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-xs transition-colors outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
    >
      <option value="">Ignorar</option>
      {permitirCombinarCampos ? (
        <option value={VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA}>
          Combinar campos
        </option>
      ) : null}
      {opcoesDestino.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.label}
        </option>
      ))}
    </select>
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

const OPCOES_MODALIDADE_COMERCIAL: Array<{
  valor: ModalidadeComercialFornecedor;
  label: string;
}> = [
  { valor: "stock", label: "Estoque próprio" },
  { valor: "pre_sale", label: "Pré-venda" },
  { valor: "dropshipping", label: "Dropshipping" },
  { valor: "order_basis", label: "Sob encomenda" },
];

function SecaoModalidadeComercial({
  modalidade,
  estrategiaPrazo,
  valorPrazo,
  aoAlterarModalidade,
  aoAlterarEstrategiaPrazo,
  aoAlterarValorPrazo,
}: {
  modalidade: ModalidadeComercialFornecedor;
  estrategiaPrazo: EstrategiaResolucaoVisual;
  valorPrazo: string;
  aoAlterarModalidade: (modalidade: ModalidadeComercialFornecedor) => void;
  aoAlterarEstrategiaPrazo: (estrategia: EstrategiaResolucaoVisual) => void;
  aoAlterarValorPrazo: (valor: string) => void;
}) {
  return (
    <section className="border-t border-blue-100 bg-blue-50/25 px-4 py-4 sm:px-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-950">
          Modalidade comercial
        </h3>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Defina como preço e prazo serão preparados nos rascunhos deste
          fornecedor.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:grid-cols-[1fr_1.2fr_1.4fr]">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-slate-600">
            Modalidade padrão dos produtos
          </span>
          <select
            value={modalidade}
            onChange={(evento) =>
              aoAlterarModalidade(
                evento.target.value as ModalidadeComercialFornecedor,
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            {OPCOES_MODALIDADE_COMERCIAL.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">
            Estratégia do prazo de entrega
          </p>
          <SelectEstrategiaVisual
            tipo="importante"
            valor={estrategiaPrazo}
            aoAlterar={aoAlterarEstrategiaPrazo}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">
            Prazo / Observação
          </p>
          {estrategiaPrazo === "valor_padrao" ? (
            <input
              value={valorPrazo}
              onChange={(evento) => aoAlterarValorPrazo(evento.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              placeholder="Ex: 3 a 5 dias úteis"
            />
          ) : (
            <ValorOuObservacaoVisual
              campo={{ valor: "prazo_entrega", label: "Prazo de entrega" }}
              estrategia={estrategiaPrazo}
              categoriasLoja={[]}
              marcasLoja={[]}
              valorPadrao=""
              aoAlterarValorPadrao={() => undefined}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function CampoValorPadraoVisual({
  campo,
  categoriasLoja,
  marcasLoja,
  valor,
  aoAlterar,
}: {
  campo: { valor: string; label: string };
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: OpcaoValorPadraoLoja[];
  valor: string;
  aoAlterar: (valor: string) => void;
}) {
  const botaoAtualizarOpcoes = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 justify-start gap-1.5 px-2 text-xs text-slate-500 hover:text-slate-900 sm:col-span-2"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Atualizar categorias e marcas
    </Button>
  );

  if (campo.valor === "categoria_fornecedor") {
    return (
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={valor}
          onChange={(evento) => aoAlterar(evento.target.value)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
        >
          <option value="">Selecionar categoria</option>
          {categoriasLoja.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
        <a
          href="/admin/categories"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Gerenciar categorias
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {botaoAtualizarOpcoes}
      </div>
    );
  }

  if (campo.valor === "marca_fornecedor") {
    return (
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={valor}
          onChange={(evento) => aoAlterar(evento.target.value)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
        >
          <option value="">Selecionar marca</option>
          {marcasLoja.map((marca) => (
            <option key={marca.id} value={marca.id}>
              {marca.nome}
            </option>
          ))}
        </select>
        <a
          href="/admin/marcas"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Gerenciar marcas
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {botaoAtualizarOpcoes}
      </div>
    );
  }

  if (
    campo.valor === "altura" ||
    campo.valor === "largura" ||
    campo.valor === "comprimento"
  ) {
    return (
      <input
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
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
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
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
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
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
      <input
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        type="number"
        min="0"
        step="0.01"
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
        placeholder="Ex: 99.90"
      />
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
      value={valor}
      onChange={(evento) => aoAlterar(evento.target.value)}
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
      placeholder={placeholders[campo.valor] ?? `Ex: ${campo.label}`}
    />
  );
}

function obterValorRegistroCombinacao(
  registro: RegistroCombinacaoCategoriaFornecedor,
  campo: string,
) {
  const valor = registro[campo];

  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  if (typeof valor === "string" && valor.trim()) return valor.trim();

  return "Sem valor";
}

function montarChaveCategoriaCombinacao(valores: string[]) {
  return valores.join(" / ");
}

function BlocoCategoriaCombinacaoCampos({
  registros,
  categoriasLoja,
  camposSelecionados,
  traducoes,
  aoAlterarCategoria,
}: {
  registros: RegistroCombinacaoCategoriaFornecedor[];
  categoriasLoja: OpcaoValorPadraoLoja[];
  camposSelecionados: string[];
  traducoes: Record<string, string>;
  aoAlterarCategoria: (chave: string, categoriaId: string) => void;
}) {
  const combinacaoValida = camposSelecionados.length >= 2;
  const combinacoes = useMemo(() => {
    const combinacoesPorChave = new Map<
      string,
      {
        chave: string;
        valores: string[];
        quantidade: number;
      }
    >();

    for (const registro of registros) {
      const valores = camposSelecionados.map((campo) =>
        obterValorRegistroCombinacao(registro, campo),
      );
      const chave = montarChaveCategoriaCombinacao(valores);
      const existente = combinacoesPorChave.get(chave);

      if (existente) {
        existente.quantidade += 1;
      } else {
        combinacoesPorChave.set(chave, {
          chave,
          valores,
          quantidade: 1,
        });
      }
    }

    return Array.from(combinacoesPorChave.values()).sort((a, b) =>
      a.chave.localeCompare(b.chave, "pt-BR"),
    );
  }, [camposSelecionados, registros]);

  return (
    <section className="border-t border-blue-100 bg-blue-50/25 px-4 py-4 sm:px-5">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-950">
          Categoria da loja
        </h3>
        <p className="max-w-3xl text-sm text-slate-600">
          Combine campos da API para formar uma chave de busca e escolha a
          categoria real da loja.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-blue-100 bg-white p-3 shadow-xs">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Campos usados para formar a categoria
        </p>
        {camposSelecionados.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Selecione “Combinar campos” em pelo menos dois campos da tabela
            principal para criar a chave de categoria.
          </p>
        ) : combinacaoValida ? (
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
              Combinação criada
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-950">
              {camposSelecionados.join(" + ")} → Categoria da loja
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Selecione pelo menos mais um campo para formar a combinação.
          </p>
        )}
      </div>

      {combinacaoValida ? (
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Tradução de categorias
              </h3>
              <p className="max-w-3xl text-sm text-slate-600">
                Cada combinação recebida da API deve apontar para uma categoria
                real da loja.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/admin/categories"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                Gerenciar categorias
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 justify-start gap-1.5 px-2 text-xs text-slate-500 hover:text-slate-900"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar categorias
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="hidden grid-cols-[1.1fr_1.4fr] border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase md:grid">
              <span>Valor recebido da API</span>
              <span>Categoria real da loja</span>
            </div>
            {combinacoes.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Nenhuma combinação encontrada nos produtos selecionados.
              </div>
            ) : (
              combinacoes.map((combinacao) => (
                <article
                  key={combinacao.chave}
                  className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[1.1fr_1.4fr] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">
                      {combinacao.chave}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {combinacao.quantidade} produto
                      {combinacao.quantidade === 1 ? "" : "s"} com essa
                      combinação
                    </p>
                  </div>
                  <select
                    value={traducoes[combinacao.chave] ?? ""}
                    onChange={(evento) =>
                      aoAlterarCategoria(combinacao.chave, evento.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">Selecionar categoria da loja</option>
                    {categoriasLoja.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </article>
              ))
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ValorOuObservacaoVisual({
  campo,
  estrategia,
  categoriasLoja,
  marcasLoja,
  valorPadrao,
  aoAlterarValorPadrao,
}: {
  campo: { valor: string; label: string };
  estrategia: EstrategiaResolucaoVisual;
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: OpcaoValorPadraoLoja[];
  valorPadrao: string;
  aoAlterarValorPadrao: (valor: string) => void;
}) {
  if (estrategia === "valor_padrao") {
    return (
      <CampoValorPadraoVisual
        campo={campo}
        categoriasLoja={categoriasLoja}
        marcasLoja={marcasLoja}
        valor={valorPadrao}
        aoAlterar={aoAlterarValorPadrao}
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
  estrategias,
  valoresPadrao,
  aoAlterarEstrategia,
  aoAlterarValorPadrao,
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
  estrategias: Record<string, EstrategiaResolucaoVisual>;
  valoresPadrao: Record<string, string>;
  aoAlterarEstrategia: (
    campo: string,
    estrategia: EstrategiaResolucaoVisual,
  ) => void;
  aoAlterarValorPadrao: (campo: string, valor: string) => void;
}) {
  const estrategiasIniciais = Object.fromEntries(
    campos.map((campo) => [
      campo.valor,
      obterEstrategiaInicial(campo.estrategiaPadrao, tipo),
    ]),
  ) as Record<string, EstrategiaResolucaoVisual>;
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
              <p className="mt-1 text-sm font-semibold break-words text-slate-950 lg:truncate">
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
                aoAlterar={(valor) => aoAlterarEstrategia(campo.valor, valor)}
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
                valorPadrao={valoresPadrao[campo.valor] ?? ""}
                aoAlterarValorPadrao={(valor) =>
                  aoAlterarValorPadrao(campo.valor, valor)
                }
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
  usadoNaCombinacaoCategoria,
  permitirCombinarCampos,
}: {
  linha: LinhaMapeamentoFornecedor;
  opcoesDestino: OpcaoMapeamentoFornecedor[];
  labelPrimeiraColuna: string;
  labelAmostra: string;
  valorDestino: string;
  aoAlterarDestino: (valor: string) => void;
  obrigatorio: boolean;
  usadoNaCombinacaoCategoria?: boolean;
  permitirCombinarCampos?: boolean;
}) {
  return (
    <div
      className={`w-full min-w-0 rounded-xl border p-3 shadow-xs ${
        linha.obrigatorioSemOrigem
          ? "border-amber-200 bg-amber-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            {labelPrimeiraColuna}
          </p>
          <p className="mt-1 text-sm font-semibold break-words text-slate-950">
            {linha.nomeOrigem}
          </p>
        </div>
      </div>
      <div className="mt-3 min-w-0 rounded-lg bg-slate-50 p-2">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {labelAmostra}
        </p>
        <p className="mt-1 text-sm break-words text-slate-800">
          {linha.amostra || "-"}
        </p>
      </div>
      <div className="mt-3 grid gap-3">
        {usadoNaCombinacaoCategoria ? (
          <div className="grid gap-2">
            <select
              value={VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA}
              disabled
              className="h-10 w-full min-w-0 rounded-lg border border-blue-100 bg-blue-50 px-3 text-sm font-medium text-blue-900 shadow-xs"
            >
              <option value={VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA}>
                Combinar campos
              </option>
            </select>
            <p className="text-xs font-medium text-blue-700">
              Usado na combinação
            </p>
          </div>
        ) : linha.obrigatorioSemOrigem ? (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2 text-sm font-medium text-slate-900">
            {obterLabelDestino(linha.campoDestino, opcoesDestino)}
          </div>
        ) : (
          <div>
            <SelectDestino
              linha={linha}
              opcoesDestino={opcoesDestino}
              valor={valorDestino}
              permitirCombinarCampos={permitirCombinarCampos}
              aoAlterar={aoAlterarDestino}
            />
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
  camposCombinacaoCategoria = [],
  registrosCombinacaoCategoria = [],
  camposCombinacaoCategoriaPadrao,
  action,
  camposOcultos = [],
  nomeCampoConfiguracaoFluxo,
  textoCheckbox = "Salvar este mapeamento como padrão deste fornecedor",
  mostrarCheckbox = true,
  configuracaoInicial = null,
  mostrarConfiguracaoComercial = false,
  textoAcaoPrincipal,
  tipoBotaoAcaoPrincipal = "submit",
  hrefAcaoPrincipal,
  aoAcionarPrincipal,
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
  const [estrategiasCamposSemOrigem, setEstrategiasCamposSemOrigem] = useState<
    Record<string, EstrategiaResolucaoVisual>
  >({});
  const [valoresPadraoCamposSemOrigem, setValoresPadraoCamposSemOrigem] =
    useState<Record<string, string>>({});
  const [categoriasPorCombinacao, setCategoriasPorCombinacao] = useState<
    Record<string, string>
  >({});
  const [modalidadeComercial, setModalidadeComercial] =
    useState<ModalidadeComercialFornecedor>("dropshipping");
  const [estrategiaPrazoEntrega, setEstrategiaPrazoEntrega] =
    useState<EstrategiaResolucaoVisual>("conciliacao");
  const [valorPrazoEntrega, setValorPrazoEntrega] = useState("");
  const [salvarComoPadrao, setSalvarComoPadrao] = useState(false);
  // `useActionState` é o que devolve a falha para dentro da tela. Sem ele, um erro
  // na Server Action estouraria até a error boundary da rota e levaria junto o
  // mapeamento que o gestor acabou de montar. Hooks não podem ser condicionais,
  // então o fluxo sem `action` (Laquila) recebe uma função estável e inofensiva —
  // o `<form>` dele continua sem `action`, exatamente como antes.
  const [estadoEnvio, enviarMapeamento] = useActionState(
    action ?? acaoMapeamentoIndisponivel,
    null,
  );

  useEffect(() => {
    const proximosDestinos = { ...destinosIniciais };

    if (configuracaoInicial?.destinosSelecionados) {
      Object.assign(proximosDestinos, configuracaoInicial.destinosSelecionados);
    }

    if (configuracaoInicial?.categoriaCombinacao) {
      for (const campo of configuracaoInicial.categoriaCombinacao.camposApi) {
        proximosDestinos[campo] = VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA;
      }

      setCategoriasPorCombinacao(
        Object.fromEntries(
          configuracaoInicial.categoriaCombinacao.traducoes
            .filter((traducao) => Boolean(traducao.categoriaId))
            .map((traducao) => [traducao.chave, traducao.categoriaId ?? ""]),
        ),
      );
    } else if (
      tipoOrigem === "api" &&
      camposCombinacaoCategoria.length > 0 &&
      camposCombinacaoCategoriaPadrao
    ) {
      proximosDestinos[camposCombinacaoCategoriaPadrao.campoApi1] =
        VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA;
      proximosDestinos[camposCombinacaoCategoriaPadrao.campoApi2] =
        VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA;
    }

    setDestinosSelecionados(proximosDestinos);

    if (configuracaoInicial?.regras) {
      setEstrategiasCamposSemOrigem(
        Object.fromEntries(
          configuracaoInicial.regras.map((regra) => [
            regra.campoDestino,
            regra.estrategia === "valor_padrao_todos"
              ? "valor_padrao"
              : regra.estrategia,
          ]),
        ) as Record<string, EstrategiaResolucaoVisual>,
      );
      setValoresPadraoCamposSemOrigem(
        Object.fromEntries(
          configuracaoInicial.regras
            .map((regra) => [
              regra.campoDestino,
              regra.valorPadraoId ?? regra.valorPadraoTexto ?? "",
            ])
            .filter(([, valor]) => String(valor).length > 0),
        ),
      );
    }

    if (configuracaoInicial?.configuracaoComercial) {
      const configuracao = configuracaoInicial.configuracaoComercial;
      setModalidadeComercial(configuracao.modalidade);
      setEstrategiaPrazoEntrega(
        configuracao.prazoEntrega.estrategia === "valor_padrao_todos"
          ? "valor_padrao"
          : configuracao.prazoEntrega.estrategia,
      );
      setValorPrazoEntrega(configuracao.prazoEntrega.valorPadraoTexto ?? "");
    }
  }, [
    camposCombinacaoCategoria.length,
    camposCombinacaoCategoriaPadrao,
    configuracaoInicial,
    destinosIniciais,
    tipoOrigem,
  ]);

  const camposUsadosCombinacaoCategoria = useMemo(
    () =>
      new Set(
        Object.entries(destinosSelecionados)
          .filter(
            ([, destino]) =>
              destino === VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA,
          )
          .map(([campo]) => campo),
      ),
    [destinosSelecionados],
  );
  const camposSelecionadosCombinacaoCategoria = useMemo(
    () => Array.from(camposUsadosCombinacaoCategoria),
    [camposUsadosCombinacaoCategoria],
  );
  const categoriaCombinacaoValida =
    camposSelecionadosCombinacaoCategoria.length >= 2;

  const destinosEfetivos = useMemo(
    () =>
      categoriaCombinacaoValida
        ? {
            ...destinosSelecionados,
            __categoria_combinada: "categoria_fornecedor",
          }
        : destinosSelecionados,
    [categoriaCombinacaoValida, destinosSelecionados],
  );
  const linhasMapeadas =
    linhas.filter(
      (linha) =>
        !linha.obrigatorioSemOrigem &&
        destinosSelecionados[linha.id] &&
        !camposUsadosCombinacaoCategoria.has(linha.id),
    ).length + (categoriaCombinacaoValida ? 1 : 0);
  const camposObrigatoriosSemOrigem = camposObrigatoriosNormalizados.filter(
    (campo) => !Object.values(destinosEfetivos).includes(campo.valor),
  );
  const camposImportantesSemOrigem = camposImportantesNormalizados.filter(
    (campo) =>
      (!mostrarConfiguracaoComercial || campo.valor !== "prazo_entrega") &&
      !Object.values(destinosEfetivos).includes(campo.valor),
  );
  const obrigatoriosSemOrigem = camposObrigatoriosSemOrigem.length;
  const importantesSemOrigem = camposImportantesSemOrigem.length;
  const categoriaMapeada = Object.values(destinosEfetivos).includes(
    "categoria_fornecedor",
  );
  const obrigatoriosOk =
    linhas.filter((linha) => {
      const destino = linha.obrigatorioSemOrigem
        ? linha.campoDestino
        : destinosSelecionados[linha.id];

      return Boolean(
        destino &&
          camposObrigatoriosSet.has(destino) &&
          !linha.obrigatorioSemOrigem,
      );
    }).length + (categoriaCombinacaoValida ? 1 : 0);
  const conflitos = linhas.filter(
    (linha) => linha.situacao === "conflito",
  ).length;
  const todosCamposSemOrigem = [
    ...camposObrigatoriosSemOrigem.map((campo) => ({
      ...campo,
      tipo: "obrigatorio" as const,
    })),
    ...camposImportantesSemOrigem.map((campo) => ({
      ...campo,
      tipo: "importante" as const,
    })),
  ];

  function obterEstrategiaCampoSemOrigem(
    campo: {
      valor: string;
      estrategiaPadrao?: string;
    },
    tipo: "obrigatorio" | "importante",
  ) {
    return (
      estrategiasCamposSemOrigem[campo.valor] ??
      obterEstrategiaInicial(campo.estrategiaPadrao, tipo)
    );
  }

  function obterLabelValorPadrao(campoValor: string, valor: string) {
    if (!valor) return undefined;

    if (campoValor === "categoria_fornecedor") {
      return categoriasLoja.find((categoria) => categoria.id === valor)?.nome;
    }

    if (campoValor === "marca_fornecedor") {
      return marcasLoja.find((marca) => marca.id === valor)?.nome;
    }

    return valor;
  }

  function montarDadosTemporariosMapeamento(): DadosTemporariosMapeamentoFornecedor {
    const categoriaCombinacao =
      categoriaMapeada && categoriaCombinacaoValida
        ? montarRegraCategoriaCombinacao()
        : undefined;

    return {
      destinosSelecionados: categoriaCombinacaoValida
        ? Object.fromEntries(
            Object.entries(destinosSelecionados).filter(
              ([campo, destino]) =>
                destino !== "categoria_fornecedor" &&
                destino !== VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA &&
                !camposUsadosCombinacaoCategoria.has(campo),
            ),
          )
        : destinosSelecionados,
      regras: todosCamposSemOrigem.map((campo) => {
        const estrategia = obterEstrategiaCampoSemOrigem(campo, campo.tipo);
        const valorPadrao = valoresPadraoCamposSemOrigem[campo.valor] ?? "";
        const valorPadraoLabel = obterLabelValorPadrao(
          campo.valor,
          valorPadrao,
        );
        const usaValorPadrao = estrategia === "valor_padrao";
        const usaValorPadraoComId =
          campo.valor === "categoria_fornecedor" ||
          campo.valor === "marca_fornecedor";

        return {
          campoDestino: campo.valor,
          campoLabel: campo.label,
          tipo: campo.tipo,
          estrategia: usaValorPadrao
            ? ("valor_padrao_todos" as const)
            : estrategia,
          valorPadraoId:
            usaValorPadrao && usaValorPadraoComId && valorPadrao
              ? valorPadrao
              : undefined,
          valorPadraoLabel: usaValorPadrao ? valorPadraoLabel : undefined,
          valorPadraoTexto:
            usaValorPadrao && !usaValorPadraoComId && valorPadrao
              ? valorPadrao
              : undefined,
        };
      }),
      categoriaCombinacao,
      configuracaoComercial: {
        modalidade: modalidadeComercial,
        prazoEntrega: {
          estrategia:
            estrategiaPrazoEntrega === "valor_padrao"
              ? "valor_padrao_todos"
              : (estrategiaPrazoEntrega as EstrategiaPrazoEntregaFornecedor),
          valorPadraoTexto:
            estrategiaPrazoEntrega === "valor_padrao" && valorPrazoEntrega
              ? valorPrazoEntrega.trim()
              : undefined,
        },
      },
    };
  }

  function montarRegraCategoriaCombinacao():
    | RegraCategoriaCombinacaoFornecedor
    | undefined {
    const combinacoesPorChave = new Map<
      string,
      {
        chave: string;
        valores: string[];
        quantidade: number;
      }
    >();

    for (const registro of registrosCombinacaoCategoria) {
      const valores = camposSelecionadosCombinacaoCategoria.map((campo) =>
        obterValorRegistroCombinacao(registro, campo),
      );
      const chave = montarChaveCategoriaCombinacao(valores);
      const existente = combinacoesPorChave.get(chave);

      if (existente) {
        existente.quantidade += 1;
      } else {
        combinacoesPorChave.set(chave, {
          chave,
          valores,
          quantidade: 1,
        });
      }
    }

    return {
      estrategia: "combinacao_campos_api",
      camposApi: camposSelecionadosCombinacaoCategoria,
      campoApi1: camposSelecionadosCombinacaoCategoria[0] ?? "",
      campoApi2: camposSelecionadosCombinacaoCategoria[1] ?? "",
      traducoes: Array.from(combinacoesPorChave.values()).map((combinacao) => {
        const categoriaId = categoriasPorCombinacao[combinacao.chave];
        const categoriaLabel = categoriaId
          ? categoriasLoja.find((categoria) => categoria.id === categoriaId)
              ?.nome
          : undefined;

        return {
          ...combinacao,
          categoriaId: categoriaId || undefined,
          categoriaLabel,
        };
      }),
    };
  }

  async function acionarPrincipal() {
    await aoAcionarPrincipal?.(montarDadosTemporariosMapeamento(), {
      salvarComoPadrao,
    });

    if (hrefAcaoPrincipal) {
      window.location.href = hrefAcaoPrincipal;
    }
  }

  function alterarDestinoLinha(campo: string, destino: string) {
    setDestinosSelecionados((atuais) => {
      const proximos = { ...atuais };

      if (destino === VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA) {
        Object.entries(proximos).forEach(([campoAtual, destinoAtual]) => {
          if (destinoAtual === "categoria_fornecedor" && campoAtual !== campo) {
            proximos[campoAtual] = "";
          }
        });
      }

      if (destino === "categoria_fornecedor") {
        Object.entries(proximos).forEach(([campoAtual, destinoAtual]) => {
          if (
            destinoAtual === VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA &&
            campoAtual !== campo
          ) {
            proximos[campoAtual] = "";
          }
        });
      }

      proximos[campo] = destino;

      return proximos;
    });
  }

  return (
    <form
      action={action ? enviarMapeamento : undefined}
      className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      {camposOcultos.map((campo) => (
        <input
          key={campo.nome}
          type="hidden"
          name={campo.nome}
          value={campo.valor}
        />
      ))}
      {nomeCampoConfiguracaoFluxo ? (
        <input
          type="hidden"
          name={nomeCampoConfiguracaoFluxo}
          value={JSON.stringify(montarDadosTemporariosMapeamento())}
        />
      ) : null}
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
            value={
              destinosSelecionados[linha.id] ===
              VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA
                ? ""
                : (destinosSelecionados[linha.id] ?? "")
            }
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
                    Confiança
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linhas.map((linha) => {
                  const valorDestino = linha.obrigatorioSemOrigem
                    ? (linha.campoDestino ?? "")
                    : (destinosSelecionados[linha.id] ?? "");
                  const usadoNaCombinacaoCategoria =
                    camposUsadosCombinacaoCategoria.has(linha.id);
                  const obrigatorio = Boolean(
                    valorDestino && camposObrigatoriosSet.has(valorDestino),
                  );

                  return (
                    <tr
                      key={linha.id}
                      className={
                        usadoNaCombinacaoCategoria
                          ? "bg-blue-50/35 opacity-75 hover:bg-blue-50/50"
                          : linha.obrigatorioSemOrigem
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
                        {usadoNaCombinacaoCategoria ? (
                          <div className="grid gap-2">
                            <select
                              value={VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA}
                              disabled
                              className="h-10 w-full rounded-lg border border-blue-100 bg-blue-50 px-3 text-sm font-medium text-blue-900 shadow-xs"
                            >
                              <option
                                value={VALOR_DESTINO_COMBINAR_CAMPOS_CATEGORIA}
                              >
                                Combinar campos
                              </option>
                            </select>
                            <p className="text-xs font-medium text-blue-700">
                              Usado na combinação
                            </p>
                          </div>
                        ) : linha.obrigatorioSemOrigem ? (
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
                              permitirCombinarCampos={
                                tipoOrigem === "api" &&
                                camposCombinacaoCategoria.some(
                                  (campo) => campo.valor === linha.id,
                                )
                              }
                              aoAlterar={(valor) =>
                                alterarDestinoLinha(linha.id, valor)
                              }
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <BadgeObrigatorio obrigatorio={obrigatorio} />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {usadoNaCombinacaoCategoria ? (
                          <p className="text-sm font-medium text-blue-700">
                            Combinado
                          </p>
                        ) : (
                          <StatusLinhaMapeamento linha={linha} />
                        )}
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
                  alterarDestinoLinha(linha.id, valor)
                }
                usadoNaCombinacaoCategoria={camposUsadosCombinacaoCategoria.has(
                  linha.id,
                )}
                permitirCombinarCampos={
                  tipoOrigem === "api" &&
                  camposCombinacaoCategoria.some(
                    (campo) => campo.valor === linha.id,
                  )
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

      {tipoOrigem === "api" && camposCombinacaoCategoria.length > 0 ? (
        <BlocoCategoriaCombinacaoCampos
          registros={registrosCombinacaoCategoria}
          categoriasLoja={categoriasLoja}
          camposSelecionados={camposSelecionadosCombinacaoCategoria}
          traducoes={categoriasPorCombinacao}
          aoAlterarCategoria={(chave, categoriaId) =>
            setCategoriasPorCombinacao((atuais) => ({
              ...atuais,
              [chave]: categoriaId,
            }))
          }
        />
      ) : null}

      {mostrarConfiguracaoComercial ? (
        <SecaoModalidadeComercial
          modalidade={modalidadeComercial}
          estrategiaPrazo={estrategiaPrazoEntrega}
          valorPrazo={valorPrazoEntrega}
          aoAlterarModalidade={setModalidadeComercial}
          aoAlterarEstrategiaPrazo={setEstrategiaPrazoEntrega}
          aoAlterarValorPrazo={setValorPrazoEntrega}
        />
      ) : null}

      <SecaoCamposSemOrigem
        titulo="Campos obrigatórios sem origem"
        descricao="Esses campos são necessários para publicar produtos simples. Defina uma estratégia ou eles serão resolvidos na Conciliação."
        tipoOrigem={tipoOrigem}
        campos={camposObrigatoriosSemOrigem}
        tipo="obrigatorio"
        categoriasLoja={categoriasLoja}
        marcasLoja={marcasLoja}
        estrategias={estrategiasCamposSemOrigem}
        valoresPadrao={valoresPadraoCamposSemOrigem}
        aoAlterarEstrategia={(campo, estrategia) =>
          setEstrategiasCamposSemOrigem((atuais) => ({
            ...atuais,
            [campo]: estrategia,
          }))
        }
        aoAlterarValorPadrao={(campo, valor) =>
          setValoresPadraoCamposSemOrigem((atuais) => ({
            ...atuais,
            [campo]: valor,
          }))
        }
      />

      <SecaoCamposSemOrigem
        titulo="Campos importantes sem origem"
        descricao="Esses campos não bloqueiam a publicação, mas podem gerar alertas ou exigir revisão."
        tipoOrigem={tipoOrigem}
        campos={camposImportantesSemOrigem}
        tipo="importante"
        categoriasLoja={categoriasLoja}
        marcasLoja={marcasLoja}
        estrategias={estrategiasCamposSemOrigem}
        valoresPadrao={valoresPadraoCamposSemOrigem}
        aoAlterarEstrategia={(campo, estrategia) =>
          setEstrategiasCamposSemOrigem((atuais) => ({
            ...atuais,
            [campo]: estrategia,
          }))
        }
        aoAlterarValorPadrao={(campo, valor) =>
          setValoresPadraoCamposSemOrigem((atuais) => ({
            ...atuais,
            [campo]: valor,
          }))
        }
      />

      <div className="grid gap-4 border-t border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-1.5">
          {mostrarCheckbox ? (
            <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                name="salvarParaFornecedor"
                value="true"
                checked={salvarComoPadrao}
                onChange={(evento) =>
                  setSalvarComoPadrao(evento.target.checked)
                }
                className="mt-0.5 size-5 rounded border-slate-400 bg-white accent-slate-950 shadow-sm outline-none hover:border-slate-600 focus-visible:ring-3 focus-visible:ring-slate-400/40 md:size-4"
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
        {aoAcionarPrincipal ? (
          <Button
            type="button"
            className="h-10 w-full min-w-0 gap-2 sm:w-auto sm:min-w-[210px]"
            onClick={acionarPrincipal}
          >
            {textoAcaoPrincipal}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : hrefAcaoPrincipal ? (
          <Button
            asChild
            className="h-10 w-full min-w-0 gap-2 sm:w-auto sm:min-w-[210px]"
          >
            <a href={hrefAcaoPrincipal}>
              {textoAcaoPrincipal}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        ) : tipoBotaoAcaoPrincipal === "submit" ? (
          // Caminho do fluxo por arquivo ("Continuar para vínculos"): o clique dispara a
          // Server Action que aplica o mapeamento e só então redireciona para a Vinculação.
          // Como isso leva alguns segundos, o botão precisa mostrar progresso e recusar
          // cliques repetidos — senão o mapeamento é aplicado duas vezes.
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <BotaoSubmitComEstado
              className="h-10 w-full min-w-0 gap-2 sm:w-auto sm:min-w-[210px]"
              textoProcessando="Aplicando mapeamento…"
            >
              {textoAcaoPrincipal}
              <ArrowRight className="h-4 w-4" />
            </BotaoSubmitComEstado>
            {estadoEnvio?.erro ? (
              <p
                role="alert"
                className="flex items-start gap-1.5 text-xs font-medium text-red-700 sm:max-w-[280px] sm:text-right"
              >
                <AlertCircle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{estadoEnvio.erro}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <Button
            type={tipoBotaoAcaoPrincipal}
            className="h-10 w-full min-w-0 gap-2 sm:w-auto sm:min-w-[210px]"
          >
            {textoAcaoPrincipal}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
