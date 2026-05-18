"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  enderecosClientesTable,
  perfisClientesTable,
  userTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  limparSomenteDigitos,
  normalizarDataNascimento,
  normalizarEstadoUf,
  normalizarTextoObrigatorio,
} from "../../lib/normalizar-cadastro-cliente";
import { buscarSessaoCliente } from "../../queries/sessao/buscar-sessao-cliente";
import {
  completarCadastroClienteSchema,
  type CompletarCadastroClienteSchema,
} from "../../schemas/cadastro-cliente.schema";

export type EstadoSalvarCadastroCliente = {
  sucesso: boolean;
  mensagem: string | null;
};

export async function salvarCadastroCliente(
  dados: CompletarCadastroClienteSchema,
): Promise<EstadoSalvarCadastroCliente> {
  const sessao = await buscarSessaoCliente();

  if (!sessao) {
    return {
      sucesso: false,
      mensagem: "Entre com sua conta Google para completar o cadastro.",
    };
  }

  const validacao = completarCadastroClienteSchema.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const cadastro = validacao.data;
  const documento = limparSomenteDigitos(cadastro.documento);
  const telefone = limparSomenteDigitos(cadastro.telefone);
  const cep = limparSomenteDigitos(cadastro.cep);
  const agora = new Date();

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      const documentoEmUso = await tx.query.perfisClientesTable.findFirst({
        where: and(
          eq(perfisClientesTable.documento, documento),
          ne(perfisClientesTable.userId, sessao.usuario.id),
        ),
      });

      if (documentoEmUso) {
        return {
          sucesso: false,
          mensagem: "Este CPF/CNPJ já está vinculado a outra conta.",
        };
      }

      const perfilExistente = await tx.query.perfisClientesTable.findFirst({
        where: eq(perfisClientesTable.userId, sessao.usuario.id),
      });

      const dadosPerfil = {
        tipoPessoa: cadastro.tipoPessoa,
        nomeCompleto: normalizarTextoObrigatorio(cadastro.nomeCompleto),
        documento,
        telefone,
        dataNascimento: normalizarDataNascimento(cadastro.dataNascimento),
        observacaoCliente: cadastro.observacaoCliente?.trim() || null,
        perfilCompleto: true,
        updatedAt: agora,
      };

      const perfil = perfilExistente
        ? (
            await tx
              .update(perfisClientesTable)
              .set(dadosPerfil)
              .where(eq(perfisClientesTable.id, perfilExistente.id))
              .returning()
          )[0]
        : (
            await tx
              .insert(perfisClientesTable)
              .values({
                userId: sessao.usuario.id,
                ...dadosPerfil,
              })
              .returning()
          )[0];

      if (!perfil) {
        return {
          sucesso: false,
          mensagem: "Não foi possível salvar o perfil do cliente.",
        };
      }

      const enderecoExistente = await tx.query.enderecosClientesTable.findFirst(
        {
          where: eq(enderecosClientesTable.perfilClienteId, perfil.id),
        },
      );

      const dadosEndereco = {
        cep,
        rua: normalizarTextoObrigatorio(cadastro.rua),
        numero: normalizarTextoObrigatorio(cadastro.numero),
        complemento: cadastro.complemento?.trim() || null,
        bairro: normalizarTextoObrigatorio(cadastro.bairro),
        cidade: normalizarTextoObrigatorio(cadastro.cidade),
        estado: normalizarEstadoUf(cadastro.estado),
        autorizarEntregaVizinho: Boolean(cadastro.autorizarEntregaVizinho),
        nomeVizinho: cadastro.autorizarEntregaVizinho
          ? cadastro.nomeVizinho?.trim() || null
          : null,
        observacaoVizinho: cadastro.autorizarEntregaVizinho
          ? cadastro.observacaoVizinho?.trim() || null
          : null,
        principal: true,
        updatedAt: agora,
      };

      if (enderecoExistente) {
        await tx
          .update(enderecosClientesTable)
          .set(dadosEndereco)
          .where(eq(enderecosClientesTable.id, enderecoExistente.id));
      } else {
        await tx.insert(enderecosClientesTable).values({
          userId: sessao.usuario.id,
          perfilClienteId: perfil.id,
          ...dadosEndereco,
        });
      }

      await tx
        .update(userTable)
        .set({
          name: dadosPerfil.nomeCompleto,
          updatedAt: agora,
        })
        .where(eq(userTable.id, sessao.usuario.id));

      return {
        sucesso: true,
        mensagem: "Cadastro completo salvo com sucesso.",
      };
    });

    if (resultado.sucesso) {
      revalidatePath("/completar-cadastro");
      revalidatePath("/minha-conta");
      revalidatePath("/checkout");
    }

    return resultado;
  } catch (error) {
    console.error("Erro ao salvar cadastro completo do cliente.", {
      usuarioId: sessao.usuario.id,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      mensagem: "Não foi possível salvar o cadastro. Tente novamente.",
    };
  }
}
