"use client";

import { ChevronRight, Plus, Save, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PermissaoAdministrativaChave } from "@/features/autenticacao/constants/permissoes-administrativas";

import { criarConviteAdministrador } from "../../actions/criar-convite-administrador";
import {
  reenviarConviteAdministrador,
  revogarConviteAdministrador,
} from "../../actions/gerenciar-convite-administrador";
import { salvarAcessoAdministrador } from "../../actions/salvar-acesso-administrador";
import type {
  AdministradorTela,
  DadosGestaoAdministradores,
} from "../../types/gestao-administradores.types";

const rotulosModulos: Record<string, string> = {
  administradores: "Usuários e permissões",
  atendente_ia: "Atendente IA",
  banners: "Banners",
  categorias: "Categorias",
  fidelidade: "Fidelidade",
  fornecedores: "Fornecedores",
  logistica: "Logística",
  loja_configuracoes: "Configurações da loja",
  marcas: "Marcas",
  marketing: "Marketing",
  pagamentos_entrega: "Pagamento na entrega",
  paginas: "Páginas",
  painel: "Painel",
  pedidos: "Pedidos",
  precificacao: "Precificação",
  produtos: "Produtos",
};

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function formatarUltimoAcesso(valor: string | null) {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

function nomeFuncao(administrador: AdministradorTela) {
  if (administrador.administradorPrincipal) return "Administrador principal";
  if (administrador.personalizado) return "Personalizado";
  return administrador.funcoes[0] ?? "Personalizado";
}

function FormularioConvite({ dados }: { dados: DadosGestaoAdministradores }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [funcaoId, setFuncaoId] = useState("personalizado");
  const [permissoes, setPermissoes] = useState(
    new Set<PermissaoAdministrativaChave>(),
  );

  function selecionarFuncao(valor: string) {
    setFuncaoId(valor);
    const funcao = dados.funcoes.find(({ id }) => id === valor);
    setPermissoes(new Set(funcao?.permissoes ?? []));
  }

  function enviar() {
    iniciarTransicao(async () => {
      try {
        await criarConviteAdministrador({
          email,
          funcaoId: funcaoId === "personalizado" ? null : funcaoId,
          nome,
          permissoesEfetivas: [...permissoes],
        });
        toast.success("Convite enviado.");
        setAberto(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível criar o convite.");
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button disabled={!dados.atorPodeAdministrar} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Adicionar usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convidar administrador</DialogTitle>
          <DialogDescription>
            O destinatário criará ou usará a própria credencial. Você nunca
            define a senha dele.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="convite-nome">Nome</Label>
            <Input
              id="convite-nome"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="convite-email">E-mail</Label>
            <Input
              id="convite-email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="convite-funcao">Função</Label>
            <Select value={funcaoId} onValueChange={selecionarFuncao}>
              <SelectTrigger id="convite-funcao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personalizado">Personalizado</SelectItem>
                {dados.funcoes.map((funcao) => (
                  <SelectItem key={funcao.id} value={funcao.id}>
                    {funcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3">
          <Label>Permissões globais</Label>
          <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {dados.permissoes.map((permissao) => (
              <label
                key={permissao.chave}
                className="flex min-h-11 items-center gap-3 rounded-md border p-3 text-sm"
              >
                <Checkbox
                  checked={permissoes.has(permissao.chave)}
                  onCheckedChange={(valor) =>
                    setPermissoes((atuais) => {
                      const proximas = new Set(atuais);
                      if (valor === true) proximas.add(permissao.chave);
                      else proximas.delete(permissao.chave);
                      return proximas;
                    })
                  }
                />
                <span>{permissao.nome}</span>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={enviar}
            disabled={pendente || !nome.trim() || !email.trim()}
          >
            {pendente ? "Enviando..." : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AcoesConvite({ conviteId }: { conviteId: string }) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  function executar(tipo: "reenviar" | "revogar") {
    iniciarTransicao(async () => {
      try {
        const resultado =
          tipo === "reenviar"
            ? await reenviarConviteAdministrador(conviteId)
            : await revogarConviteAdministrador(conviteId);
        if (!resultado.sucesso) {
          toast.error(resultado.mensagem);
          return;
        }
        toast.success(
          tipo === "reenviar" ? "Convite reenviado." : "Convite revogado.",
        );
        router.refresh();
      } catch {
        toast.error("Não foi possível atualizar o convite.");
      }
    });
  }
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pendente}
        onClick={() => executar("reenviar")}
      >
        Reenviar
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pendente}
        onClick={() => executar("revogar")}
      >
        Revogar
      </Button>
    </div>
  );
}

function EditorAdministrador({
  dados,
  administrador,
}: {
  dados: DadosGestaoAdministradores;
  administrador: AdministradorTela;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, iniciarTransicao] = useTransition();
  const [funcaoId, setFuncaoId] = useState(
    administrador.funcaoId ?? "personalizado",
  );
  const [status, setStatus] = useState(administrador.status);
  const [permissoes, setPermissoes] = useState(
    new Set(administrador.permissoesEfetivas),
  );
  const principalImutavel = administrador.administradorPrincipal;
  const podeEditar = dados.atorPodeAdministrar;
  const permissoesPorModulo = dados.permissoes.reduce<
    Record<string, (typeof dados.permissoes)[number][]>
  >((grupos, permissao) => {
    grupos[permissao.modulo] = [...(grupos[permissao.modulo] ?? []), permissao];
    return grupos;
  }, {});

  function selecionarFuncao(valor: string) {
    setFuncaoId(valor);
    const funcao = dados.funcoes.find(({ id }) => id === valor);
    if (funcao) setPermissoes(new Set(funcao.permissoes));
  }

  function alternarPermissao(
    chave: PermissaoAdministrativaChave,
    marcada: boolean,
  ) {
    setPermissoes((atuais) => {
      const proximas = new Set(atuais);
      if (marcada) proximas.add(chave);
      else proximas.delete(chave);
      return proximas;
    });
  }

  function salvar() {
    iniciarTransicao(async () => {
      try {
        const resultado = await salvarAcessoAdministrador({
          administradorId: administrador.id,
          funcaoId: funcaoId === "personalizado" ? null : funcaoId,
          permissoesEfetivas: [...permissoes],
          status,
        });
        if (!resultado.sucesso) {
          toast.error(resultado.mensagem);
          return;
        }
        toast.success(
          resultado.alterado
            ? "Permissões salvas."
            : "Nenhuma alteração necessária.",
        );
        setAberto(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível salvar as permissões.");
      }
    });
  }

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Editar acesso de ${administrador.nome}`}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b px-5 py-5 text-left">
          <SheetTitle>Editar usuário</SheetTitle>
          <SheetDescription>
            Dados de identidade são somente leitura. Altere apenas o acesso
            global.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-5 pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`nome-${administrador.id}`}>Nome</Label>
              <Input
                id={`nome-${administrador.id}`}
                value={administrador.nome}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-${administrador.id}`}>E-mail</Label>
              <Input
                id={`email-${administrador.id}`}
                value={administrador.email}
                readOnly
              />
            </div>
          </div>

          {principalImutavel && (
            <div className="bg-muted flex gap-3 rounded-lg border p-3 text-sm">
              <ShieldCheck
                className="text-primary mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Administrador principal</p>
                <p className="text-muted-foreground">
                  O principal possui todas as permissões globais. Sua
                  autorização não é representada por preset ou overrides.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`funcao-${administrador.id}`}>Função</Label>
              <Select
                value={funcaoId}
                onValueChange={selecionarFuncao}
                disabled={!podeEditar || principalImutavel}
              >
                <SelectTrigger id={`funcao-${administrador.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                  {dados.funcoes.map((funcao) => (
                    <SelectItem key={funcao.id} value={funcao.id}>
                      {funcao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`status-${administrador.id}`}>Status</Label>
              <Select
                value={status}
                onValueChange={(valor: "ativo" | "desativado") =>
                  setStatus(valor)
                }
                disabled={!podeEditar || principalImutavel}
              >
                <SelectTrigger id={`status-${administrador.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <div>
            <h3 className="font-medium">Permissões globais</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Alterar uma permissão em relação ao preset cria somente o override
              necessário.
            </p>
          </div>
          <div className="space-y-6">
            {Object.entries(permissoesPorModulo).map(([modulo, itens]) => (
              <fieldset
                key={modulo}
                className="space-y-3"
                disabled={!podeEditar || principalImutavel}
              >
                <legend className="text-sm font-semibold">
                  {rotulosModulos[modulo] ?? modulo}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {itens?.map((permissao) => (
                    <label
                      key={permissao.chave}
                      className="hover:bg-muted/50 flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3"
                    >
                      <Checkbox
                        checked={permissoes.has(permissao.chave)}
                        onCheckedChange={(valor) =>
                          alternarPermissao(permissao.chave, valor === true)
                        }
                        aria-label={`${rotulosModulos[modulo] ?? modulo}: ${permissao.nome}`}
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {permissao.nome}
                        </span>
                        {permissao.chave === "atendente_ia.acessar" && (
                          <span className="text-muted-foreground mt-1 block text-xs">
                            Os papéis internos são gerenciados separadamente.
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        <SheetFooter className="bg-background sticky bottom-0 border-t px-5 py-4">
          <Button
            onClick={salvar}
            disabled={!podeEditar || principalImutavel || salvando}
            className="gap-2"
          >
            <Save className="size-4" aria-hidden="true" />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function PaginaUsuariosPermissoes({
  dados,
}: {
  dados: DadosGestaoAdministradores;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Usuários e permissões
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie quem pode acessar o painel administrativo.
          </p>
        </div>
        <FormularioConvite dados={dados} />
      </header>

      <Card className="overflow-hidden py-0 shadow-sm">
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.administradores.map((administrador) => (
                  <TableRow key={administrador.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback>
                            {iniciais(administrador.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{administrador.nome}</p>
                          <p className="text-muted-foreground text-xs">
                            {administrador.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{nomeFuncao(administrador)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          administrador.status === "ativo"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {administrador.status === "ativo"
                          ? "Ativo"
                          : "Desativado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatarUltimoAcesso(administrador.ultimoAcesso)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditorAdministrador
                        dados={dados}
                        administrador={administrador}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {dados.administradores.map((administrador) => (
              <div
                key={administrador.id}
                className="flex items-start gap-3 p-4"
              >
                <Avatar className="size-10">
                  <AvatarFallback>
                    {iniciais(administrador.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{administrador.nome}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {administrador.email}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        administrador.status === "ativo"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {administrador.status === "ativo"
                        ? "Ativo"
                        : "Desativado"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {nomeFuncao(administrador)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Último acesso:{" "}
                    {formatarUltimoAcesso(administrador.ultimoAcesso)}
                  </p>
                </div>
                <EditorAdministrador
                  dados={dados}
                  administrador={administrador}
                />
              </div>
            ))}
          </div>

          {dados.administradores.length === 0 && (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <UserRound
                className="text-muted-foreground size-8"
                aria-hidden="true"
              />
              <p className="mt-3 font-medium">
                Nenhum administrador encontrado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {dados.convitesPendentes.length > 0 && (
        <section className="space-y-3" aria-labelledby="convites-pendentes">
          <div>
            <h2 id="convites-pendentes" className="font-semibold">
              Convites pendentes
            </h2>
            <p className="text-muted-foreground text-sm">
              Aguardando ativação pelo destinatário.
            </p>
          </div>
          <Card>
            <CardContent className="divide-y p-0">
              {dados.convitesPendentes.map((convite) => (
                <div
                  key={convite.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{convite.nome}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {convite.email} · {convite.funcao}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Expira em {formatarUltimoAcesso(convite.expiraEm)}
                    </p>
                  </div>
                  <Badge variant="secondary">Convite pendente</Badge>
                  <AcoesConvite conviteId={convite.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
