"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

import type { ProdutoRepresentanteEdicao } from "../../../types/representantes/produto-representante.types";
import {
  CampoProdutoRepresentante,
  type FormularioRepresentante,
  OpcoesBasicasRepresentante,
} from "./campos-formulario-representante";
import { GaleriaProdutoRepresentante } from "./galeria-produto-representante";

function SecaoFormulario({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
const secoes = [
  {
    id: "dimensoes",
    titulo: "Peso e dimensões",
    campos: [
      { nome: "pesoGramas", rotulo: "Peso (kg)", numerico: true },
      { nome: "alturaCm", rotulo: "Altura (cm)", numerico: true },
      { nome: "larguraCm", rotulo: "Largura (cm)", numerico: true },
      { nome: "comprimentoCm", rotulo: "Comprimento (cm)", numerico: true },
    ],
  },
  {
    id: "garantia",
    titulo: "Garantia",
    campos: [
      {
        nome: "garantiaDias",
        rotulo: "Prazo da garantia (dias)",
        numerico: true,
      },
      { nome: "garantiaResponsavel", rotulo: "Responsável" },
    ],
  },
  {
    id: "seo",
    titulo: "SEO",
    campos: [
      { nome: "slug", rotulo: "Endereço do produto" },
      { nome: "metaTitulo", rotulo: "Título" },
      { nome: "metaDescricao", rotulo: "Descrição para busca", longo: true },
    ],
  },
] as const;
export function AbasFormularioProdutoRepresentante({
  formulario,
  opcoes,
  produto,
  produtoId,
  fornecedorId,
}: {
  formulario: FormularioRepresentante;
  opcoes: {
    categorias: { id: string; nome: string }[];
    marcas: { id: string; nome: string }[];
  };
  produto?: ProdutoRepresentanteEdicao;
  produtoId?: string;
  fornecedorId: string;
}) {
  return (
    <>
      <TabsContent value="basico" className="mt-0">
        <SecaoFormulario titulo="Informações básicas">
          <OpcoesBasicasRepresentante
            formulario={formulario}
            opcoes={opcoes}
            sku={produto?.sku}
          />
        </SecaoFormulario>
      </TabsContent>
      <TabsContent value="preco" className="mt-0">
        <SecaoFormulario titulo="Fornecedor">
          <div className="grid gap-5 sm:grid-cols-2">
            <CampoProdutoRepresentante
              formulario={formulario}
              nome="preco"
              rotulo="Preço"
            />
            <CampoProdutoRepresentante
              formulario={formulario}
              nome="estoque"
              rotulo="Estoque"
              inteiro
            />
            <div className="sm:col-span-2">
              <CampoProdutoRepresentante
                formulario={formulario}
                nome="prazo"
                rotulo="Prazo / disponibilidade"
              />
              <p className="text-muted-foreground mt-2 text-xs">
                Estoque disponível informado pelo fornecedor.
              </p>
            </div>
          </div>
        </SecaoFormulario>
      </TabsContent>
      <TabsContent value="imagens" className="mt-0">
        <SecaoFormulario titulo="Imagens do produto">
          {produtoId && produto ? (
            formulario.formState.isDirty ? (
              <p className="text-muted-foreground text-sm">
                Salve as alterações antes de gerenciar imagens.
              </p>
            ) : (
              <GaleriaProdutoRepresentante
                produtoId={produtoId}
                fornecedorId={fornecedorId}
                imagens={produto.imagens}
              />
            )
          ) : (
            <p className="text-muted-foreground text-sm">
              Salve o rascunho para adicionar imagens a este produto.
            </p>
          )}
        </SecaoFormulario>
      </TabsContent>
      {secoes.map((secao) => (
        <TabsContent key={secao.id} value={secao.id} className="mt-0">
          <SecaoFormulario titulo={secao.titulo}>
            <div className="grid gap-5 sm:grid-cols-2">
              {secao.campos.map((campo) => (
                <CampoProdutoRepresentante
                  key={campo.nome}
                  formulario={formulario}
                  {...campo}
                />
              ))}
            </div>
          </SecaoFormulario>
        </TabsContent>
      ))}
    </>
  );
}
