"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  cepsEspecificos,
  politicasEntregaPropriaTable,
  precosPoliticasEntregaPropriaTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

const CAMINHO = "/admin/logistics/entrega-propria/politicas";

function texto(formData: FormData, chave: string) {
  return String(formData.get(chave) ?? "").trim();
}

function inteiroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0) {
    throw new Error("Informe um número inteiro não negativo.");
  }
  return numero;
}

function precoEmCentavos(valor: string) {
  if (!valor) return null;
  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error("Informe um preço válido.");
  }
  return Math.round(numero * 100);
}

export async function salvarPoliticaEntregaPropria(formData: FormData) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const escopo = texto(formData, "escopo");
  const alvoId = texto(formData, "alvoId");
  if ((escopo !== "produto" && escopo !== "categoria") || !alvoId) {
    throw new Error("Informe um escopo e um produto ou categoria.");
  }
  const diasAtendidos = formData
    .getAll("diasAtendidos")
    .map(Number)
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6);
  const entregaRapidaAtiva = formData.get("entregaRapidaAtiva") === "on";
  const entregaProgramadaAtiva =
    formData.get("entregaProgramadaAtiva") === "on";
  if (
    (entregaRapidaAtiva || entregaProgramadaAtiva) &&
    diasAtendidos.length === 0
  ) {
    throw new Error("Selecione ao menos um dia atendido.");
  }
  const horarioCorte = texto(formData, "horarioCorte") || null;
  if (
    entregaRapidaAtiva &&
    (!horarioCorte || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horarioCorte))
  ) {
    throw new Error(
      "Informe um horário de corte válido para a entrega rápida.",
    );
  }
  const prazoMinimoProgramadaDias = inteiroOpcional(
    texto(formData, "prazoMinimoProgramadaDias"),
  );
  if (entregaProgramadaAtiva && prazoMinimoProgramadaDias === null) {
    throw new Error("Informe o prazo mínimo da entrega programada.");
  }
  const valores = {
    escopo: escopo as "produto" | "categoria",
    produtoId: escopo === "produto" ? alvoId : null,
    categoriaId: escopo === "categoria" ? alvoId : null,
    incluirDescendentes:
      escopo === "categoria" && formData.get("incluirDescendentes") === "on",
    ativa: formData.get("ativa") === "on",
    entregaRapidaAtiva,
    entregaProgramadaAtiva,
    diasAtendidos: [...new Set(diasAtendidos)].sort(),
    horarioCorte,
    prazoMinimoProgramadaDias,
    permiteRetirada:
      formData.get("configurarRetirada") === "on"
        ? formData.get("permiteRetirada") === "on"
        : null,
    modeloRetiradaId: texto(formData, "modeloRetiradaId") || null,
    updatedAt: new Date(),
  };
  if (valores.permiteRetirada && !valores.modeloRetiradaId) {
    throw new Error("Selecione um modelo para permitir retirada pela política.");
  }
  const existente = await db.query.politicasEntregaPropriaTable.findFirst({
    where:
      escopo === "produto"
        ? and(
            eq(politicasEntregaPropriaTable.escopo, "produto"),
            eq(politicasEntregaPropriaTable.produtoId, alvoId),
          )
        : and(
            eq(politicasEntregaPropriaTable.escopo, "categoria"),
            eq(politicasEntregaPropriaTable.categoriaId, alvoId),
          ),
  });
  if (existente) {
    await db
      .update(politicasEntregaPropriaTable)
      .set(valores)
      .where(eq(politicasEntregaPropriaTable.id, existente.id));
  } else {
    await db.insert(politicasEntregaPropriaTable).values(valores);
  }
  revalidatePath(CAMINHO);
}

export async function adicionarPrecoPoliticaEntregaPropria(formData: FormData) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const politicaId = texto(formData, "politicaId");
  const tipoDestino = texto(formData, "tipoDestino") as
    | "cep"
    | "bairro"
    | "regiao"
    | "cidade"
    | "uf";
  const referencia = texto(formData, "referencia");
  if (
    !politicaId ||
    !["cep", "bairro", "regiao", "cidade", "uf"].includes(tipoDestino)
  ) {
    throw new Error("Informe a política e o tipo de destino.");
  }
  let destinoId: number | null = null;
  if (tipoDestino === "cep") {
    const cep = await db.query.cepsEspecificos.findFirst({
      where: eq(cepsEspecificos.cep, referencia.replace(/\D/g, "")),
    });
    destinoId = cep?.id ?? null;
  } else if (tipoDestino !== "uf") {
    destinoId = Number(referencia);
  }
  if (tipoDestino !== "uf" && (!destinoId || !Number.isInteger(destinoId))) {
    throw new Error("Destino não encontrado na cobertura de Entrega Própria.");
  }
  const rapida = precoEmCentavos(texto(formData, "precoRapida"));
  const programada = precoEmCentavos(texto(formData, "precoProgramada"));
  if (rapida === null && programada === null) {
    throw new Error("Informe ao menos um preço de modalidade.");
  }
  const destinoWhere =
    tipoDestino === "cep"
      ? eq(precosPoliticasEntregaPropriaTable.cepEspecificoId, destinoId!)
      : tipoDestino === "bairro"
        ? eq(precosPoliticasEntregaPropriaTable.bairroAvulsoId, destinoId!)
        : tipoDestino === "regiao"
          ? eq(precosPoliticasEntregaPropriaTable.regiaoId, destinoId!)
          : tipoDestino === "cidade"
            ? eq(precosPoliticasEntregaPropriaTable.cidadeId, destinoId!)
            : eq(
                precosPoliticasEntregaPropriaTable.uf,
                referencia.toUpperCase(),
              );
  const existente = await db.query.precosPoliticasEntregaPropriaTable.findFirst(
    {
      where: and(
        eq(precosPoliticasEntregaPropriaTable.politicaId, politicaId),
        eq(precosPoliticasEntregaPropriaTable.tipoDestino, tipoDestino),
        destinoWhere,
      ),
    },
  );
  const valores = {
    politicaId,
    tipoDestino,
    cepEspecificoId: tipoDestino === "cep" ? destinoId : null,
    bairroAvulsoId: tipoDestino === "bairro" ? destinoId : null,
    regiaoId: tipoDestino === "regiao" ? destinoId : null,
    cidadeId: tipoDestino === "cidade" ? destinoId : null,
    uf: tipoDestino === "uf" ? referencia.toUpperCase() : null,
    precoRapidaEmCentavos: rapida,
    precoProgramadaEmCentavos: programada,
    updatedAt: new Date(),
  };
  if (existente) {
    await db
      .update(precosPoliticasEntregaPropriaTable)
      .set(valores)
      .where(eq(precosPoliticasEntregaPropriaTable.id, existente.id));
  } else {
    await db.insert(precosPoliticasEntregaPropriaTable).values(valores);
  }
  revalidatePath(CAMINHO);
}

export async function excluirPrecoPoliticaEntregaPropria(formData: FormData) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const id = texto(formData, "id");
  if (!id) throw new Error("Preço não informado.");
  await db
    .delete(precosPoliticasEntregaPropriaTable)
    .where(eq(precosPoliticasEntregaPropriaTable.id, id));
  revalidatePath(CAMINHO);
}
