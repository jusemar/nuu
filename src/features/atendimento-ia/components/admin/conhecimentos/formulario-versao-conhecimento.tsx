"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FilePenLine } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { atualizarRascunhoConhecimento } from "@/features/atendimento-ia/actions/conhecimento/atualizar-rascunho-conhecimento";
import { criarVersaoConhecimento } from "@/features/atendimento-ia/actions/conhecimento/criar-versao-conhecimento";
import { conteudoInstitucionalEditorSchema } from "@/features/atendimento-ia/schemas/admin/editor-conhecimento.schema";
import { perguntaRespostaAdminSchema } from "@/features/atendimento-ia/schemas/admin/pergunta-resposta.schema";

type InstitucionalEntrada = z.input<typeof conteudoInstitucionalEditorSchema>;
type InstitucionalSaida = z.output<typeof conteudoInstitucionalEditorSchema>;
type FaqEntrada = z.input<typeof perguntaRespostaAdminSchema>;
type FaqSaida = z.output<typeof perguntaRespostaAdminSchema>;

type Props = {
  atualizadoEm: string;
  conhecimentoId: string;
  conteudo: Record<string, unknown> | null;
  estado: string;
  tipo: "institucional" | "pergunta_resposta";
  versaoId: string;
};

function Rotulo({ children }: { children: React.ReactNode }) {
  return <Label className="grid gap-2">{children}</Label>;
}

export function FormularioVersaoConhecimento(props: Props) {
  const [aberto, setAberto] = useState(false);
  const editar = props.estado === "rascunho";
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FilePenLine /> {editar ? "Editar rascunho" : "Criar nova versão"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editar ? "Editar rascunho" : "Nova versão"}
          </DialogTitle>
          <DialogDescription>
            A versão permanece isolada do RAG e do atendimento público.
          </DialogDescription>
        </DialogHeader>
        {props.tipo === "institucional" ? (
          <FormularioInstitucional {...props} fechar={() => setAberto(false)} />
        ) : (
          <FormularioFaq {...props} fechar={() => setAberto(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioInstitucional(props: Props & { fechar: () => void }) {
  const [pendente, iniciar] = useTransition();
  const formulario = useForm<InstitucionalEntrada, unknown, InstitucionalSaida>(
    {
      resolver: zodResolver(conteudoInstitucionalEditorSchema),
      defaultValues: props.conteudo as InstitucionalEntrada,
    },
  );
  const salvar = formulario.handleSubmit((conteudo) =>
    iniciar(async () => {
      try {
        await persistir(props, conteudo);
        toast.success("Versão salva como rascunho.");
        props.fechar();
      } catch (erro) {
        toast.error(
          erro instanceof Error ? erro.message : "Não foi possível salvar.",
        );
      }
    }),
  );
  return (
    <form onSubmit={salvar} className="grid gap-4">
      <Rotulo>
        Conteúdo oficial
        <Textarea rows={7} {...formulario.register("conteudoOficial")} />
      </Rotulo>
      <Rotulo>
        Quando utilizar
        <Textarea {...formulario.register("quandoUtilizar")} />
      </Rotulo>
      <Rotulo>
        Quando não utilizar
        <Textarea {...formulario.register("quandoNaoUtilizar")} />
      </Rotulo>
      <Rotulo>
        Prioridade
        <select
          className="border-input bg-background h-9 rounded-md border px-3"
          {...formulario.register("prioridade")}
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </Rotulo>
      <Rotulo>
        Observações internas
        <Textarea {...formulario.register("observacoesInternas")} />
      </Rotulo>
      <Button disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar rascunho"}
      </Button>
    </form>
  );
}

function FormularioFaq(props: Props & { fechar: () => void }) {
  const [pendente, iniciar] = useTransition();
  const formulario = useForm<FaqEntrada, unknown, FaqSaida>({
    resolver: zodResolver(perguntaRespostaAdminSchema),
    defaultValues: props.conteudo as FaqEntrada,
  });
  const salvar = formulario.handleSubmit((conteudo) =>
    iniciar(async () => {
      try {
        await persistir(props, conteudo);
        toast.success("FAQ salva como rascunho.");
        props.fechar();
      } catch (erro) {
        toast.error(
          erro instanceof Error ? erro.message : "Não foi possível salvar.",
        );
      }
    }),
  );
  return (
    <form onSubmit={salvar} className="grid gap-4">
      <Rotulo>
        Pergunta principal
        <Input {...formulario.register("perguntaPrincipal")} />
      </Rotulo>
      <Rotulo>
        Primeira variação
        <Input {...formulario.register("variacoes.0")} />
      </Rotulo>
      <Rotulo>
        Resposta principal
        <Textarea rows={6} {...formulario.register("respostaPrincipal")} />
      </Rotulo>
      <Rotulo>
        Resposta segura sem confirmação
        <Textarea {...formulario.register("respostaSeguraSemConfirmacao")} />
      </Rotulo>
      <Rotulo>
        Observações internas
        <Textarea {...formulario.register("observacoesInternas")} />
      </Rotulo>
      <Button disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar rascunho"}
      </Button>
    </form>
  );
}

async function persistir(
  props: Props,
  conteudo: InstitucionalSaida | FaqSaida,
) {
  const alteracao = {
    conteudo,
    motivoAlteracao: "Edição administrativa do conteúdo",
    resumoAlteracao: "Conteúdo atualizado pelo editor administrativo",
  };
  if (props.estado === "rascunho")
    return atualizarRascunhoConhecimento({
      ...alteracao,
      atualizadoEmEsperado: props.atualizadoEm,
      versaoId: props.versaoId,
    });
  return criarVersaoConhecimento({
    ...alteracao,
    conhecimentoId: props.conhecimentoId,
  });
}
