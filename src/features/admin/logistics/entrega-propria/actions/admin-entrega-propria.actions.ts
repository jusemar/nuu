"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/connection";
import {
  bairrosAvulsos,
  regioBairros,
  productOwnDeliveryPrices,
  shippingPendingNeighborhoods,
  shippingRegionCepRanges,
  shippingRegions,
  shippingZipAddresses,
} from "@/db/table/logistics/entrega-propria";
import { fetchAddressByCep } from "@/features/admin/logistics/entrega-propria/services/viaCepService";
import { gerarFaixasContiguasDeCeps } from "../lib/cep-ranges";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { ProductOwnDeliveryPriceFormItem } from "../types/shipping";

function revalidarEntregaPropria() {
  revalidatePath("/admin/logistics/entrega-propria");
  revalidatePath("/admin/logistics/entrega-propria/cidades");
  revalidatePath("/admin/logistics/entrega-propria/regioes");
}

function revalidarProdutoComEntregaPropria(productId: string) {
  try {
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);
  } catch (error) {
    console.warn("Nao foi possivel revalidar produto com entrega:", error);
  }
}

async function buscarRegiaoObrigatoria(regiaoId: number) {
  const regiao = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, regiaoId),
  });

  if (!regiao) {
    throw new Error("Região não encontrada.");
  }

  return regiao;
}

async function bairroJaVinculadoNaCidade(
  state: string,
  city: string,
  neighborhood: string,
) {
  const existente = await db
    .select({ id: regioBairros.id })
    .from(regioBairros)
    .innerJoin(shippingRegions, eq(regioBairros.regiaoId, shippingRegions.id))
    .where(
      and(
        eq(shippingRegions.state, state),
        eq(shippingRegions.city, city),
        eq(regioBairros.neighborhood, neighborhood),
      ),
    )
    .limit(1);

  return existente.length > 0;
}

export async function criarRegiaoEntregaPropria(data: {
  name: string;
  description?: string;
  city: string;
  state: string;
}) {
  const nome = data.name.trim();
  const cidade = data.city.trim();
  const uf = data.state.trim().toUpperCase();

  if (!nome || !cidade || uf.length !== 2) {
    throw new Error("Informe nome, cidade e UF para criar a região.");
  }

  const [regiao] = await db
    .insert(shippingRegions)
    .values({
      name: nome,
      description: data.description?.trim() || null,
      city: cidade,
      state: uf,
      baseShippingPrice: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidarEntregaPropria();
  return regiao;
}

export async function atualizarRegiaoEntregaPropria(
  id: number,
  data: {
    name: string;
    description?: string;
  },
) {
  const nome = data.name.trim();

  if (!nome) {
    throw new Error("Informe o nome da região.");
  }

  await db
    .update(shippingRegions)
    .set({
      name: nome,
      description: data.description?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(shippingRegions.id, id));

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${id}`);
}

export async function alternarStatusRegiaoEntregaPropria(id: number) {
  const regiao = await buscarRegiaoObrigatoria(id);

  await db
    .update(shippingRegions)
    .set({
      isActive: !regiao.isActive,
      updatedAt: new Date(),
    })
    .where(eq(shippingRegions.id, id));

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${id}`);
}

export async function adicionarBairroNaRegiaoEntregaPropria(
  regiaoId: number,
  neighborhood: string,
) {
  const bairro = neighborhood.trim();

  if (!bairro) {
    throw new Error("Informe o nome do bairro.");
  }

  const regiao = await buscarRegiaoObrigatoria(regiaoId);
  const vinculadoNaCidade = await bairroJaVinculadoNaCidade(
    regiao.state,
    regiao.city,
    bairro,
  );

  if (vinculadoNaCidade) {
    throw new Error("Este bairro ja esta vinculado a uma regiao da cidade.");
  }

  const existente = await db.query.regioBairros.findFirst({
    where: and(
      eq(regioBairros.regiaoId, regiaoId),
      eq(regioBairros.neighborhood, bairro),
    ),
  });

  if (existente) {
    throw new Error("Este bairro ja esta vinculado a regiao.");
  }

  await db.insert(regioBairros).values({
    regiaoId,
    neighborhood: bairro,
  });

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${regiaoId}`);
}

export async function adicionarBairroDaBaseNaRegiaoEntregaPropria(
  regiaoId: number,
  neighborhood: string,
) {
  const regiao = await buscarRegiaoObrigatoria(regiaoId);
  const bairro = neighborhood.trim();

  if (!bairro) {
    throw new Error("Selecione um bairro da base de CEPs.");
  }

  const existeNaBase = await db.query.shippingZipAddresses.findFirst({
    where: and(
      eq(shippingZipAddresses.state, regiao.state),
      eq(shippingZipAddresses.city, regiao.city),
      eq(shippingZipAddresses.neighborhood, bairro),
    ),
    columns: {
      id: true,
    },
  });

  if (!existeNaBase) {
    throw new Error("Este bairro nao existe na base local de CEPs da cidade.");
  }

  await adicionarBairroNaRegiaoEntregaPropria(regiaoId, bairro);
  await gerarFaixasCepRegiaoEntregaPropria(regiaoId);
}

export async function adicionarBairroPorCepNaRegiaoEntregaPropria(
  regiaoId: number,
  cep: string,
) {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    throw new Error("Informe um CEP valido com 8 digitos.");
  }

  const enderecoLocal = await db.query.shippingZipAddresses.findFirst({
    where: eq(shippingZipAddresses.cep, cleanCep),
  });
  const endereco = enderecoLocal
    ? {
        bairro: enderecoLocal.neighborhood,
        localidade: enderecoLocal.city,
        uf: enderecoLocal.state,
      }
    : await fetchAddressByCep(cleanCep);

  if (!endereco?.bairro || !endereco.localidade || !endereco.uf) {
    throw new Error(
      "Nao foi possivel encontrar bairro, cidade e UF no ViaCEP.",
    );
  }

  const regiao = await buscarRegiaoObrigatoria(regiaoId);

  if (
    regiao.city !== endereco.localidade ||
    regiao.state !== endereco.uf.toUpperCase()
  ) {
    throw new Error(
      "O CEP informado pertence a outra cidade/UF e nao pode ser vinculado nesta regiao.",
    );
  }

  await adicionarBairroNaRegiaoEntregaPropria(regiaoId, endereco.bairro);

  await db
    .update(shippingPendingNeighborhoods)
    .set({
      status: "linked",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(shippingPendingNeighborhoods.neighborhood, endereco.bairro),
        eq(shippingPendingNeighborhoods.city, endereco.localidade),
        eq(shippingPendingNeighborhoods.state, endereco.uf.toUpperCase()),
        eq(shippingPendingNeighborhoods.status, "pending"),
      ),
    );

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${regiaoId}`);
}

export async function gerarFaixasCepRegiaoEntregaPropria(regiaoId: number) {
  const regiao = await buscarRegiaoObrigatoria(regiaoId);
  const bairros = await db.query.regioBairros.findMany({
    where: eq(regioBairros.regiaoId, regiaoId),
    columns: {
      neighborhood: true,
    },
  });

  const nomesBairros = bairros.map((bairro) => bairro.neighborhood);

  await db
    .delete(shippingRegionCepRanges)
    .where(
      and(
        eq(shippingRegionCepRanges.regionId, regiaoId),
        eq(shippingRegionCepRanges.source, "auto"),
      ),
    );

  if (nomesBairros.length === 0) {
    revalidarEntregaPropria();
    revalidatePath(`/admin/logistics/entrega-propria/regioes/${regiaoId}`);
    return;
  }

  const ceps = await db.query.shippingZipAddresses.findMany({
    where: and(
      eq(shippingZipAddresses.state, regiao.state),
      eq(shippingZipAddresses.city, regiao.city),
      inArray(shippingZipAddresses.neighborhood, nomesBairros),
    ),
    columns: {
      cep: true,
    },
  });

  const faixas = gerarFaixasContiguasDeCeps(ceps.map((item) => item.cep));

  if (faixas.length > 0) {
    const now = new Date();
    const values = faixas.map((faixa) => ({
      regionId: regiaoId,
      cepStart: faixa.cepStart,
      cepEnd: faixa.cepEnd,
      source: "auto",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    for (let index = 0; index < values.length; index += 500) {
      await db
        .insert(shippingRegionCepRanges)
        .values(values.slice(index, index + 500))
        .onConflictDoNothing();
    }
  }

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${regiaoId}`);
}

export async function adicionarFaixaCepRegiaoEntregaPropria(data: {
  regiaoId: number;
  cepStart: string;
  cepEnd: string;
}) {
  await buscarRegiaoObrigatoria(data.regiaoId);
  const cepStart = data.cepStart.replace(/\D/g, "");
  const cepEnd = data.cepEnd.replace(/\D/g, "");

  if (cepStart.length !== 8 || cepEnd.length !== 8 || cepStart > cepEnd) {
    throw new Error("Informe uma faixa de CEP valida.");
  }

  await db.insert(shippingRegionCepRanges).values({
    regionId: data.regiaoId,
    cepStart,
    cepEnd,
    source: "manual",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${data.regiaoId}`);
}

export async function removerFaixaCepRegiaoEntregaPropria(
  regiaoId: number,
  rangeId: number,
) {
  await db
    .delete(shippingRegionCepRanges)
    .where(
      and(
        eq(shippingRegionCepRanges.regionId, regiaoId),
        eq(shippingRegionCepRanges.id, rangeId),
      ),
    );

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${regiaoId}`);
}

export async function registrarBairroPendenteEntregaPropria(data: {
  cep: string;
  neighborhood: string;
  city: string;
  state: string;
}) {
  const cleanCep = data.cep.replace(/\D/g, "");
  const neighborhood = data.neighborhood.trim();
  const city = data.city.trim();
  const state = data.state.trim().toUpperCase();

  if (!neighborhood || !city || state.length !== 2 || cleanCep.length !== 8) {
    return;
  }

  await db
    .insert(shippingPendingNeighborhoods)
    .values({
      lastCep: cleanCep,
      neighborhood,
      city,
      state,
      consultationCount: 1,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastConsultedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        shippingPendingNeighborhoods.neighborhood,
        shippingPendingNeighborhoods.city,
        shippingPendingNeighborhoods.state,
      ],
      set: {
        lastCep: cleanCep,
        status: "pending",
        consultationCount: sql`${shippingPendingNeighborhoods.consultationCount} + 1`,
        updatedAt: new Date(),
        lastConsultedAt: new Date(),
      },
    });

  revalidarEntregaPropria();
}

export async function vincularBairroPendenteNaRegiaoEntregaPropria(
  regiaoId: number,
  bairroPendenteId: number,
) {
  const bairroPendente = await db.query.shippingPendingNeighborhoods.findFirst({
    where: and(
      eq(shippingPendingNeighborhoods.id, bairroPendenteId),
      eq(shippingPendingNeighborhoods.status, "pending"),
    ),
  });

  if (!bairroPendente) {
    throw new Error("Bairro pendente nao encontrado.");
  }

  await adicionarBairroNaRegiaoEntregaPropria(
    regiaoId,
    bairroPendente.neighborhood,
  );

  await db
    .update(shippingPendingNeighborhoods)
    .set({
      status: "linked",
      updatedAt: new Date(),
    })
    .where(eq(shippingPendingNeighborhoods.id, bairroPendenteId));

  revalidarEntregaPropria();
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${regiaoId}`);
}

export async function cadastrarBairroPendenteComoAvulsoEntregaPropria(
  bairroPendenteId: number,
) {
  const bairroPendente = await db.query.shippingPendingNeighborhoods.findFirst({
    where: and(
      eq(shippingPendingNeighborhoods.id, bairroPendenteId),
      eq(shippingPendingNeighborhoods.status, "pending"),
    ),
  });

  if (!bairroPendente) {
    throw new Error("Bairro pendente nao encontrado.");
  }

  const existente = await db.query.bairrosAvulsos.findFirst({
    where: and(
      eq(bairrosAvulsos.neighborhood, bairroPendente.neighborhood),
      eq(bairrosAvulsos.city, bairroPendente.city),
      eq(bairrosAvulsos.state, bairroPendente.state),
    ),
  });

  if (!existente) {
    await db.insert(bairrosAvulsos).values({
      neighborhood: bairroPendente.neighborhood,
      city: bairroPendente.city,
      state: bairroPendente.state,
      baseShippingPrice: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db
    .update(shippingPendingNeighborhoods)
    .set({
      status: "registered",
      updatedAt: new Date(),
    })
    .where(eq(shippingPendingNeighborhoods.id, bairroPendenteId));

  revalidarEntregaPropria();
}

export async function ignorarBairroPendenteEntregaPropria(
  bairroPendenteId: number,
) {
  await db
    .update(shippingPendingNeighborhoods)
    .set({
      status: "ignored",
      updatedAt: new Date(),
    })
    .where(eq(shippingPendingNeighborhoods.id, bairroPendenteId));

  revalidarEntregaPropria();
}

function montarDestinoPrecoProduto(
  productId: string,
  item: ProductOwnDeliveryPriceFormItem,
) {
  return {
    productId,
    destinationType: item.destinationType,
    regionId: item.destinationType === "region" ? item.destinationId : null,
    bairroAvulsoId:
      item.destinationType === "bairro-avulso" ? item.destinationId : null,
    cepEspecificoId:
      item.destinationType === "cep-especifico" ? item.destinationId : null,
    shippingPrice: item.shippingPrice,
    deliveryDeadline: item.deliveryDeadline?.trim() || null,
    isActive: item.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function salvarPrecosEntregaPropriaProduto(
  productId: string,
  items: ProductOwnDeliveryPriceFormItem[] = [],
) {
  await db
    .delete(productOwnDeliveryPrices)
    .where(eq(productOwnDeliveryPrices.productId, productId));

  const entries = items
    .filter((item) => item.destinationId > 0 && item.shippingPrice >= 0)
    .map((item) => montarDestinoPrecoProduto(productId, item));

  if (entries.length > 0) {
    await db.insert(productOwnDeliveryPrices).values(entries);
  }

  revalidarProdutoComEntregaPropria(productId);
}

export async function removerBairroDaRegiaoEntregaPropria(
  regiaoId: number,
  bairroId: number,
) {
  await db
    .delete(regioBairros)
    .where(
      and(eq(regioBairros.regiaoId, regiaoId), eq(regioBairros.id, bairroId)),
    );

  revalidarEntregaPropria();
  await gerarFaixasCepRegiaoEntregaPropria(regiaoId);
  revalidatePath(`/admin/logistics/entrega-propria/regioes/${regiaoId}`);
}
