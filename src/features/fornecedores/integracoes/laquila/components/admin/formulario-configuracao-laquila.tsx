"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  PlugZap,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  consultarProdutosLaquila,
  salvarConfiguracaoLaquila,
  testarConexaoLaquila,
} from "../../actions";
import type { ProdutoApiStagingLaquilaPrevia } from "../../queries";
import { configuracaoLaquilaSchema } from "../../schemas";
import type { ConfiguracaoLaquilaSchema } from "../../schemas";
import type {
  ConfiguracaoLaquilaAdmin,
  StatusTesteIntegracaoLaquila,
} from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type FormularioConfiguracaoLaquilaProps = {
  configuracao: ConfiguracaoLaquilaAdmin | null;
  produtosPreviaInicial?: ProdutoApiStagingLaquilaPrevia[];
  fornecedorId?: string;
  modo?: "pagina" | "drawer";
};

export function FormularioConfiguracaoLaquila({
  configuracao,
  produtosPreviaInicial = [],
  fornecedorId,
  modo = "pagina",
}: FormularioConfiguracaoLaquilaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTestando, startTesteTransition] = useTransition();
  const [isConsultando, startConsultaTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resumoProdutos, setResumoProdutos] = useState<{
    totalConsultado: number;
    totalSalvo: number;
  } | null>(null);
  const [produtosPrevia, setProdutosPrevia] = useState<
    ProdutoApiStagingLaquilaPrevia[]
  >(produtosPreviaInicial);
  const [ultimoTesteStatus, setUltimoTesteStatus] =
    useState<StatusTesteIntegracaoLaquila>(
      configuracao?.ultimoTesteStatus ?? "nao_testado",
    );
  const [ultimoTesteEm, setUltimoTesteEm] = useState<Date | null>(
    configuracao?.ultimoTesteEm ?? null,
  );
  const [integracaoId, setIntegracaoId] = useState<string | null>(
    configuracao?.id ?? null,
  );
  const [tokenConfigurado, setTokenConfigurado] = useState(
    configuracao?.tokenConfigurado ?? false,
  );

  const form = useForm<ConfiguracaoLaquilaSchema>({
    resolver: zodResolver(configuracaoLaquilaSchema),
    defaultValues: {
      id: configuracao?.id,
      fornecedorId: configuracao?.fornecedorId ?? fornecedorId,
      ambiente: "producao",
      urlBase: configuracao?.urlBase ?? "",
      cnpjEmpresa: configuracao?.cnpjEmpresa ?? "",
      tokenCliente: configuracao?.tokenCliente ?? undefined,
      ativo: configuracao?.ativo ?? true,
    },
  });

  function onSubmit(dados: ConfiguracaoLaquilaSchema) {
    setMensagem(null);
    setErro(null);

    startTransition(async () => {
      const dadosComContexto = {
        ...dados,
        id: integracaoId ?? dados.id,
        fornecedorId: configuracao?.fornecedorId ?? fornecedorId,
        ativo: dados.ativo ?? true,
      };
      const resultado = await salvarConfiguracaoLaquila(dadosComContexto);
      setMensagem(resultado.mensagem ?? null);
      setErro(resultado.erro ?? null);

      if (resultado.sucesso) {
        if (resultado.integracaoId) {
          setIntegracaoId(resultado.integracaoId);
          form.setValue("id", resultado.integracaoId);
        }

        if (dados.tokenCliente) {
          setTokenConfigurado(true);
        }

        form.reset({
          ...dadosComContexto,
          id: resultado.integracaoId ?? dadosComContexto.id,
          tokenCliente: dados.tokenCliente,
        });
        router.refresh();
      }
    });
  }

  function testarConexao() {
    setMensagem(null);
    setErro(null);

    if (!integracaoId) {
      setErro("Salve a configuração antes de testar a conexão.");
      return;
    }

    startTesteTransition(async () => {
      const resultado = await testarConexaoLaquila({
        integracaoId,
      });

      setMensagem(resultado.mensagem ?? null);
      setErro(resultado.erro ?? null);

      if (resultado.ultimoTesteStatus) {
        setUltimoTesteStatus(resultado.ultimoTesteStatus);
      }

      if (resultado.ultimoTesteEm) {
        setUltimoTesteEm(resultado.ultimoTesteEm);
      }
    });
  }

  function consultarProdutos() {
    setMensagem(null);
    setErro(null);
    setResumoProdutos(null);

    if (!integracaoId) {
      setErro("Salve a configuração antes de consultar produtos.");
      return;
    }

    startConsultaTransition(async () => {
      const resultado = await consultarProdutosLaquila({
        integracaoId,
        pagina: 1,
        itensPorPagina: 100,
      });

      setMensagem(resultado.mensagem ?? null);
      setErro(resultado.erro ?? null);

      if (resultado.sucesso) {
        setResumoProdutos({
          totalConsultado: resultado.totalConsultado ?? 0,
          totalSalvo: resultado.totalSalvo ?? 0,
        });

        if (resultado.produtos) {
          setProdutosPrevia(
            resultado.produtos.map((produto) => ({
              id: produto.codigo,
              codigo: produto.codigo,
              nome: produto.nome,
              marca: produto.marca,
              ean: produto.ean,
              ncm: produto.ncm,
              ultimaConsultaEm: new Date(),
            })),
          );
        }
      }
    });
  }

  function formatarUltimoTeste(data: Date | null) {
    if (!data) return "Ainda não testado";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(data));
  }

  const rotulosStatusTeste: Record<StatusTesteIntegracaoLaquila, string> = {
    nao_testado: "Nunca testado",
    sucesso: "Sucesso",
    erro: "Erro",
  };

  const conteudoFormulario = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Laquila</h2>
            <p className="text-sm text-slate-500">Conexão API</p>
          </div>
          <Badge variant="outline" className="w-fit gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Token: {tokenConfigurado ? "Configurado" : "Não configurado"}
          </Badge>
        </div>

        <FormField
          control={form.control}
          name="cnpjEmpresa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="urlBase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endpoint</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://api-dropshipping.laquila.com.br/{token-da-rota}/{metodo}"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tokenCliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder={
                    tokenConfigurado ? "Token cliente" : "Token cliente"
                  }
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {rotulosStatusTeste[ultimoTesteStatus]}
              </p>
              <p className="text-xs text-slate-500">
                {formatarUltimoTeste(ultimoTesteEm)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || isTestando || !integracaoId}
              onClick={testarConexao}
            >
              <PlugZap className="mr-2 h-4 w-4" />
              {isTestando ? "Testando..." : "Testar conexão"}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Produtos</p>
              {resumoProdutos ? (
                <p className="text-xs text-slate-500">
                  Consultados: {resumoProdutos.totalConsultado} · Salvos:{" "}
                  {resumoProdutos.totalSalvo}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Staging API</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || isTestando || isConsultando || !integracaoId}
              onClick={consultarProdutos}
            >
              <PlugZap className="mr-2 h-4 w-4" />
              {isConsultando ? "Consultando..." : "Consultar produtos"}
            </Button>
          </div>

          {produtosPrevia.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Código</th>
                    <th className="py-2 pr-3 font-medium">Nome</th>
                    <th className="py-2 pr-3 font-medium">Marca</th>
                    <th className="py-2 pr-3 font-medium">EAN</th>
                    <th className="py-2 font-medium">NCM</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosPrevia.map((produto) => (
                    <tr key={produto.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-slate-700">
                        {produto.codigo}
                      </td>
                      <td className="max-w-[220px] py-2 pr-3 text-slate-900">
                        {produto.nome}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {produto.marca ?? "-"}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {produto.ean ?? "-"}
                      </td>
                      <td className="py-2 text-slate-600">
                        {produto.ncm ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {mensagem && (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {mensagem}
          </div>
        )}

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        {!erro && ultimoTesteStatus === "erro" && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="h-4 w-4" />
            Erro no último teste.
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-fit">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );

  if (modo === "drawer") {
    return <div className="p-5">{conteudoFormulario}</div>;
  }

  return (
    <div className="rounded-lg border bg-white p-5">{conteudoFormulario}</div>
  );
}
