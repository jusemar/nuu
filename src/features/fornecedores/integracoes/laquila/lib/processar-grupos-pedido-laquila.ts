import type { StatusFornecedorPedidoIntegracao } from "@/db/schema";

import type { AmbienteLaquila } from "./ambiente-laquila";
import type {
  CorpoInserirPedidoLaquila,
  ResultadoChamadaLaquila,
} from "./cliente-laquila";
import { decidirExecucaoPedidoLaquila } from "./decidir-execucao-pedido-laquila";
import type { PedidoLaquilaSemCredenciais } from "./montar-pedido-laquila";
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

/** Produção injeta banco/HTTP reais; testes usam fakes sem flag pública. */
export async function processarGruposPedidoLaquila(
  grupos: readonly GrupoPedidoLaquilaPreparado[],
  dependencias: DependenciasProcessamentoPedidoLaquila,
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
        resultados.push(
          await dependencias.repositorio.finalizar(adquirido.id, {
            status: "criado",
            idPedidoExterno,
          }),
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
