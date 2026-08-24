"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import type { PaginaDinamica } from "@/db/schema";

import {
  associarPaginaAoGrupo,
  editarVinculoPaginaGrupo,
} from "../../actions/vinculos-e-ordenacao";

const schemaFormulario = z.object({
  paginaId: z.string().uuid("Selecione uma página."),
  textoLink: z
    .string()
    .trim()
    .max(180)
    .nullable()
    .transform((valor) => valor || null),
  ativo: z.boolean(),
});
type DadosFormulario = z.output<typeof schemaFormulario>;

export type VinculoEmEdicao = {
  paginaId: string;
  textoLink: string | null;
  ativo: boolean;
};

type Propriedades = {
  aberto: boolean;
  grupoId: string;
  paginasDisponiveis: PaginaDinamica[];
  proximaOrdem: number;
  vinculo: VinculoEmEdicao | null;
  aoAlterarAbertura: (aberto: boolean) => void;
  aoSalvar: () => void;
};

export function FormularioVinculoPagina({
  aberto,
  grupoId,
  paginasDisponiveis,
  proximaOrdem,
  vinculo,
  aoAlterarAbertura,
  aoSalvar,
}: Propriedades) {
  const formulario = useForm<
    z.input<typeof schemaFormulario>,
    unknown,
    DadosFormulario
  >({
    resolver: zodResolver(schemaFormulario),
    defaultValues: vinculo ?? { paginaId: "", textoLink: null, ativo: true },
  });

  async function enviar(dados: DadosFormulario) {
    const resultado = vinculo
      ? await editarVinculoPaginaGrupo({ grupoId, ...dados })
      : await associarPaginaAoGrupo({
          grupoId,
          ...dados,
          ordem: proximaOrdem,
        });
    if (!resultado.sucesso) {
      toast.error(resultado.mensagem);
      return;
    }
    toast.success(
      vinculo ? "Vínculo atualizado." : "Página adicionada ao grupo.",
    );
    aoAlterarAbertura(false);
    aoSalvar();
  }

  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {vinculo ? "Editar vínculo" : "Adicionar página"}
          </DialogTitle>
          <DialogDescription>
            Páginas em rascunho podem ser organizadas, mas só páginas publicadas
            aparecerão futuramente no site.
          </DialogDescription>
        </DialogHeader>
        <Form {...formulario}>
          <form
            className="space-y-5"
            onSubmit={formulario.handleSubmit(enviar)}
          >
            <FormField
              control={formulario.control}
              name="paginaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Página</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={Boolean(vinculo)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma página" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paginasDisponiveis.map((pagina) => (
                        <SelectItem key={pagina.id} value={pagina.id}>
                          {pagina.titulo} ·{" "}
                          {pagina.status === "publicada"
                            ? "Publicada"
                            : "Rascunho"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulario.control}
              name="textoLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto personalizado (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Conheça a empresa"
                      maxLength={180}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Se vazio, será usado o título da página.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulario.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>Vínculo ativo</FormLabel>
                    <FormDescription>
                      Prepara o link para exibição futura.
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
                {formulario.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {vinculo ? "Salvar alterações" : "Adicionar página"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
