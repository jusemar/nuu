"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { salvarPaginaDinamica } from "../../actions/paginas";
import { gerarIdentificador } from "../../lib/gerar-identificador";
import {
  CONTEUDO_PAGINA_VAZIO,
  type ConteudoPaginaDinamica,
} from "../../schemas/conteudo-pagina-dinamica.schema";
import { salvarPaginaDinamicaSchema } from "../../schemas/paginas-dinamicas.schema";
import { EditorConteudoPagina } from "./editor-conteudo-pagina";

const schemaFormulario = salvarPaginaDinamicaSchema.extend({
  status: z.enum(["rascunho", "publicada"]),
});
type EntradaFormulario = z.input<typeof schemaFormulario>;
type SaidaFormulario = z.output<typeof schemaFormulario>;

export type PaginaEmEdicao = Omit<SaidaFormulario, "conteudo"> & {
  id: string;
  conteudo: ConteudoPaginaDinamica;
};

type Propriedades = {
  aberto: boolean;
  pagina: PaginaEmEdicao | null;
  aoAlterarAbertura: (aberto: boolean) => void;
  aoSalvar: () => void;
};

export function FormularioPaginaDinamica({
  aberto,
  pagina,
  aoAlterarAbertura,
  aoSalvar,
}: Propriedades) {
  const [slugEditado, setSlugEditado] = useState(Boolean(pagina));
  const formulario = useForm<EntradaFormulario, unknown, SaidaFormulario>({
    resolver: zodResolver(schemaFormulario),
    defaultValues: pagina ?? {
      titulo: "",
      slug: "",
      conteudo: CONTEUDO_PAGINA_VAZIO,
      status: "rascunho",
      tituloSeo: null,
      descricaoSeo: null,
      publicadaEm: null,
    },
  });

  async function enviar(dados: SaidaFormulario) {
    const resultado = await salvarPaginaDinamica(dados);
    if (!resultado.sucesso) {
      if (resultado.campo === "slug") {
        formulario.setError("slug", { message: resultado.mensagem });
      }
      toast.error(resultado.mensagem);
      return;
    }
    toast.success(pagina ? "Página atualizada." : "Página criada.");
    aoAlterarAbertura(false);
    aoSalvar();
  }

  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{pagina ? "Editar página" : "Nova página"}</DialogTitle>
          <DialogDescription>
            O conteúdo fica salvo em formato estruturado e só será público após
            a implementação da rota da loja.
          </DialogDescription>
        </DialogHeader>
        <Form {...formulario}>
          <form
            className="space-y-5"
            onSubmit={formulario.handleSubmit(enviar)}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={formulario.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sobre nós"
                        {...field}
                        onChange={(evento) => {
                          field.onChange(evento);
                          if (!slugEditado) {
                            formulario.setValue(
                              "slug",
                              gerarIdentificador(evento.target.value),
                              { shouldValidate: true },
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formulario.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="sobre-nos"
                        autoCapitalize="none"
                        spellCheck={false}
                        {...field}
                        onChange={(evento) => {
                          setSlugEditado(true);
                          field.onChange(evento);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Gerado pelo título e editável.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={formulario.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="publicada">Publicada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulario.control}
              name="conteudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <EditorConteudoPagina
                      valor={field.value as ConteudoPaginaDinamica}
                      aoAlterar={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Aceita títulos, parágrafos, destaques, links e listas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">SEO</h3>
              <div className="space-y-4">
                <FormField
                  control={formulario.control}
                  name="tituloSeo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título SEO (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          maxLength={180}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formulario.control}
                  name="descricaoSeo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição SEO (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          maxLength={320}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => aoAlterarAbertura(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formulario.formState.isSubmitting}
              >
                {formulario.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Salvar página
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
