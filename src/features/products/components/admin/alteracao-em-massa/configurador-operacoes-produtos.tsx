"use client";

import {
  Boxes,
  CircleDollarSign,
  Info,
  PackageCheck,
  Ruler,
  Tag,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { MODALIDADES_PRECO_PRODUTO } from "../../../constants/modalidades-preco";
import {
  operacaoAlteracaoEmMassaSchema,
  type OperacaoAlteracaoEmMassa,
} from "../../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type {
  CategoriaAlteracaoEmMassa,
  DadosAlteracaoEmMassa,
  ProdutoAlteracaoEmMassa,
} from "../../../types/alteracao-em-massa.types";

type CampoEditor =
  | "status"
  | "categoria"
  | "marca"
  | "preco"
  | "prazo"
  | "estoque"
  | "ncm"
  | "peso"
  | "altura"
  | "largura"
  | "comprimento";

type GrupoEditor = "dados" | "precos" | "estoque" | "fiscal" | "medidas";

function resumirMedidaAtual(
  produtos: ProdutoAlteracaoEmMassa[],
  campo: "peso" | "altura" | "largura" | "comprimento",
  unidade: string,
) {
  const chave =
    campo === "peso"
      ? "pesoEmGramas"
      : campo === "altura"
        ? "alturaEmCm"
        : campo === "largura"
          ? "larguraEmCm"
          : "comprimentoEmCm";
  const valores = [
    ...new Set(
      produtos.map((produto) => {
        const valor = produto[chave];
        if (valor === null) return "Não cadastrado";
        return campo === "peso"
          ? `${(valor / 1000).toLocaleString("pt-BR")} ${unidade}`
          : `${valor.toLocaleString("pt-BR")} ${unidade}`;
      }),
    ),
  ];
  return valores.length === 1 ? valores[0] : "Valores diferentes";
}

const GRUPOS: Array<{
  id: GrupoEditor;
  rotulo: string;
  descricao: string;
  campos: CampoEditor[];
  icone: typeof Tag;
}> = [
  {
    id: "dados",
    rotulo: "Dados comerciais",
    descricao: "Status, categoria e marca",
    campos: ["status", "categoria", "marca"],
    icone: Tag,
  },
  {
    id: "precos",
    rotulo: "Preços e modalidades",
    descricao: "Modalidade, preço e prazo",
    campos: ["preco", "prazo"],
    icone: CircleDollarSign,
  },
  {
    id: "estoque",
    rotulo: "Estoque",
    descricao: "Quantidade disponível",
    campos: ["estoque"],
    icone: Boxes,
  },
  {
    id: "fiscal",
    rotulo: "Fiscal",
    descricao: "Classificação fiscal",
    campos: ["ncm"],
    icone: PackageCheck,
  },
  {
    id: "medidas",
    rotulo: "Medidas e logística",
    descricao: "Peso e dimensões",
    campos: ["peso", "altura", "largura", "comprimento"],
    icone: Ruler,
  },
];

function ordenarCategorias(
  categorias: CategoriaAlteracaoEmMassa[],
  parentId: string | null = null,
  nivel = 0,
): Array<CategoriaAlteracaoEmMassa & { nivelVisual: number }> {
  return categorias
    .filter((item) => item.parentId === parentId)
    .toSorted(
      (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"),
    )
    .flatMap((item) => [
      { ...item, nivelVisual: nivel },
      ...ordenarCategorias(categorias, item.id, nivel + 1),
    ]);
}

type Props = {
  dados: DadosAlteracaoEmMassa;
  produtosSelecionados: ProdutoAlteracaoEmMassa[];
  onOperacoesChange: (operacoes: OperacaoAlteracaoEmMassa[]) => void;
  onCamposAtivosChange: (quantidade: number) => void;
};

export function ConfiguradorOperacoesProdutos({
  dados,
  produtosSelecionados,
  onOperacoesChange,
  onCamposAtivosChange,
}: Props) {
  const [grupoAtivo, setGrupoAtivo] = useState<GrupoEditor>("dados");
  const [medidasAbertas, setMedidasAbertas] = useState(false);
  const [campos, setCampos] = useState<Set<CampoEditor>>(new Set());
  const [valores, setValores] = useState<Record<string, string>>({
    status: "true",
    preco_operacao: "definir",
    prazo_modalidade: "stock",
    estoque_operacao: "definir",
    peso_operacao: "definir",
    altura_operacao: "definir",
    largura_operacao: "definir",
    comprimento_operacao: "definir",
  });

  const operacoes = useMemo(() => {
    const numeroDigitado = (valor?: string) =>
      valor?.trim() ? Number(valor) : Number.NaN;
    const candidatas: unknown[] = [];
    if (campos.has("status"))
      candidatas.push({ campo: "status", valor: valores.status === "true" });
    if (campos.has("categoria"))
      candidatas.push({ campo: "categoria", categoriaId: valores.categoria });
    if (campos.has("marca"))
      candidatas.push({ campo: "marca", marcaId: valores.marca });
    if (campos.has("preco"))
      candidatas.push({
        campo: "preco",
        escopo: "todas_modalidades_com_preco",
        operacao: valores.preco_operacao,
        valor: numeroDigitado(valores.preco_valor),
      });
    if (campos.has("prazo"))
      candidatas.push({
        campo: "prazo",
        modalidade: valores.prazo_modalidade,
        valor: valores.prazo_valor,
      });
    if (campos.has("estoque"))
      candidatas.push({
        campo: "estoque",
        operacao: valores.estoque_operacao,
        valor: numeroDigitado(valores.estoque_valor),
      });
    if (campos.has("ncm"))
      candidatas.push({ campo: "ncm", valor: valores.ncm });
    (["peso", "altura", "largura", "comprimento"] as const).forEach((campo) => {
      if (medidasAbertas && campos.has(campo))
        candidatas.push({
          campo,
          operacao: valores[`${campo}_operacao`],
          valor:
            valores[`${campo}_operacao`] === "limpar"
              ? 0
              : numeroDigitado(valores[`${campo}_valor`]),
        });
    });
    return candidatas.flatMap((item) => {
      const resultado = operacaoAlteracaoEmMassaSchema.safeParse(item);
      return resultado.success ? [resultado.data] : [];
    });
  }, [campos, medidasAbertas, valores]);

  useEffect(() => onOperacoesChange(operacoes), [onOperacoesChange, operacoes]);
  useEffect(
    () => onCamposAtivosChange(operacoes.length),
    [onCamposAtivosChange, operacoes.length],
  );

  function alternarCampo(campo: CampoEditor) {
    setCampos((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(campo)) {
        proximos.delete(campo);
        if (campo === "preco") proximos.delete("prazo");
      } else {
        proximos.add(campo);
      }
      return proximos;
    });
  }

  function definir(chave: string, valor: string) {
    setValores((atuais) => ({ ...atuais, [chave]: valor }));
  }

  function definirMedida(
    campo: "peso" | "altura" | "largura" | "comprimento",
    valor: string,
  ) {
    definir(`${campo}_valor`, valor);
    setCampos((atuais) => {
      const proximos = new Set(atuais);
      if (valor.trim()) proximos.add(campo);
      else if (valores[`${campo}_operacao`] !== "limpar")
        proximos.delete(campo);
      return proximos;
    });
  }

  function definirOperacaoMedida(
    campo: "peso" | "altura" | "largura" | "comprimento",
    operacao: string,
  ) {
    definir(`${campo}_operacao`, operacao);
    setCampos((atuais) => {
      const proximos = new Set(atuais);
      if (operacao === "limpar" || valores[`${campo}_valor`]?.trim()) {
        proximos.add(campo);
      } else {
        proximos.delete(campo);
      }
      return proximos;
    });
  }

  function removerTodasMedidas() {
    setCampos((atuais) => {
      const proximos = new Set(atuais);
      (["peso", "altura", "largura", "comprimento"] as const).forEach((campo) =>
        proximos.delete(campo),
      );
      return proximos;
    });
    setValores((atuais) => ({
      ...atuais,
      peso_operacao: "definir",
      altura_operacao: "definir",
      largura_operacao: "definir",
      comprimento_operacao: "definir",
      peso_valor: "",
      altura_valor: "",
      largura_valor: "",
      comprimento_valor: "",
    }));
    setMedidasAbertas(false);
  }

  const categorias = ordenarCategorias(
    dados.categorias.filter((item) => item.ativa),
  );
  const grupo = GRUPOS.find((item) => item.id === grupoAtivo) ?? GRUPOS[0];
  const quantidadeGrupo = (item: (typeof GRUPOS)[number]) => {
    if (item.id === "medidas" && !medidasAbertas) return 0;
    return item.campos.filter((campo) => campos.has(campo)).length;
  };
  const valorAtual = (obter: (produto: ProdutoAlteracaoEmMassa) => string) => {
    const valoresAtuais = [...new Set(produtosSelecionados.map(obter))];
    return valoresAtuais.length === 1 ? valoresAtuais[0] : "Valores diferentes";
  };
  const precoAtual = valorAtual((produto) => {
    const quantidade = produto.precosModalidades.filter(
      (preco) =>
        Number.isSafeInteger(preco.precoEmCentavos) &&
        preco.precoEmCentavos >= 0,
    ).length;
    return quantidade
      ? `${quantidade} modalidade(s) com preço`
      : "Nenhuma modalidade com preço";
  });
  const prazoAtual = valorAtual(
    (produto) =>
      produto.precosModalidades.find(
        (item) => item.modalidade === valores.prazo_modalidade,
      )?.prazo ?? "Não cadastrado",
  );
  const operacaoPreco = operacoes.find((item) => item.campo === "preco");
  const operacaoPrazo = operacoes.find((item) => item.campo === "prazo");

  return (
    <div className="grid min-h-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav
        aria-label="Grupos de alterações"
        className="lg:sticky lg:top-0 lg:self-start"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {GRUPOS.map((item) => {
            const Icone = item.icone;
            const quantidade = quantidadeGrupo(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setGrupoAtivo(item.id)}
                aria-current={grupoAtivo === item.id ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring flex min-w-52 items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none lg:min-w-0",
                  grupoAtivo === item.id
                    ? "border-blue-300 bg-blue-50 text-blue-950"
                    : "bg-card hover:bg-accent",
                )}
              >
                <Icone className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {item.rotulo}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {item.descricao}
                  </span>
                </span>
                {quantidade > 0 && (
                  <Badge variant="secondary">{quantidade}</Badge>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <section
        className="min-w-0 space-y-4"
        aria-labelledby={`grupo-${grupo.id}`}
      >
        <div>
          <h2 id={`grupo-${grupo.id}`} className="text-lg font-semibold">
            {grupo.rotulo}
          </h2>
          <p className="text-muted-foreground text-sm">{grupo.descricao}</p>
        </div>

        {grupoAtivo === "dados" && (
          <div className="space-y-3">
            <CampoConfiguravel
              campo="status"
              rotulo="Status"
              dica="Ativa ou desativa os produtos simples selecionados."
              ativo={campos.has("status")}
              onAlternar={alternarCampo}
              valorAtual={valorAtual((produto) =>
                produto.ativo ? "Ativo" : "Inativo",
              )}
            >
              <Select
                value={valores.status}
                onValueChange={(valor) => definir("status", valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativar</SelectItem>
                  <SelectItem value="false">Desativar</SelectItem>
                </SelectContent>
              </Select>
            </CampoConfiguravel>
            <CampoConfiguravel
              campo="categoria"
              rotulo="Categoria"
              dica="Define uma categoria real mantendo a estrutura hierárquica."
              ativo={campos.has("categoria")}
              onAlternar={alternarCampo}
              valido={operacoes.some((item) => item.campo === "categoria")}
              valorAtual={valorAtual((produto) => produto.categoriaNome)}
            >
              <Select
                value={valores.categoria}
                onValueChange={(valor) => definir("categoria", valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                    >{`${"— ".repeat(item.nivelVisual)}${item.nome}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CampoConfiguravel>
            <CampoConfiguravel
              campo="marca"
              rotulo="Marca"
              dica="Define uma marca ativa do catálogo."
              ativo={campos.has("marca")}
              onAlternar={alternarCampo}
              valido={operacoes.some((item) => item.campo === "marca")}
              valorAtual={valorAtual((produto) => produto.marcaNome)}
            >
              <Select
                value={valores.marca}
                onValueChange={(valor) => definir("marca", valor)}
                disabled={Boolean(dados.avisos?.marcas)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma marca" />
                </SelectTrigger>
                <SelectContent>
                  {dados.marcas
                    .filter((item) => item.ativa)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {dados.avisos?.marcas ? (
                <p className="text-xs text-amber-700" role="status">
                  {dados.avisos.marcas}
                </p>
              ) : null}
            </CampoConfiguravel>
          </div>
        )}

        {grupoAtivo === "precos" && (
          <CampoConfiguravel
            campo="preco"
            rotulo="Preço em todas as modalidades"
            dica="Aplica a operação a cada modalidade com preço já cadastrada. Não cria modalidades e preserva promoções e prazos."
            ativo={campos.has("preco")}
            onAlternar={alternarCampo}
            valido={Boolean(operacaoPreco || operacaoPrazo)}
            valorAtual={precoAtual}
          >
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
              <strong>Aplicar a todas as modalidades com preço</strong>
              <p className="mt-1 text-xs text-blue-800">
                Somente registros já existentes serão alterados. Modalidades
                ausentes, promoções e prazos permanecem intactos.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Controle rotulo="Operação">
                <Select
                  value={valores.preco_operacao}
                  onValueChange={(valor) => definir("preco_operacao", valor)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="definir">Definir valor</SelectItem>
                    <SelectItem value="aumentar_valor">Aumentar R$</SelectItem>
                    <SelectItem value="reduzir_valor">Reduzir R$</SelectItem>
                    <SelectItem value="aumentar_percentual">
                      Aumentar %
                    </SelectItem>
                    <SelectItem value="reduzir_percentual">
                      Reduzir %
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Controle>
              <Controle rotulo="Valor">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valores.preco_valor ?? ""}
                  onChange={(evento) =>
                    definir("preco_valor", evento.target.value)
                  }
                  placeholder={
                    valores.preco_operacao?.includes("percentual") ? "%" : "R$"
                  }
                />
              </Controle>
            </div>
            <div className="mt-4 rounded-lg border bg-slate-50/70 p-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={campos.has("prazo")}
                  onCheckedChange={() => alternarCampo("prazo")}
                />
                <span>
                  <span className="block text-sm font-medium">
                    Alterar também o prazo
                  </span>
                  <span className="text-muted-foreground text-xs">
                    O prazo continua opcional e usa somente a modalidade
                    escolhida abaixo.
                  </span>
                  <span className="mt-1 block text-xs">
                    Atual: <strong>{prazoAtual}</strong>
                  </span>
                </span>
              </label>
              {campos.has("prazo") && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Controle rotulo="Modalidade do prazo">
                    <SelecaoModalidade
                      valor={valores.prazo_modalidade}
                      onChange={(valor) => definir("prazo_modalidade", valor)}
                    />
                  </Controle>
                  <Controle rotulo="Novo prazo">
                    <Input
                      id="prazo-modalidade"
                      value={valores.prazo_valor ?? ""}
                      onChange={(evento) =>
                        definir("prazo_valor", evento.target.value)
                      }
                      placeholder="Ex: 2-3 dias p/ entrega"
                    />
                  </Controle>
                </div>
              )}
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Resumo: todas as modalidades com preço{" "}
              {operacaoPreco
                ? `· ${operacaoPreco.operacao.replaceAll("_", " ")} · ${operacaoPreco.valor}`
                : "· Preço inalterado"}
              {operacaoPrazo
                ? ` · Prazo (${MODALIDADES_PRECO_PRODUTO.find((item) => item.id === operacaoPrazo.modalidade)?.rotulo}): ${operacaoPrazo.valor}`
                : ""}
            </p>
          </CampoConfiguravel>
        )}

        {grupoAtivo === "estoque" && (
          <CampoConfiguravel
            campo="estoque"
            rotulo="Quantidade em estoque"
            dica="Usa somente a variante técnica do produto simples."
            ativo={campos.has("estoque")}
            onAlternar={alternarCampo}
            valido={operacoes.some((item) => item.campo === "estoque")}
            valorAtual={valorAtual((produto) =>
              produto.estoqueVarianteTecnica === null
                ? "Não cadastrado"
                : `${produto.estoqueVarianteTecnica} unidade(s)`,
            )}
          >
            <OperacaoNumero
              prefixo="estoque"
              valores={valores}
              definir={definir}
              unidade="unidades"
            />
          </CampoConfiguravel>
        )}

        {grupoAtivo === "fiscal" && (
          <CampoConfiguravel
            campo="ncm"
            rotulo="NCM"
            dica="Aceita oito dígitos, com ou sem pontos."
            ativo={campos.has("ncm")}
            onAlternar={alternarCampo}
            valido={operacoes.some((item) => item.campo === "ncm")}
            valorAtual={valorAtual(
              (produto) => produto.ncm ?? "Não cadastrado",
            )}
          >
            <Controle rotulo="Novo NCM">
              <Input
                value={valores.ncm ?? ""}
                onChange={(evento) => definir("ncm", evento.target.value)}
                placeholder="8517.12.00"
                inputMode="numeric"
              />
            </Controle>
          </CampoConfiguravel>
        )}

        {grupoAtivo === "medidas" && (
          <BlocoMedidas
            aberto={medidasAbertas}
            onAbertoChange={setMedidasAbertas}
            campos={campos}
            valores={valores}
            definirMedida={definirMedida}
            definirOperacao={definirOperacaoMedida}
            onRemover={removerTodasMedidas}
            produtosSelecionados={produtosSelecionados}
          />
        )}
      </section>
    </div>
  );
}

function CampoConfiguravel({
  campo,
  rotulo,
  dica,
  ativo,
  onAlternar,
  valido = true,
  valorAtual,
  children,
}: {
  campo: CampoEditor;
  rotulo: string;
  dica: string;
  ativo: boolean;
  onAlternar: (campo: CampoEditor) => void;
  valido?: boolean;
  valorAtual?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "bg-card rounded-xl border transition-colors",
        ativo && "border-blue-300 shadow-sm",
      )}
    >
      <div className="flex min-h-16 items-center gap-3 p-4">
        <Checkbox
          id={`configurar-${campo}`}
          checked={ativo}
          onCheckedChange={() => onAlternar(campo)}
        />
        <Label
          htmlFor={`configurar-${campo}`}
          className="flex-1 cursor-pointer text-sm font-semibold"
        >
          {rotulo}
          {valorAtual ? (
            <span className="text-muted-foreground mt-1 block text-xs font-normal">
              Atual: <strong className="text-foreground">{valorAtual}</strong>
            </span>
          ) : null}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Ajuda sobre ${rotulo}`}
              className="text-muted-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2"
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{dica}</TooltipContent>
        </Tooltip>
        {ativo && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onAlternar(campo)}
            aria-label={`Remover ${rotulo}`}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      {ativo && (
        <div className="border-t p-4">
          {children}
          {!valido && (
            <p className="mt-2 text-xs text-amber-700">
              Complete uma operação válida para incluí-la no preview.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function BlocoMedidas({
  aberto,
  onAbertoChange,
  campos,
  valores,
  definirMedida,
  definirOperacao,
  onRemover,
  produtosSelecionados,
}: {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  campos: Set<CampoEditor>;
  valores: Record<string, string>;
  definirMedida: (
    campo: "peso" | "altura" | "largura" | "comprimento",
    valor: string,
  ) => void;
  definirOperacao: (
    campo: "peso" | "altura" | "largura" | "comprimento",
    operacao: string,
  ) => void;
  onRemover: () => void;
  produtosSelecionados: ProdutoAlteracaoEmMassa[];
}) {
  const medidas = [
    ["peso", "Peso", "kg"],
    ["altura", "Altura", "cm"],
    ["largura", "Largura", "cm"],
    ["comprimento", "Comprimento", "cm"],
  ] as const;
  const configuradas = medidas.filter(([campo]) => campos.has(campo));
  return (
    <Accordion
      type="single"
      collapsible
      value={aberto ? "medidas" : ""}
      onValueChange={(valor) => onAbertoChange(valor === "medidas")}
      className="bg-card rounded-xl border border-blue-200 px-4 shadow-sm"
    >
      <AccordionItem value="medidas">
        <div className="flex items-center gap-2">
          <AccordionTrigger className="min-w-0 flex-1 hover:no-underline">
            <span>
              <span className="block font-semibold">Peso e dimensões</span>
              <span className="text-muted-foreground block text-xs font-normal">
                {configuradas.length
                  ? `${configuradas.map(([, rotulo]) => rotulo).join(", ")} configurado(s)`
                  : "Nenhum campo configurado"}
              </span>
            </span>
          </AccordionTrigger>
          {configuradas.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(evento) => {
                evento.stopPropagation();
                onRemover();
              }}
              aria-label="Remover todas as alterações de peso e dimensões"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <AccordionContent>
          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
            {medidas.map(([campo, rotulo, unidade]) => (
              <div
                key={campo}
                className={cn(
                  "rounded-lg border p-3",
                  campos.has(campo) &&
                    aberto &&
                    "border-blue-200 bg-blue-50/50",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`medida-${campo}`}>{rotulo}</Label>
                  <span className="text-muted-foreground text-xs">
                    {unidade}
                  </span>
                </div>
                <p className="text-muted-foreground mb-2 text-xs">
                  Atual:{" "}
                  <strong className="text-foreground">
                    {resumirMedidaAtual(produtosSelecionados, campo, unidade)}
                  </strong>
                </p>
                <OperacaoMedida
                  campo={campo}
                  valores={valores}
                  definirValor={definirMedida}
                  definirOperacao={definirOperacao}
                />
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Campos vazios permanecem intactos. Use “Limpar” somente quando
            quiser remover explicitamente um valor existente.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Controle({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{rotulo}</Label>
      {children}
    </div>
  );
}

function SelecaoModalidade({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MODALIDADES_PRECO_PRODUTO.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OperacaoNumero({
  prefixo,
  valores,
  definir,
  unidade,
}: {
  prefixo: string;
  valores: Record<string, string>;
  definir: (chave: string, valor: string) => void;
  unidade: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Controle rotulo="Operação">
        <Select
          value={valores[`${prefixo}_operacao`]}
          onValueChange={(valor) => definir(`${prefixo}_operacao`, valor)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="definir">Definir</SelectItem>
            <SelectItem value="aumentar">Aumentar</SelectItem>
            <SelectItem value="reduzir">Reduzir</SelectItem>
          </SelectContent>
        </Select>
      </Controle>
      <Controle rotulo={`Valor (${unidade})`}>
        <Input
          type="number"
          min="0"
          step="1"
          value={valores[`${prefixo}_valor`] ?? ""}
          onChange={(evento) =>
            definir(`${prefixo}_valor`, evento.target.value)
          }
        />
      </Controle>
    </div>
  );
}

function OperacaoMedida({
  campo,
  valores,
  definirValor,
  definirOperacao,
}: {
  campo: "peso" | "altura" | "largura" | "comprimento";
  valores: Record<string, string>;
  definirValor: (
    campo: "peso" | "altura" | "largura" | "comprimento",
    valor: string,
  ) => void;
  definirOperacao: (
    campo: "peso" | "altura" | "largura" | "comprimento",
    operacao: string,
  ) => void;
}) {
  const unidade = campo === "peso" ? "kg" : "cm";
  return (
    <div className="space-y-2">
      <Select
        value={valores[`${campo}_operacao`]}
        onValueChange={(valor) => definirOperacao(campo, valor)}
      >
        <SelectTrigger aria-label={`Operação para ${campo}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="definir">Definir</SelectItem>
          <SelectItem value="limpar">Limpar</SelectItem>
        </SelectContent>
      </Select>
      {valores[`${campo}_operacao`] !== "limpar" && (
        <Input
          type="number"
          min="0"
          step={campo === "peso" ? "0.001" : "1"}
          value={valores[`${campo}_valor`] ?? ""}
          id={`medida-${campo}`}
          onChange={(evento) => definirValor(campo, evento.target.value)}
          placeholder={unidade}
          aria-label={`${campo} em ${unidade}`}
        />
      )}
    </div>
  );
}
