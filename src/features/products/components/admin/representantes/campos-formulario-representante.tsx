"use client";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { dadosProdutoRepresentanteSchema } from "../../../schemas/representantes/produto-representante.schema";

export const formularioProdutoRepresentanteSchema =
  dadosProdutoRepresentanteSchema.omit({ precoCentavos: true }).extend({
    pesoGramas: z.number().min(0).max(2147483).nullable().default(null),
    preco: z
      .string()
      .regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um preço válido.")
      .refine(
        (v) => Number(v.replace(",", ".")) > 0,
        "O preço deve ser maior que zero.",
      ),
  });
export type DadosFormularioRepresentante = z.output<
  typeof formularioProdutoRepresentanteSchema
>;
export type FormularioRepresentante = UseFormReturn<
  z.input<typeof formularioProdutoRepresentanteSchema>,
  unknown,
  DadosFormularioRepresentante
>;
export function CampoProdutoRepresentante({
  formulario,
  nome,
  rotulo,
  numerico = false,
  longo = false,
  inteiro = false,
}: {
  formulario: FormularioRepresentante;
  nome: keyof DadosFormularioRepresentante;
  rotulo: string;
  numerico?: boolean;
  longo?: boolean;
  inteiro?: boolean;
}) {
  const registro = formulario.register(
    nome,
    numerico
      ? { setValueAs: (v) => (v === "" ? null : Number(v)) }
      : inteiro
        ? { valueAsNumber: true }
        : {},
  );
  const erro = formulario.formState.errors[nome]?.message;
  return (
    <div className={`min-w-0 space-y-2 ${longo ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={`produto-${nome}`}>{rotulo}</Label>
      {longo ? (
        <Textarea id={`produto-${nome}`} className="min-h-28" {...registro} />
      ) : (
        <Input
          id={`produto-${nome}`}
          className="h-11"
          inputMode={
            nome === "pesoGramas"
              ? "decimal"
              : numerico || inteiro
                ? "numeric"
                : nome === "preco"
                  ? "decimal"
                  : "text"
          }
          {...registro}
        />
      )}{" "}
      {erro && (
        <p role="alert" className="text-destructive text-xs">
          {String(erro)}
        </p>
      )}
    </div>
  );
}
export function OpcoesBasicasRepresentante({
  formulario,
  opcoes,
  sku,
}: {
  formulario: FormularioRepresentante;
  opcoes: {
    categorias: { id: string; nome: string }[];
    marcas: { id: string; nome: string }[];
  };
  sku?: string;
}) {
  return (
    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <CampoProdutoRepresentante
          formulario={formulario}
          nome="nome"
          rotulo="Nome do produto *"
        />
      </div>
      {[
        {
          campo: "categoriaId" as const,
          rotulo: "Categoria *",
          itens: opcoes.categorias,
        },
        { campo: "marcaId" as const, rotulo: "Marca *", itens: opcoes.marcas },
      ].map((c) => (
        <div key={c.campo} className="min-w-0 space-y-2">
          <Label htmlFor={`produto-${c.campo}`}>{c.rotulo}</Label>
          <select
            id={`produto-${c.campo}`}
            className="border-input bg-background h-11 w-full min-w-0 rounded-md border px-3 text-sm"
            {...formulario.register(c.campo)}
          >
            <option value="">Selecione uma opção existente</option>
            {c.itens.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
          {formulario.formState.errors[c.campo] && (
            <p role="alert" className="text-destructive text-xs">
              Selecione uma opção válida.
            </p>
          )}
        </div>
      ))}
      <div className="space-y-2">
        <Label htmlFor="produto-sku">SKU Nooo</Label>
        <Input
          id="produto-sku"
          className="bg-muted h-11"
          readOnly
          value={sku ?? ""}
          placeholder="Gerado automaticamente no cadastro"
        />
      </div>
      <CampoProdutoRepresentante
        formulario={formulario}
        nome="codigoFornecedor"
        rotulo="Código do fornecedor"
      />
      <CampoProdutoRepresentante
        formulario={formulario}
        nome="gtin"
        rotulo="GTIN / EAN"
      />
      <CampoProdutoRepresentante
        formulario={formulario}
        nome="mpn"
        rotulo="Código do fabricante (MPN)"
      />
      <CampoProdutoRepresentante
        formulario={formulario}
        nome="ncm"
        rotulo="NCM"
      />
      <CampoProdutoRepresentante
        formulario={formulario}
        nome="descricao"
        rotulo="Descrição"
        longo
      />
    </div>
  );
}
