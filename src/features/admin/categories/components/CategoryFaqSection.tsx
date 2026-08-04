"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  alterarStatusFaqCategoria,
  atualizarFaqCategoria,
  criarFaqCategoria,
  excluirFaqCategoria,
  listarFaqsCategoria,
  reordenarFaqsCategoria,
} from "../actions/faqs-categoria";
import { normalizarOrdemFaqs } from "../lib/faqs-categoria";
import {
  atualizarFaqCategoriaSchema,
  criarFaqCategoriaSchema,
} from "../schemas/contratos-categoria";

type Faq = Awaited<ReturnType<typeof listarFaqsCategoria>>[number];
type CamposFaq = Pick<Faq, "answer" | "question">;

function mensagensCampos(valor: CamposFaq) {
  const resultado = atualizarFaqCategoriaSchema
    .pick({ answer: true, question: true })
    .safeParse(valor);
  if (resultado.success) return {};
  return Object.fromEntries(
    resultado.error.issues.map((item) => [item.path[0], item.message]),
  ) as Partial<Record<keyof CamposFaq, string>>;
}

function ItemFaq({
  aoAtualizar,
  aoExcluir,
  categoriaId,
  desabilitado,
  faq,
}: {
  aoAtualizar: (faq: Faq) => void;
  aoExcluir: (faq: Faq) => Promise<void>;
  categoriaId: string;
  desabilitado: boolean;
  faq: Faq;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: faq.id, disabled: desabilitado });
  const [campos, setCampos] = useState<CamposFaq>({
    answer: faq.answer,
    question: faq.question,
  });
  const [erros, setErros] = useState<Partial<Record<keyof CamposFaq, string>>>(
    {},
  );
  const [salvando, setSalvando] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Alterar somente o status no servidor não pode apagar uma edição textual local.
  useEffect(() => {
    setCampos({ answer: faq.answer, question: faq.question });
  }, [faq.answer, faq.question]);

  const salvar = async () => {
    if (salvando || desabilitado) return;
    const problemas = mensagensCampos(campos);
    setErros(problemas);
    if (Object.keys(problemas).length) return;
    setSalvando(true);
    try {
      const atualizada = await atualizarFaqCategoria(
        categoriaId,
        faq.id,
        campos,
      );
      aoAtualizar(atualizada);
      toast.success("Pergunta frequente salva.");
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível salvar.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-border"
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={`Reordenar pergunta: ${faq.question}`}
            className="text-muted-foreground focus-visible:ring-ring cursor-grab rounded-md p-1 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={desabilitado}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
          <span className="text-muted-foreground text-xs">
            Ordem {faq.orderIndex + 1}
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            {faq.question}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Label htmlFor={`status-faq-${faq.id}`} className="text-xs">
              {faq.isActive ? "Ativa" : "Inativa"}
            </Label>
            <Switch
              id={`status-faq-${faq.id}`}
              aria-label={`${faq.isActive ? "Desativar" : "Ativar"} pergunta ${faq.question}`}
              checked={faq.isActive}
              disabled={desabilitado || alterandoStatus}
              onCheckedChange={async (isActive) => {
                if (alterandoStatus) return;
                setAlterandoStatus(true);
                try {
                  const atualizada = await alterarStatusFaqCategoria(
                    categoriaId,
                    faq.id,
                    isActive,
                  );
                  aoAtualizar(atualizada);
                  toast.success(
                    isActive ? "Pergunta ativada." : "Pergunta desativada.",
                  );
                } catch (erro) {
                  toast.error(
                    erro instanceof Error
                      ? erro.message
                      : "Não foi possível alterar o status.",
                  );
                } finally {
                  setAlterandoStatus(false);
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Excluir pergunta ${faq.question}`}
              disabled={desabilitado || excluindo}
              onClick={async () => {
                if (
                  excluindo ||
                  !window.confirm(
                    `Excluir permanentemente a pergunta “${faq.question}”?`,
                  )
                )
                  return;
                setExcluindo(true);
                try {
                  await aoExcluir(faq);
                } finally {
                  setExcluindo(false);
                }
              }}
            >
              {excluindo ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="text-destructive size-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`pergunta-faq-${faq.id}`}>Pergunta</Label>
          <Input
            id={`pergunta-faq-${faq.id}`}
            aria-describedby={
              erros.question ? `erro-pergunta-faq-${faq.id}` : undefined
            }
            aria-invalid={Boolean(erros.question)}
            disabled={desabilitado}
            value={campos.question}
            onChange={(evento) => {
              setCampos((atual) => ({
                ...atual,
                question: evento.target.value,
              }));
              setErros((atual) => ({ ...atual, question: undefined }));
            }}
          />
          {erros.question ? (
            <p
              id={`erro-pergunta-faq-${faq.id}`}
              role="alert"
              className="text-destructive text-xs"
            >
              A pergunta é obrigatória.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`resposta-faq-${faq.id}`}>Resposta</Label>
          <Textarea
            id={`resposta-faq-${faq.id}`}
            aria-describedby={
              erros.answer ? `erro-resposta-faq-${faq.id}` : undefined
            }
            aria-invalid={Boolean(erros.answer)}
            disabled={desabilitado}
            value={campos.answer}
            onChange={(evento) => {
              setCampos((atual) => ({ ...atual, answer: evento.target.value }));
              setErros((atual) => ({ ...atual, answer: undefined }));
            }}
            rows={4}
          />
          {erros.answer ? (
            <p
              id={`erro-resposta-faq-${faq.id}`}
              role="alert"
              className="text-destructive text-xs"
            >
              A resposta é obrigatória.
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          size="sm"
          disabled={desabilitado || salvando}
          onClick={salvar}
        >
          {salvando ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {salvando ? "Salvando..." : "Salvar pergunta"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function CategoryFaqSection({ categoriaId }: { categoriaId?: string }) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [ordemPersistida, setOrdemPersistida] = useState<Faq[]>([]);
  const [carregando, setCarregando] = useState(Boolean(categoriaId));
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [reordenando, setReordenando] = useState(false);
  const [ordemAlterada, setOrdemAlterada] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [nova, setNova] = useState({ answer: "", question: "" });
  const [errosNova, setErrosNova] = useState<
    Partial<Record<keyof CamposFaq, string>>
  >({});
  const categoriaAnterior = useRef(categoriaId);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const carregar = useCallback(async () => {
    if (!categoriaId) return;
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const resultado = await listarFaqsCategoria(categoriaId);
      setFaqs(resultado);
      setOrdemPersistida(resultado);
      setOrdemAlterada(false);
    } catch (erro) {
      setErroCarregamento(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar as perguntas frequentes.",
      );
    } finally {
      setCarregando(false);
    }
  }, [categoriaId]);

  useEffect(() => {
    if (categoriaAnterior.current !== categoriaId) {
      setFaqs([]);
      setOrdemPersistida([]);
      setMostrarNova(false);
      categoriaAnterior.current = categoriaId;
    }
    void carregar();
  }, [carregar, categoriaId]);

  const adicionar = async () => {
    if (!categoriaId || criando) return;
    const problemas = mensagensCampos(nova);
    setErrosNova(problemas);
    if (Object.keys(problemas).length) return;
    const validacao = criarFaqCategoriaSchema.safeParse({
      ...nova,
      categoryId: categoriaId,
      isActive: true,
      orderIndex: faqs.length,
    });
    if (!validacao.success) return;
    setCriando(true);
    try {
      const faq = await criarFaqCategoria(validacao.data);
      const atualizadas = [...faqs, faq];
      setFaqs(atualizadas);
      setOrdemPersistida(atualizadas);
      setNova({ answer: "", question: "" });
      setMostrarNova(false);
      toast.success("Pergunta frequente adicionada.");
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível adicionar.",
      );
    } finally {
      setCriando(false);
    }
  };

  const excluir = async (faq: Faq) => {
    if (!categoriaId) return;
    try {
      await excluirFaqCategoria(categoriaId, faq.id);
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível excluir.",
      );
      return;
    }
    const restantes = normalizarOrdemFaqs(
      faqs.filter((item) => item.id !== faq.id),
    );
    setFaqs(restantes);
    setOrdemPersistida(restantes);
    setOrdemAlterada(false);
    toast.success("Pergunta frequente excluída.");
    if (restantes.length) {
      try {
        await reordenarFaqsCategoria(
          categoriaId,
          restantes.map(({ id, orderIndex }) => ({ id, orderIndex })),
        );
      } catch {
        toast.warning(
          "A pergunta foi excluída, mas a ordem restante será normalizada ao salvar.",
        );
        setOrdemAlterada(true);
      }
    }
  };

  const salvarOrdem = async () => {
    if (!categoriaId || reordenando || !ordemAlterada) return;
    setReordenando(true);
    try {
      await reordenarFaqsCategoria(
        categoriaId,
        faqs.map(({ id, orderIndex }) => ({ id, orderIndex })),
      );
      setOrdemPersistida(faqs);
      setOrdemAlterada(false);
      toast.success("Ordem das perguntas salva.");
    } catch (erro) {
      setFaqs(ordemPersistida);
      setOrdemAlterada(false);
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar a ordem.",
      );
    } finally {
      setReordenando(false);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Perguntas frequentes</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie perguntas específicas desta categoria ou subcategoria.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!categoriaId || !ordemAlterada || reordenando}
            onClick={salvarOrdem}
          >
            {reordenando ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Salvar ordem
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!categoriaId || criando || mostrarNova}
            onClick={() => setMostrarNova(true)}
          >
            <Plus className="mr-2 size-4" />
            Adicionar pergunta
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!categoriaId ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            Salve a categoria antes de adicionar perguntas frequentes.
          </p>
        ) : erroCarregamento ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/5 rounded-lg border p-4"
          >
            <p className="text-destructive text-sm">{erroCarregamento}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => void carregar()}
            >
              <RotateCcw className="mr-2 size-4" /> Tentar novamente
            </Button>
          </div>
        ) : carregando ? (
          <div
            role="status"
            aria-label="Carregando perguntas frequentes"
            className="space-y-3"
          >
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <>
            {mostrarNova ? (
              <Card className="border-primary/40">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Nova pergunta frequente</p>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Cancelar nova pergunta"
                      disabled={criando}
                      onClick={() => setMostrarNova(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nova-pergunta-faq">Pergunta</Label>
                    <Input
                      id="nova-pergunta-faq"
                      aria-invalid={Boolean(errosNova.question)}
                      value={nova.question}
                      onChange={(evento) => {
                        setNova((atual) => ({
                          ...atual,
                          question: evento.target.value,
                        }));
                        setErrosNova((atual) => ({
                          ...atual,
                          question: undefined,
                        }));
                      }}
                    />
                    {errosNova.question ? (
                      <p role="alert" className="text-destructive text-xs">
                        A pergunta é obrigatória.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nova-resposta-faq">Resposta</Label>
                    <Textarea
                      id="nova-resposta-faq"
                      aria-invalid={Boolean(errosNova.answer)}
                      value={nova.answer}
                      onChange={(evento) => {
                        setNova((atual) => ({
                          ...atual,
                          answer: evento.target.value,
                        }));
                        setErrosNova((atual) => ({
                          ...atual,
                          answer: undefined,
                        }));
                      }}
                      rows={4}
                    />
                    {errosNova.answer ? (
                      <p role="alert" className="text-destructive text-xs">
                        A resposta é obrigatória.
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={criando}
                    onClick={adicionar}
                  >
                    {criando ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 size-4" />
                    )}
                    {criando ? "Adicionando..." : "Criar pergunta"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {faqs.length === 0 && !mostrarNova ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="font-medium">
                  Nenhuma pergunta frequente cadastrada
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Adicione a primeira pergunta específica desta categoria.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensores}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (!over || active.id === over.id || reordenando) return;
                  const antigo = faqs.findIndex((faq) => faq.id === active.id);
                  const novo = faqs.findIndex((faq) => faq.id === over.id);
                  if (antigo < 0 || novo < 0) return;
                  setFaqs(normalizarOrdemFaqs(arrayMove(faqs, antigo, novo)));
                  setOrdemAlterada(true);
                }}
              >
                <SortableContext
                  items={faqs.map((faq) => faq.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <ItemFaq
                        key={faq.id}
                        faq={faq}
                        categoriaId={categoriaId}
                        desabilitado={reordenando}
                        aoAtualizar={(atualizada) =>
                          setFaqs((atuais) =>
                            atuais.map((item) =>
                              item.id === atualizada.id ? atualizada : item,
                            ),
                          )
                        }
                        aoExcluir={excluir}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
