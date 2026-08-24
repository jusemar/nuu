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
import { Switch } from "@/components/ui/switch";

import { salvarGrupoNavegacao } from "../../actions/grupos";
import { gerarIdentificador } from "../../lib/gerar-identificador";
import { salvarGrupoNavegacaoSchema } from "../../schemas/paginas-dinamicas.schema";

const formularioGrupoSchema = salvarGrupoNavegacaoSchema;
type EntradaFormulario = z.input<typeof formularioGrupoSchema>;
type SaidaFormulario = z.output<typeof formularioGrupoSchema>;

export type GrupoEmEdicao = SaidaFormulario & { id: string };

type Propriedades = {
  aberto: boolean;
  grupo: GrupoEmEdicao | null;
  proximaOrdem: number;
  aoAlterarAbertura: (aberto: boolean) => void;
  aoSalvar: (grupo: GrupoEmEdicao) => void;
};

export function FormularioGrupoNavegacao({
  aberto,
  grupo,
  proximaOrdem,
  aoAlterarAbertura,
  aoSalvar,
}: Propriedades) {
  const [identificadorEditado, setIdentificadorEditado] = useState(
    Boolean(grupo),
  );
  const formulario = useForm<EntradaFormulario, unknown, SaidaFormulario>({
    resolver: zodResolver(formularioGrupoSchema),
    defaultValues: grupo ?? {
      nome: "",
      tituloPublico: "",
      identificador: "",
      localExibicao: "rodape",
      ativo: true,
      ordem: proximaOrdem,
    },
  });

  async function enviar(dados: SaidaFormulario) {
    const resultado = await salvarGrupoNavegacao(dados);
    if (!resultado.sucesso) {
      if (resultado.campo === "identificador") {
        formulario.setError("identificador", { message: resultado.mensagem });
      }
      toast.error(resultado.mensagem);
      return;
    }
    aoSalvar({ ...dados, id: resultado.dados.id });
    toast.success(
      grupo ? "Grupo atualizado com sucesso." : "Grupo criado com sucesso.",
    );
    aoAlterarAbertura(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{grupo ? "Editar grupo" : "Novo grupo"}</DialogTitle>
          <DialogDescription>
            Organize uma seção de links da loja. As páginas serão vinculadas em
            uma próxima etapa.
          </DialogDescription>
        </DialogHeader>

        <Form {...formulario}>
          <form
            className="space-y-5"
            onSubmit={formulario.handleSubmit(enviar)}
          >
            <FormField
              control={formulario.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome administrativo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Links institucionais"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Usado apenas para identificar o grupo no painel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulario.control}
              name="tituloPublico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título público</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Empresa"
                      autoComplete="off"
                      {...field}
                      onChange={(evento) => {
                        field.onChange(evento);
                        if (!identificadorEditado) {
                          formulario.setValue(
                            "identificador",
                            gerarIdentificador(evento.target.value),
                            { shouldValidate: true },
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Será exibido como título da seção para os clientes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulario.control}
              name="identificador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificador</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="empresa"
                      autoCapitalize="none"
                      autoComplete="off"
                      spellCheck={false}
                      {...field}
                      onChange={(evento) => {
                        setIdentificadorEditado(true);
                        field.onChange(evento);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Gerado pelo título e editável. Use letras minúsculas,
                    números e hífens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulario.control}
              name="localExibicao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de exibição</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rodape">Rodapé</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <FormLabel>Grupo ativo</FormLabel>
                    <FormDescription>
                      Deixa o grupo preparado para exibição futura na loja.
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
                {grupo ? "Salvar alterações" : "Criar grupo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
