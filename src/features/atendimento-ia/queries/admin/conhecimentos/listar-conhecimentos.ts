import "server-only";

import { count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaFragmentosInstitucionaisTable,
} from "@/db/schema";
import { userTable } from "@/db/tables/autenticacao";

import type { ConhecimentoInstitucionalDto } from "../../../types/admin/consultas";
import {
  criarPaginaAdmin,
  validarPaginacaoAdmin,
} from "../compartilhados/paginacao";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function listarConhecimentosAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const filtros = validarPaginacaoAdmin(entrada);
  const condicao = filtros.busca
    ? or(
        ilike(
          atendimentoIaDocumentosInstitucionaisTable.chaveEstavel,
          `%${filtros.busca}%`,
        ),
        ilike(
          atendimentoIaDocumentosInstitucionaisTable.categoria,
          `%${filtros.busca}%`,
        ),
        ilike(
          atendimentoIaDocumentosInstitucionaisTable.origem,
          `%${filtros.busca}%`,
        ),
        ilike(
          atendimentoIaDocumentosInstitucionaisTable.tituloAdministrativo,
          `%${filtros.busca}%`,
        ),
      )
    : undefined;
  const [totais, documentos] = await Promise.all([
    db
      .select({ total: count() })
      .from(atendimentoIaDocumentosInstitucionaisTable)
      .where(condicao),
    db
      .select({
        atualizadoEm: atendimentoIaDocumentosInstitucionaisTable.atualizadoEm,
        autor: userTable.name,
        categoria: atendimentoIaDocumentosInstitucionaisTable.categoria,
        chaveEstavel: atendimentoIaDocumentosInstitucionaisTable.chaveEstavel,
        id: atendimentoIaDocumentosInstitucionaisTable.id,
        origem: atendimentoIaDocumentosInstitucionaisTable.origem,
        situacao: atendimentoIaDocumentosInstitucionaisTable.situacao,
        tipoConhecimento:
          atendimentoIaDocumentosInstitucionaisTable.tipoConhecimento,
        tituloAdministrativo:
          atendimentoIaDocumentosInstitucionaisTable.tituloAdministrativo,
      })
      .from(atendimentoIaDocumentosInstitucionaisTable)
      .leftJoin(
        userTable,
        eq(
          atendimentoIaDocumentosInstitucionaisTable.criadoPorId,
          userTable.id,
        ),
      )
      .where(condicao)
      .orderBy(
        desc(atendimentoIaDocumentosInstitucionaisTable.atualizadoEm),
        desc(atendimentoIaDocumentosInstitucionaisTable.id),
      )
      .limit(filtros.limite)
      .offset(filtros.deslocamento),
  ]);
  const itens: ConhecimentoInstitucionalDto[] = await Promise.all(
    documentos.map(async (documento) => {
      const [versao] = await db
        .select({
          estado: atendimentoIaDocumentoVersoesTable.estado,
          id: atendimentoIaDocumentoVersoesTable.id,
          atualizadoEm: atendimentoIaDocumentoVersoesTable.atualizadoEm,
          statusIndexacao: atendimentoIaDocumentoVersoesTable.statusIndexacao,
          titulo: atendimentoIaDocumentoVersoesTable.titulo,
          versao: atendimentoIaDocumentoVersoesTable.versao,
        })
        .from(atendimentoIaDocumentoVersoesTable)
        .where(eq(atendimentoIaDocumentoVersoesTable.documentoId, documento.id))
        .orderBy(
          desc(atendimentoIaDocumentoVersoesTable.versao),
          desc(atendimentoIaDocumentoVersoesTable.id),
        )
        .limit(1);
      const [fragmentos] = versao
        ? await db
            .select({ total: count() })
            .from(atendimentoIaFragmentosInstitucionaisTable)
            .where(
              eq(
                atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
                versao.id,
              ),
            )
        : [{ total: 0 }];
      return {
        ...documento,
        atualizadoEm: documento.atualizadoEm.toISOString(),
        estado: versao?.estado ?? null,
        fragmentos: fragmentos.total,
        indexacao: versao?.statusIndexacao ?? null,
        publicado: versao?.estado === "publicado",
        titulo:
          documento.tituloAdministrativo ??
          versao?.titulo ??
          documento.chaveEstavel,
        versaoAtualAtualizadaEm: versao?.atualizadoEm.toISOString() ?? null,
        versaoAtualId: versao?.id ?? null,
        versaoAtual: versao?.versao ?? null,
      };
    }),
  );
  return criarPaginaAdmin(
    itens,
    totais[0]?.total ?? 0,
    filtros.pagina,
    filtros.limite,
  );
}
