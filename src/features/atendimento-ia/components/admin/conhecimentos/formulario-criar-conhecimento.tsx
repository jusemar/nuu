"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { criarConhecimento } from "@/features/atendimento-ia/actions/conhecimento/criar-conhecimento";
import {
  criarConhecimentoFaqEditorSchema,
  criarConhecimentoInstitucionalEditorSchema,
} from "@/features/atendimento-ia/schemas/admin/editor-conhecimento.schema";

type InstitucionalEntrada = z.input<
  typeof criarConhecimentoInstitucionalEditorSchema
>;
type InstitucionalSaida = z.output<
  typeof criarConhecimentoInstitucionalEditorSchema
>;
type FaqEntrada = z.input<typeof criarConhecimentoFaqEditorSchema>;
type FaqSaida = z.output<typeof criarConhecimentoFaqEditorSchema>;

function Campo({
  children,
  titulo,
}: {
  children: React.ReactNode;
  titulo: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{titulo}</Label>
      {children}
    </div>
  );
}

export function FormularioCriarConhecimento() {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Novo conhecimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo conhecimento</DialogTitle>
          <DialogDescription>
            O conteúdo será salvo somente como rascunho, sem indexação ou
            publicação.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="institucional">
          <TabsList>
            <TabsTrigger value="institucional">Institucional</TabsTrigger>
            <TabsTrigger value="faq">Pergunta e resposta</TabsTrigger>
          </TabsList>
          <TabsContent value="institucional">
            <FormularioInstitucional aoSalvar={() => setAberto(false)} />
          </TabsContent>
          <TabsContent value="faq">
            <FormularioFaq aoSalvar={() => setAberto(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FormularioInstitucional({ aoSalvar }: { aoSalvar: () => void }) {
  const [pendente, iniciar] = useTransition();
  const formulario = useForm<InstitucionalEntrada, unknown, InstitucionalSaida>(
    {
      resolver: zodResolver(criarConhecimentoInstitucionalEditorSchema),
      defaultValues: {
        categoria: "Institucional",
        conteudo: {
          conteudoOficial: "",
          observacoesInternas: "",
          palavrasChave: [],
          prioridade: "media",
          quandoNaoUtilizar: "Não utilizar para dados dinâmicos da loja.",
          quandoUtilizar:
            "Utilizar quando a pergunta tratar desta política fixa.",
          termosRelacionados: [],
        },
        motivoAlteracao: "Criação do conhecimento",
        origem: "Gestão administrativa",
        tipoConhecimento: "institucional",
        tituloAdministrativo: "",
      },
    },
  );
  const salvar = formulario.handleSubmit((dados) =>
    iniciar(async () => {
      try {
        await criarConhecimento(dados);
        toast.success("Rascunho criado.");
        formulario.reset();
        aoSalvar();
      } catch (erro) {
        toast.error(
          erro instanceof Error
            ? erro.message
            : "Não foi possível criar o rascunho.",
        );
      }
    }),
  );
  return (
    <form onSubmit={salvar} className="grid gap-4 pt-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Campo titulo="Título administrativo">
          <Input {...formulario.register("tituloAdministrativo")} />
        </Campo>
        <Campo titulo="Categoria">
          <Input {...formulario.register("categoria")} />
        </Campo>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo titulo="Origem">
          <Input {...formulario.register("origem")} />
        </Campo>
        <Campo titulo="Motivo da alteração">
          <Input {...formulario.register("motivoAlteracao")} />
        </Campo>
      </div>
      <Campo titulo="Conteúdo oficial">
        <Textarea
          rows={7}
          {...formulario.register("conteudo.conteudoOficial")}
        />
      </Campo>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo titulo="Quando utilizar">
          <Textarea {...formulario.register("conteudo.quandoUtilizar")} />
        </Campo>
        <Campo titulo="Quando não utilizar">
          <Textarea {...formulario.register("conteudo.quandoNaoUtilizar")} />
        </Campo>
      </div>
      <Campo titulo="Prioridade">
        <select
          className="border-input bg-background h-9 rounded-md border px-3"
          {...formulario.register("conteudo.prioridade")}
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </Campo>
      <Campo titulo="Primeiro termo relacionado">
        <Input {...formulario.register("conteudo.termosRelacionados.0")} />
      </Campo>
      <Campo titulo="Observações internas (não entram no conteúdo da IA)">
        <Textarea {...formulario.register("conteudo.observacoesInternas")} />
      </Campo>
      <Button disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar rascunho"}
      </Button>
    </form>
  );
}

function FormularioFaq({ aoSalvar }: { aoSalvar: () => void }) {
  const [pendente, iniciar] = useTransition();
  const formulario = useForm<FaqEntrada, unknown, FaqSaida>({
    resolver: zodResolver(criarConhecimentoFaqEditorSchema),
    defaultValues: {
      categoria: "FAQ",
      conteudo: {
        condicoes: [],
        consultasDadosReais: [],
        observacoesInternas: "",
        palavrasChave: [],
        perguntaPrincipal: "",
        respostaPrincipal: "",
        respostaSeguraSemConfirmacao:
          "Não consigo confirmar esse dado sem consultar a fonte real da loja.",
        variacoes: [],
      },
      motivoAlteracao: "Criação da pergunta frequente",
      origem: "Gestão administrativa",
      tipoConhecimento: "pergunta_resposta",
      tituloAdministrativo: "",
    },
  });
  const salvar = formulario.handleSubmit((dados) =>
    iniciar(async () => {
      try {
        await criarConhecimento(dados);
        toast.success("FAQ salva como rascunho.");
        formulario.reset();
        aoSalvar();
      } catch (erro) {
        toast.error(
          erro instanceof Error
            ? erro.message
            : "Não foi possível criar a FAQ.",
        );
      }
    }),
  );
  return (
    <form onSubmit={salvar} className="grid gap-4 pt-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Campo titulo="Título administrativo">
          <Input {...formulario.register("tituloAdministrativo")} />
        </Campo>
        <Campo titulo="Categoria">
          <Input {...formulario.register("categoria")} />
        </Campo>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo titulo="Origem">
          <Input {...formulario.register("origem")} />
        </Campo>
        <Campo titulo="Motivo da alteração">
          <Input {...formulario.register("motivoAlteracao")} />
        </Campo>
      </div>
      <Campo titulo="Pergunta principal">
        <Input {...formulario.register("conteudo.perguntaPrincipal")} />
      </Campo>
      <Campo titulo="Primeira variação opcional">
        <Input {...formulario.register("conteudo.variacoes.0")} />
      </Campo>
      <Campo titulo="Resposta principal">
        <Textarea
          rows={6}
          {...formulario.register("conteudo.respostaPrincipal")}
        />
      </Campo>
      <Campo titulo="Resposta segura sem confirmação">
        <Textarea
          {...formulario.register("conteudo.respostaSeguraSemConfirmacao")}
        />
      </Campo>
      <Campo titulo="Primeira palavra-chave">
        <Input {...formulario.register("conteudo.palavrasChave.0")} />
      </Campo>
      <Campo titulo="Fonte real necessária">
        <select
          className="border-input bg-background h-9 rounded-md border px-3"
          {...formulario.register("conteudo.consultasDadosReais.0")}
        >
          <option value="">Nenhuma</option>
          <option value="produto">Produto</option>
          <option value="preco">Preço</option>
          <option value="estoque">Estoque</option>
          <option value="promocao">Promoção</option>
          <option value="entrega">Entrega</option>
          <option value="pedido">Pedido</option>
        </select>
      </Campo>
      <Campo titulo="Observações internas (não entram no conteúdo da IA)">
        <Textarea {...formulario.register("conteudo.observacoesInternas")} />
      </Campo>
      <Button disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar FAQ como rascunho"}
      </Button>
    </form>
  );
}
