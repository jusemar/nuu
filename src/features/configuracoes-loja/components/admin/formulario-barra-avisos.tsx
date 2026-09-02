"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, Plus, Save } from "lucide-react";
import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { salvarBarraAvisos } from "../../actions/salvar-barra-avisos";
import {
  barraAvisosSchema,
  type DadosBarraAvisos,
} from "../../schemas/barra-avisos.schema";
import type { ConfiguracaoBarraAvisos } from "../../types/barra-avisos.types";
import { BarraAvisos } from "../store/barra-avisos";
import { ItemMensagemBarraAvisos } from "./item-mensagem-barra-avisos";

export function FormularioBarraAvisos({
  configuracao,
}: {
  configuracao: ConfiguracaoBarraAvisos;
}) {
  const [salvando, iniciarSalvamento] = useTransition();
  const formulario = useForm<DadosBarraAvisos>({
    resolver: zodResolver(barraAvisosSchema),
    defaultValues: {
      ...configuracao,
      mensagens: configuracao.mensagens.map((mensagem) => ({
        id: mensagem.id,
        texto: mensagem.texto,
        icone: mensagem.icone ?? "",
        ativo: mensagem.ativo,
      })),
    },
  });
  const mensagens = useFieldArray({
    control: formulario.control,
    name: "mensagens",
    keyName: "chaveOrdenacao",
  });
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const valores = formulario.watch();

  function finalizarArraste(evento: DragEndEvent) {
    if (!evento.over || evento.active.id === evento.over.id) return;
    const origem = mensagens.fields.findIndex(
      (item) => item.chaveOrdenacao === evento.active.id,
    );
    const destino = mensagens.fields.findIndex(
      (item) => item.chaveOrdenacao === evento.over?.id,
    );
    if (origem >= 0 && destino >= 0) mensagens.move(origem, destino);
  }

  function adicionarMensagem() {
    mensagens.append({
      id: crypto.randomUUID(),
      texto: "",
      icone: "",
      ativo: true,
    });
  }

  function salvar(dados: DadosBarraAvisos) {
    iniciarSalvamento(async () => {
      try {
        const resultado = await salvarBarraAvisos(dados);
        formulario.reset(dados);
        toast.success(resultado.message);
      } catch (error) {
        console.error("Erro ao salvar barra de avisos:", error);
        toast.error("Não foi possível salvar a barra de avisos.");
      }
    });
  }

  return (
    <Form {...formulario}>
      <form onSubmit={formulario.handleSubmit(salvar)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="text-primary size-5" />
              Barra de avisos
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Configure os avisos exibidos acima do cabeçalho da loja.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={formulario.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Exibir barra</FormLabel>
                      <FormDescription>
                        Oculta a barra sem apagar mensagens.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={formulario.control}
                name="pausarHover"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Pausar ao passar o mouse</FormLabel>
                      <FormDescription>
                        Facilita a leitura do aviso.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {(["corFundo", "corTexto"] as const).map((nome) => (
                <FormField
                  key={nome}
                  control={formulario.control}
                  name={nome}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {nome === "corFundo" ? "Cor de fundo" : "Cor do texto"}
                      </FormLabel>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="h-10 w-14 p-1"
                          value={field.value}
                          onChange={field.onChange}
                          aria-label={`Seletor de ${nome === "corFundo" ? "cor de fundo" : "cor do texto"}`}
                        />
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={7}
                            placeholder="#000000"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormField
              control={formulario.control}
              name="velocidadeSegundos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Velocidade da animação</FormLabel>
                  <div className="grid grid-cols-[1fr_5rem] items-center gap-4">
                    <Slider
                      min={10}
                      max={120}
                      step={5}
                      value={[Number(field.value)]}
                      onValueChange={([valor]) => field.onChange(valor)}
                    />
                    <FormControl>
                      <Input
                        type="number"
                        min={10}
                        max={120}
                        step={1}
                        value={field.value}
                        onChange={(evento) =>
                          field.onChange(Number(evento.target.value))
                        }
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    {field.value}s por ciclo completo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">Mensagens</h3>
                  <p className="text-muted-foreground text-sm">
                    Arraste para definir a ordem de exibição.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarMensagem}
                >
                  <Plus className="size-4" />
                  Adicionar mensagem
                </Button>
              </div>
              <DndContext
                sensors={sensores}
                collisionDetection={closestCenter}
                onDragEnd={finalizarArraste}
              >
                <SortableContext
                  items={mensagens.fields.map((item) => item.chaveOrdenacao)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {mensagens.fields.map((item, indice) => (
                      <ItemMensagemBarraAvisos
                        key={item.chaveOrdenacao}
                        indice={indice}
                        identificadorOrdenacao={item.chaveOrdenacao}
                        desabilitado={salvando}
                        aoExcluir={() => mensagens.remove(indice)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {mensagens.fields.length === 0 && (
                <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                  Nenhuma mensagem cadastrada. A barra não será exibida.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Prévia ao vivo</h3>
              <div className="overflow-hidden rounded-lg border">
                <BarraAvisos
                  configuracao={{
                    ...valores,
                    mensagens: valores.mensagens.map((mensagem, ordem) => ({
                      ...mensagem,
                      icone: mensagem.icone || null,
                      ordem,
                    })),
                  }}
                  previa
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Button
          type="submit"
          disabled={salvando || !formulario.formState.isDirty}
        >
          <Save className="size-4" />
          {salvando ? "Salvando..." : "Salvar barra de avisos"}
        </Button>
      </form>
    </Form>
  );
}
