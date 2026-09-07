import type { StatusFornecedorPedidoIntegracao } from "@/db/schema";

import type { AmbienteLaquila } from "./ambiente-laquila";
import type {
  CorpoInserirPedidoLaquila,
  ResultadoChamadaLaquila,
} from "./cliente-laquila";
import { decidirExecucaoPedidoLaquila } from "./decidir-execucao-pedido-laquila";
import type { PedidoLaquilaSemCredenciais } from "./montar-pedido-laquila";
import {
  resumirConsultaPedidoLaquila,
  type ResumoConsultaPedidoLaquila,
} from "./resumir-consulta-pedido-laquila";
import type { ResultadoRevalidacaoEstoqueLaquila } from "./revalidar-estoque-pedido-laquila";

export type GrupoPedidoLaquilaPreparado = {
  pedidoId: string;
  fornecedorId: string;
  ambiente: AmbienteLaquila;
  chaveGrupo: string;
  chaveIdempotencia: string;
  hashPayload: string;
  payloadSanitizado: Record<string, unknown>;
  pedidoSemCredenciais: PedidoLaquilaSemCredenciais;
  credenciais: {
    cnpjEmpresa: string;
    tokenCliente: string;
    configuracao: {
      id: string;
      ambiente: AmbienteLaquila;
      urlBase: string | null;
      cnpjEmpresa: string;
    };
  };
};

export type RegistroPedidoLaquila = {
  id: string;
  status: StatusFornecedorPedidoIntegracao;
  hashPayload: string;
  tentativas: number;
  idPedidoExterno?: string | null;
  erroSanitizado?: string | null;
  payloadSanitizado?: Record<string, unknown>;
  [chave: string]: unknown;
};

export type RepositorioPedidoLaquila = {
  persistirPendente(grupo: GrupoPedidoLaquilaPreparado): Promise<void>;
  buscar(grupo: GrupoPedidoLaquilaPreparado): Promise<RegistroPedidoLaquila>;
  adquirir(
    registro: RegistroPedidoLaquila,
    hashAtual: string,
  ): Promise<RegistroPedidoLaquila | null>;
  registrarTentativa(id: string): Promise<RegistroPedidoLaquila>;
  finalizar(
    id: string,
    atualizacao: {
      status: StatusFornecedorPedidoIntegracao;
      idPedidoExterno?: string;
      erroSanitizado?: string;
    },
  ): Promise<RegistroPedidoLaquila>;
  registrarConsulta(
    id: string,
    resumo: ResumoConsultaPedidoLaquila,
  ): Promise<RegistroPedidoLaquila>;
};

export type DependenciasProcessamentoPedidoLaquila = {
  repositorio: RepositorioPedidoLaquila;
  revalidarEstoque(
    grupo: GrupoPedidoLaquilaPreparado,
  ): Promise<ResultadoRevalidacaoEstoqueLaquila>;
  enviarPedido(
    grupo: GrupoPedidoLaquilaPreparado,
    corpo: CorpoInserirPedidoLaquila,
  ): Promise<ResultadoChamadaLaquila>;
  consultarPedido(
    grupo: GrupoPedidoLaquilaPreparado,
    idPedidoExterno: string,
  ): Promise<ResultadoChamadaLaquila>;
};

export type OpcoesProcessamentoPedidoLaquila = {
  /** Somente uma ação administrativa consciente pode repetir um POST já tentado. */
  permitirReprocessarFalhaComTentativa?: boolean;
};

function extrairIdPedidoExterno(valor: unknown): string | null {
  const fila: unknown[] = [valor];
  while (fila.length > 0) {
    const atual = fila.shift();
    if (!atual || typeof atual !== "object") continue;
    for (const [chave, item] of Object.entries(
      atual as Record<string, unknown>,
    )) {
      if (chave.toLowerCase() === "id_pedido" && item != null) {
        const id = String(item).trim();
        if (id) return id;
      }
      if (typeof item === "object" && item) fila.push(item);
    }
  }
  return null;
}

function sanitizarErro(mensagem: string) {
  return mensagem
    .replace(/\b\d{11,14}\b/gu, "[documento-removido]")
    .slice(0, 500);
}

function resultadoIndeterminado(resposta: ResultadoChamadaLaquila) {
  return (
    !resposta.sucesso &&
    (resposta.diagnostico?.tipo === "timeout" ||
      resposta.diagnostico?.tipo === "rede" ||
      resposta.diagnostico?.tipo === "json_invalido" ||
      (resposta.codigoHttp !== null && resposta.codigoHttp >= 500))
  );
}

async function confirmarPedidoCriado(
  grupo: GrupoPedidoLaquilaPreparado,
  registro: RegistroPedidoLaquila,
  dependencias: DependenciasProcessamentoPedidoLaquila,
) {
  const idPedidoExterno = registro.idPedidoExterno?.trim();
  if (registro.status !== "criado" || !idPedidoExterno) return registro;

  const consultaAnterior = registro.payloadSanitizado?.consulta00008;
  if (
    consultaAnterior &&
    typeof consultaAnterior === "object" &&
    "sucesso" in consultaAnterior &&
    consultaAnterior.sucesso === true &&
    "pedidoEncontrado" in consultaAnterior &&
    consultaAnterior.pedidoEncontrado === true
  ) {
    return registro;
  }

  const resposta = await dependencias.consultarPedido(grupo, idPedidoExterno);
  const resumo = resumirConsultaPedidoLaquila({
    resposta,
    idPedido: idPedidoExterno,
  });

  return dependencias.repositorio.registrarConsulta(registro.id, resumo);
}

/** Produção injeta banco/HTTP reais; testes usam fakes sem flag pública. */
export async function processarGruposPedidoLaquila(
  grupos: readonly GrupoPedidoLaquilaPreparado[],
  dependencias: DependenciasProcessamentoPedidoLaquila,
  opcoes: OpcoesProcessamentoPedidoLaquila = {},
) {
  const resultados: RegistroPedidoLaquila[] = [];

  for (const grupo of grupos) {
    await dependencias.repositorio.persistirPendente(grupo);
    const registro = await dependencias.repositorio.buscar(grupo);
    const decisao = decidirExecucaoPedidoLaquila({
      status: registro.status,
      hashPersistido: registro.hashPayload,
      hashAtual: grupo.hashPayload,
    });
    if (decisao === "hash_divergente") {
      throw new Error("Payload Laquila divergiu após a preparação inicial.");
    }
    if (decisao === "reutilizar") {
      resultados.push(
        await confirmarPedidoCriado(grupo, registro, dependencias),
      );
      continue;
    }
    if (
      registro.status === "falha" &&
      registro.tentativas > 0 &&
      !opcoes.permitirReprocessarFalhaComTentativa
    ) {
      resultados.push(registro);
      continue;
    }

    const adquirido = await dependencias.repositorio.adquirir(
      registro,
      grupo.hashPayload,
    );
    if (!adquirido) {
      resultados.push(await dependencias.repositorio.buscar(grupo));
      continue;
    }

    const estoque = await dependencias.revalidarEstoque(grupo);
    if (!estoque.sucesso) {
      resultados.push(
        await dependencias.repositorio.finalizar(adquirido.id, {
          status: "falha",
          erroSanitizado: sanitizarErro(estoque.erro),
        }),
      );
      continue;
    }

    await dependencias.repositorio.registrarTentativa(adquirido.id);
    const resposta = await dependencias.enviarPedido(grupo, {
      pedido: {
        cnpj_empresa: grupo.credenciais.cnpjEmpresa,
        token: grupo.credenciais.tokenCliente,
        ...grupo.pedidoSemCredenciais,
      },
    });
    if (resposta.sucesso) {
      const idPedidoExterno = extrairIdPedidoExterno(resposta.dados);
      if (idPedidoExterno) {
        const criado = await dependencias.repositorio.finalizar(adquirido.id, {
          status: "criado",
          idPedidoExterno,
        });
        resultados.push(
          await confirmarPedidoCriado(grupo, criado, dependencias),
        );
        continue;
      }
    }

    const erro = resposta.sucesso
      ? "Resposta Laquila sem id_pedido válido."
      : resposta.erro;
    resultados.push(
      await dependencias.repositorio.finalizar(adquirido.id, {
        status: resultadoIndeterminado(resposta)
          ? "resultado_indeterminado"
          : "falha",
        erroSanitizado: sanitizarErro(erro),
      }),
    );
  }

  return resultados;
}
