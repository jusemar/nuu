import "server-only";

import { db } from "@/db/connection";
import {
  productTable,
  produtosTiposLogisticosTable,
  regrasCategoriasFreteTable,
  regrasProdutosFreteTable,
  regrasTiposLogisticosFreteTable,
  variantesTiposLogisticosTable,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

import { selecionarClassificacoesLogisticasAplicaveis } from "../../lib/disponibilidade/selecionar-classificacoes-logisticas";
import { mapearDisponibilidadeFreteProduto } from "./mapear-disponibilidade-frete-produto";

async function buscarCategoriaProduto(produtoId: string) {
  const produto = await db.query.productTable.findFirst({
    columns: {
      categoryId: true,
    },
    where: eq(productTable.id, produtoId),
  });

  return produto?.categoryId ?? null;
}

export async function buscarDisponibilidadeFreteProduto({
  produtoId,
  varianteId,
  categoriaId,
}: {
  produtoId: string;
  varianteId?: string | null;
  categoriaId?: string | null;
}) {
  const categoriaProduto =
    categoriaId === undefined
      ? await buscarCategoriaProduto(produtoId)
      : categoriaId;

  const vinculosProduto = await db.query.produtosTiposLogisticosTable.findMany({
    where: eq(produtosTiposLogisticosTable.produtoId, produtoId),
    with: {
      tipoLogistico: true,
    },
  });
  const vinculosVariante = varianteId
    ? await db.query.variantesTiposLogisticosTable.findMany({
        where: eq(variantesTiposLogisticosTable.varianteId, varianteId),
        with: {
          tipoLogistico: true,
        },
      })
    : [];
  const vinculosTiposLogisticos =
    vinculosVariante.length > 0 ? vinculosVariante : vinculosProduto;
  const tiposLogisticosIdentificadores =
    selecionarClassificacoesLogisticasAplicaveis({
      vinculosProduto,
      vinculosVariante,
    });
  const tiposLogisticosIds = vinculosTiposLogisticos.map(
    (vinculo) => vinculo.tipoLogisticoId,
  );

  const [
    provedores,
    transportadoras,
    servicos,
    regrasProdutos,
    regrasCategorias,
    regrasTiposLogisticos,
  ] = await Promise.all([
    db.query.provedoresFreteTable.findMany(),
    db.query.transportadorasFreteTable.findMany({
      with: {
        provedor: true,
      },
    }),
    db.query.servicosFreteTable.findMany({
      with: {
        provedor: true,
        transportadora: true,
      },
    }),
    db.query.regrasProdutosFreteTable.findMany({
      where: eq(regrasProdutosFreteTable.produtoId, produtoId),
      with: {
        provedor: true,
        transportadora: {
          with: {
            provedor: true,
          },
        },
        servico: {
          with: {
            provedor: true,
            transportadora: true,
          },
        },
      },
    }),
    categoriaProduto
      ? db.query.regrasCategoriasFreteTable.findMany({
          where: eq(regrasCategoriasFreteTable.categoriaId, categoriaProduto),
          with: {
            provedor: true,
            transportadora: {
              with: {
                provedor: true,
              },
            },
            servico: {
              with: {
                provedor: true,
                transportadora: true,
              },
            },
          },
        })
      : [],
    tiposLogisticosIds.length > 0
      ? db.query.regrasTiposLogisticosFreteTable.findMany({
          where: inArray(
            regrasTiposLogisticosFreteTable.tipoLogisticoId,
            tiposLogisticosIds,
          ),
          with: {
            tipoLogistico: true,
            provedor: true,
            transportadora: {
              with: {
                provedor: true,
              },
            },
            servico: {
              with: {
                provedor: true,
                transportadora: true,
              },
            },
          },
        })
      : [],
  ]);

  return mapearDisponibilidadeFreteProduto({
    produtoId,
    varianteId,
    categoriaId: categoriaProduto,
    tiposLogisticosIdentificadores,
    provedores,
    transportadoras,
    servicos,
    regrasProdutos,
    regrasCategorias,
    regrasTiposLogisticos,
  });
}
