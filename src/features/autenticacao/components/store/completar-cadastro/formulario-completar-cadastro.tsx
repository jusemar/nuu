"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, MapPin, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { consultarEnderecoCep } from "@/features/checkout/actions/consultar-endereco-cep";

import { salvarCadastroCliente } from "../../../actions/cadastro/salvar-cadastro-cliente";
import {
  completarCadastroClienteSchema,
  type CompletarCadastroClienteSchema,
} from "../../../schemas/cadastro-cliente.schema";
import type { CadastroClienteCompleto } from "../../../types/cadastro-cliente.types";
import type { SessaoClienteAutenticado } from "../../../types/sessao-cliente.types";

type FormularioCompletarCadastroProps = {
  sessao: SessaoClienteAutenticado;
  cadastro: CadastroClienteCompleto;
  modo?: "completar" | "editar";
};

function montarDataNascimentoPadrao(data: Date | null) {
  if (!data) return "";

  return data.toISOString().slice(0, 10);
}

function CampoFormulario({
  label,
  erro,
  children,
}: {
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      {children}
      {erro && <span className="block text-xs text-rose-700">{erro}</span>}
    </label>
  );
}

export function FormularioCompletarCadastro({
  sessao,
  cadastro,
  modo = "completar",
}: FormularioCompletarCadastroProps) {
  const router = useRouter();
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemCep, setMensagemCep] = useState<string | null>(null);

  const form = useForm<CompletarCadastroClienteSchema>({
    resolver: zodResolver(completarCadastroClienteSchema),
    mode: "onBlur",
    defaultValues: {
      tipoPessoa: cadastro.perfil?.tipoPessoa ?? "fisica",
      nomeCompleto: cadastro.perfil?.nomeCompleto ?? sessao.usuario.nome,
      documento: cadastro.perfil?.documento ?? "",
      telefone: cadastro.perfil?.telefone ?? "",
      dataNascimento: montarDataNascimentoPadrao(
        cadastro.perfil?.dataNascimento ?? null,
      ),
      observacaoCliente: cadastro.perfil?.observacaoCliente ?? "",
      cep: cadastro.enderecoPrincipal?.cep ?? "",
      rua: cadastro.enderecoPrincipal?.rua ?? "",
      numero: cadastro.enderecoPrincipal?.numero ?? "",
      complemento: cadastro.enderecoPrincipal?.complemento ?? "",
      bairro: cadastro.enderecoPrincipal?.bairro ?? "",
      cidade: cadastro.enderecoPrincipal?.cidade ?? "",
      estado: cadastro.enderecoPrincipal?.estado ?? "",
      autorizarEntregaVizinho:
        cadastro.enderecoPrincipal?.autorizarEntregaVizinho ?? false,
      nomeVizinho: cadastro.enderecoPrincipal?.nomeVizinho ?? "",
      observacaoVizinho: cadastro.enderecoPrincipal?.observacaoVizinho ?? "",
    },
  });

  const tipoPessoa = form.watch("tipoPessoa");
  const autorizarEntregaVizinho = form.watch("autorizarEntregaVizinho");

  async function consultarCep() {
    const cep = form.getValues("cep").replace(/\D/g, "");

    if (cep.length !== 8) {
      form.setError("cep", {
        message: "Informe um CEP válido para consultar.",
      });
      return;
    }

    setBuscandoCep(true);
    setMensagemCep(null);

    const resultado = await consultarEnderecoCep(cep);

    const enderecoConsultado =
      "endereco" in resultado ? resultado.endereco : null;

    if (!resultado.encontrado || !enderecoConsultado) {
      setMensagemCep(resultado.mensagem ?? "Não foi possível consultar o CEP.");
      setBuscandoCep(false);
      return;
    }

    form.setValue("cep", enderecoConsultado.cep, { shouldValidate: true });
    form.setValue("rua", enderecoConsultado.rua, { shouldValidate: true });
    form.setValue("bairro", enderecoConsultado.bairro, {
      shouldValidate: true,
    });
    form.setValue("cidade", enderecoConsultado.cidade, {
      shouldValidate: true,
    });
    form.setValue("estado", enderecoConsultado.estado, {
      shouldValidate: true,
    });

    if (enderecoConsultado.complemento) {
      form.setValue("complemento", enderecoConsultado.complemento);
    }

    setMensagemCep("Endereço preenchido pelo CEP.");
    setBuscandoCep(false);
  }

  async function enviarCadastro(dados: CompletarCadastroClienteSchema) {
    setSalvando(true);

    const resultado = await salvarCadastroCliente(dados);

    if (!resultado.sucesso) {
      toast.error(resultado.mensagem ?? "Não foi possível salvar o cadastro.");
      setSalvando(false);
      return;
    }

    toast.success(resultado.mensagem ?? "Cadastro salvo.");
    router.replace("/minha-conta");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(enviarCadastro)} className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#0C447C]">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Dados do cliente
            </h2>
            <p className="text-sm text-slate-500">{sessao.usuario.email}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoFormulario
            label="Tipo pessoa"
            erro={form.formState.errors.tipoPessoa?.message}
          >
            <Select
              value={tipoPessoa}
              onValueChange={(valor) =>
                form.setValue(
                  "tipoPessoa",
                  valor as CompletarCadastroClienteSchema["tipoPessoa"],
                  { shouldDirty: true, shouldValidate: true },
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisica">Pessoa física</SelectItem>
                <SelectItem value="juridica">Pessoa jurídica</SelectItem>
              </SelectContent>
            </Select>
          </CampoFormulario>

          <CampoFormulario
            label={tipoPessoa === "fisica" ? "CPF" : "CNPJ"}
            erro={form.formState.errors.documento?.message}
          >
            <Input
              inputMode="numeric"
              autoComplete="off"
              {...form.register("documento")}
            />
          </CampoFormulario>

          <CampoFormulario
            label="Nome completo"
            erro={form.formState.errors.nomeCompleto?.message}
          >
            <Input autoComplete="name" {...form.register("nomeCompleto")} />
          </CampoFormulario>

          <CampoFormulario
            label="Telefone"
            erro={form.formState.errors.telefone?.message}
          >
            <Input
              inputMode="tel"
              autoComplete="tel"
              {...form.register("telefone")}
            />
          </CampoFormulario>

          {tipoPessoa === "fisica" && (
            <CampoFormulario
              label="Data nascimento"
              erro={form.formState.errors.dataNascimento?.message}
            >
              <Input type="date" {...form.register("dataNascimento")} />
            </CampoFormulario>
          )}

          <div className="md:col-span-2">
            <CampoFormulario
              label="Observação geral"
              erro={form.formState.errors.observacaoCliente?.message}
            >
              <Input
                placeholder="Referência de entrega, portão azul, casa fundos"
                {...form.register("observacaoCliente")}
              />
            </CampoFormulario>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Endereço principal
            </h2>
            <p className="text-sm text-slate-500">
              Base para entregas e autopreenchimento do checkout.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <CampoFormulario
            label="CEP"
            erro={form.formState.errors.cep?.message}
          >
            <Input
              inputMode="numeric"
              autoComplete="postal-code"
              {...form.register("cep")}
            />
          </CampoFormulario>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              disabled={buscandoCep}
              onClick={consultarCep}
              className="w-full md:w-auto"
            >
              {buscandoCep && <Loader2 className="h-4 w-4 animate-spin" />}
              Buscar CEP
            </Button>
          </div>
        </div>

        {mensagemCep && (
          <p className="mt-2 text-sm text-slate-600">{mensagemCep}</p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CampoFormulario
            label="Rua"
            erro={form.formState.errors.rua?.message}
          >
            <Input autoComplete="address-line1" {...form.register("rua")} />
          </CampoFormulario>

          <CampoFormulario
            label="Número"
            erro={form.formState.errors.numero?.message}
          >
            <Input autoComplete="address-line2" {...form.register("numero")} />
          </CampoFormulario>

          <CampoFormulario label="Complemento">
            <Input {...form.register("complemento")} />
          </CampoFormulario>

          <CampoFormulario
            label="Bairro"
            erro={form.formState.errors.bairro?.message}
          >
            <Input {...form.register("bairro")} />
          </CampoFormulario>

          <CampoFormulario
            label="Cidade"
            erro={form.formState.errors.cidade?.message}
          >
            <Input autoComplete="address-level2" {...form.register("cidade")} />
          </CampoFormulario>

          <CampoFormulario
            label="Estado"
            erro={form.formState.errors.estado?.message}
          >
            <Input
              autoComplete="address-level1"
              maxLength={2}
              className="uppercase"
              {...form.register("estado")}
            />
          </CampoFormulario>
        </div>

        <div className="mt-5 rounded-lg border border-dashed bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#0C447C]"
              {...form.register("autorizarEntregaVizinho")}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Autorizar entrega para vizinho
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                Usaremos esta preferência como referência para entregas futuras.
              </span>
            </span>
          </label>

          {autorizarEntregaVizinho && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <CampoFormulario
                label="Nome vizinho"
                erro={form.formState.errors.nomeVizinho?.message}
              >
                <Input {...form.register("nomeVizinho")} />
              </CampoFormulario>

              <CampoFormulario
                label="Observação vizinho"
                erro={form.formState.errors.observacaoVizinho?.message}
              >
                <Input
                  placeholder="Casa, apartamento ou instrução para entrega"
                  {...form.register("observacaoVizinho")}
                />
              </CampoFormulario>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
          <span>
            {modo === "editar"
              ? "As alterações serão usadas nas próximas compras."
              : "Seu cadastro será liberado para a área cliente e checkout."}
          </span>
        </div>
        <Button type="submit" disabled={salvando} className="w-full sm:w-auto">
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
          {modo === "editar" ? "Salvar alterações" : "Salvar cadastro"}
        </Button>
      </div>
    </form>
  );
}
