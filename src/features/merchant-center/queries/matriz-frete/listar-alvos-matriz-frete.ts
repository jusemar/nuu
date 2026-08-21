import "server-only";

import { and, asc, desc, eq, gte, ilike, lte } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegionCepRanges,
  shippingZipAddresses,
} from "@/db/schema";

import type {
  AlvoMatrizFreteMerchant,
  EnderecoAmostraFreteMerchant,
} from "../../types/matriz-frete-merchant";

function mapearEndereco(endereco: typeof shippingZipAddresses.$inferSelect) {
  return {
    cep: endereco.cep,
    logradouro: endereco.street,
    bairro: endereco.neighborhood,
    cidade: endereco.city,
    uf: endereco.state,
  } satisfies EnderecoAmostraFreteMerchant;
}

function semDuplicatas(enderecos: EnderecoAmostraFreteMerchant[]) {
  return [...new Map(enderecos.map((item) => [item.cep, item])).values()];
}

async function amostrarFaixa(faixa: {
  cepStart: string;
  cepEnd: string;
  region: { city: string; state: string };
}) {
  const filtro = and(
    gte(shippingZipAddresses.cep, faixa.cepStart),
    lte(shippingZipAddresses.cep, faixa.cepEnd),
    eq(shippingZipAddresses.city, faixa.region.city),
    eq(shippingZipAddresses.state, faixa.region.state),
  );
  const [primeiro, ultimo] = await Promise.all([
    db.query.shippingZipAddresses.findFirst({
      where: filtro,
      orderBy: [asc(shippingZipAddresses.cep)],
    }),
    db.query.shippingZipAddresses.findFirst({
      where: filtro,
      orderBy: [desc(shippingZipAddresses.cep)],
    }),
  ]);
  if (!primeiro || !ultimo) return [];

  const meioNumerico = Math.floor(
    (Number(primeiro.cep) + Number(ultimo.cep)) / 2,
  )
    .toString()
    .padStart(8, "0");
  const meio = await db.query.shippingZipAddresses.findFirst({
    where: and(filtro, gte(shippingZipAddresses.cep, meioNumerico)),
    orderBy: [asc(shippingZipAddresses.cep)],
  });
  return semDuplicatas(
    [primeiro, meio, ultimo]
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map(mapearEndereco),
  );
}

export async function listarAlvosMatrizFreteMerchant(maximoAlvos: number) {
  const [faixas, bairros, ceps] = await Promise.all([
    db.query.shippingRegionCepRanges.findMany({
      where: eq(shippingRegionCepRanges.isActive, true),
      with: { region: true },
      orderBy: [asc(shippingRegionCepRanges.cepStart)],
    }),
    db.query.bairrosAvulsos.findMany({
      where: eq(bairrosAvulsos.isActive, true),
      orderBy: [asc(bairrosAvulsos.state), asc(bairrosAvulsos.city)],
    }),
    db.query.cepsEspecificos.findMany({
      where: eq(cepsEspecificos.isActive, true),
      orderBy: [asc(cepsEspecificos.cep)],
    }),
  ]);

  const quantidadeTotal =
    faixas.filter((item) => item.region?.isActive).length +
    bairros.length +
    ceps.length;
  const alvos: AlvoMatrizFreteMerchant[] = [];

  for (const faixa of faixas.filter((item) => item.region?.isActive)) {
    if (alvos.length >= maximoAlvos) break;
    const amostras = await amostrarFaixa({
      cepStart: faixa.cepStart,
      cepEnd: faixa.cepEnd,
      region: faixa.region,
    });
    alvos.push({
      id: `faixa-regiao:${faixa.id}`,
      tipo: "faixa-regiao",
      nome: `${faixa.region.name} (${faixa.cepStart}-${faixa.cepEnd})`,
      amostras,
      ...(amostras.length === 0
        ? { motivoSemAmostra: "Faixa sem endereço no cadastro local de CEPs." }
        : {}),
    });
  }

  for (const bairro of bairros) {
    if (alvos.length >= maximoAlvos) break;
    const endereco = await db.query.shippingZipAddresses.findFirst({
      where: and(
        ilike(shippingZipAddresses.neighborhood, bairro.neighborhood),
        ilike(shippingZipAddresses.city, bairro.city),
        eq(shippingZipAddresses.state, bairro.state),
      ),
      orderBy: [asc(shippingZipAddresses.cep)],
    });
    alvos.push({
      id: `bairro-avulso:${bairro.id}`,
      tipo: "bairro-avulso",
      nome: `${bairro.neighborhood}, ${bairro.city}/${bairro.state}`,
      amostras: endereco ? [mapearEndereco(endereco)] : [],
      ...(!endereco
        ? { motivoSemAmostra: "Bairro sem endereço no cadastro local de CEPs." }
        : {}),
    });
  }

  for (const cep of ceps) {
    if (alvos.length >= maximoAlvos) break;
    alvos.push({
      id: `cep-especifico:${cep.id}`,
      tipo: "cep-especifico",
      nome: `${cep.cep} - ${cep.neighborhood}, ${cep.city}/${cep.state}`,
      amostras: [
        {
          cep: cep.cep,
          logradouro: "",
          bairro: cep.neighborhood,
          cidade: cep.city,
          uf: cep.state,
        },
      ],
    });
  }

  return { alvos, quantidadeTotal };
}
