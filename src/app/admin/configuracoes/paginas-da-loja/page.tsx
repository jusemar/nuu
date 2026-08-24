import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { GestaoPaginasLoja } from "@/features/paginas-dinamicas/components/admin/gestao-paginas-loja";
import { listarGruposNavegacao } from "@/features/paginas-dinamicas/queries/listar-grupos-navegacao";
import { listarPaginasDinamicas } from "@/features/paginas-dinamicas/queries/listar-paginas-dinamicas";

async function listarTodasPaginas() {
  const primeira = await listarPaginasDinamicas({ pagina: 1, porPagina: 100 });
  const totalPaginas = Math.ceil(primeira.total / primeira.porPagina);
  if (totalPaginas <= 1) return primeira.itens;
  const demais = await Promise.all(
    Array.from({ length: totalPaginas - 1 }, (_, indice) =>
      listarPaginasDinamicas({ pagina: indice + 2, porPagina: 100 }),
    ),
  );
  return [primeira, ...demais].flatMap((resultado) => resultado.itens);
}

export default async function PaginasDaLojaAdminPage() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PAGINAS.ADMINISTRAR);
  const [grupos, paginas] = await Promise.all([
    listarGruposNavegacao(),
    listarTodasPaginas(),
  ]);
  const chaveGrupos = grupos
    .map(
      (grupo) =>
        `${grupo.id}:${grupo.updatedAt.getTime()}:${grupo.paginas
          .map((vinculo) => `${vinculo.id}:${vinculo.updatedAt.getTime()}`)
          .join(",")}`,
    )
    .join("|");
  const chavePaginas = paginas
    .map((pagina) => `${pagina.id}:${pagina.updatedAt.getTime()}`)
    .join("|");
  const chave = `${chaveGrupos}::${chavePaginas}`;
  return <GestaoPaginasLoja key={chave} grupos={grupos} paginas={paginas} />;
}
