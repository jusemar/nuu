"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaginaDinamica } from "@/db/schema";

import type { GrupoNavegacaoComPaginas } from "../../types/paginas-dinamicas.types";
import { PaginaGruposNavegacao } from "./pagina-grupos-navegacao";
import { PaginaPaginasDinamicas } from "./pagina-paginas-dinamicas";

type Propriedades = {
  paginas: PaginaDinamica[];
  grupos: GrupoNavegacaoComPaginas[];
};

export function GestaoPaginasLoja({ paginas, grupos }: Propriedades) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-primary text-sm font-medium">Configurações</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Páginas da loja
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Gerencie conteúdos institucionais e a organização dos grupos de
          navegação.
        </p>
      </header>
      <Tabs defaultValue="paginas">
        <TabsList aria-label="Seções de páginas da loja">
          <TabsTrigger value="paginas">Páginas</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
        </TabsList>
        <TabsContent value="paginas" className="mt-6">
          <PaginaPaginasDinamicas paginasIniciais={paginas} />
        </TabsContent>
        <TabsContent value="grupos" className="mt-6">
          <PaginaGruposNavegacao
            gruposIniciais={grupos}
            paginas={paginas}
            incorporada
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
