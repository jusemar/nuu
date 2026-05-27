import { PaginaRegrasDisponibilidadeLogistica } from "@/features/admin/logistica/components/operacao/paginas-logistica-operacional";
import { mapearRegraDisponibilidadeOperacional } from "@/features/admin/logistica/lib/mapear-regras-disponibilidade-operacional";
import { listarRegrasCategoriasFrete } from "@/features/admin/logistica/queries/regras-categorias";
import { listarRegrasProdutosFrete } from "@/features/admin/logistica/queries/regras-produtos";
import { listarRegrasTiposLogisticosFrete } from "@/features/admin/logistica/queries/tipos-logisticos";

export default async function RegrasDisponibilidadeLogisticaPage() {
  const [regrasCategorias, regrasProdutos, regrasClassificacoes] = await Promise.all([
    listarRegrasCategoriasFrete(),
    listarRegrasProdutosFrete(),
    listarRegrasTiposLogisticosFrete(),
  ]);

  return (
    <PaginaRegrasDisponibilidadeLogistica
      regrasCategorias={regrasCategorias.map((regra) =>
        mapearRegraDisponibilidadeOperacional(regra, "categoria", regra.categoriaNome),
      )}
      regrasProdutos={regrasProdutos.map((regra) =>
        mapearRegraDisponibilidadeOperacional(regra, "produto", regra.produtoNome),
      )}
      regrasClassificacoes={regrasClassificacoes.map((regra) =>
        mapearRegraDisponibilidadeOperacional(regra, "classificacao", regra.tipoLogisticoNome),
      )}
    />
  );
}
