import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type {
  ItemResumoCheckout,
  OpcaoEntregaCheckout,
  ResumoCheckoutCalculado,
  SelecaoEntregaGrupoCheckout,
} from "../../types/checkout.types";
import { listarEntregasDoSnapshot } from "./ler-snapshot-frete";
import { montarRegistroSnapshotFretePedido } from "./montar-registro-snapshot-frete-pedido";
import { montarSnapshotFretePorGrupos } from "./montar-snapshot-frete-por-grupos";

function criarItem(
  id: string,
  origemExpedicao: "loja" | "fornecedor",
): ItemResumoCheckout {
  return {
    id,
    produtoId: `produto-${id}`,
    produtoVarianteId: `variante-${id}`,
    quantidade: id === "fornecedor" ? 2 : 1,
    origemExpedicao,
    fornecedorProvedor: origemExpedicao === "fornecedor" ? "laquila" : null,
    necessitaEtiquetaFornecedor: origemExpedicao === "fornecedor",
  } as ItemResumoCheckout;
}

function criarOpcao({
  identificador,
  provedor,
  valorEmCentavos,
}: {
  identificador: string;
  provedor: string;
  valorEmCentavos: number;
}): OpcaoEntregaCheckout {
  return {
    identificador,
    nome: provedor === "retirada" ? "Cliente Retira" : identificador,
    descricao: provedor === "entrega-propria" ? "Entrega hoje" : null,
    prazoMinimoEmDiasUteis: provedor === "frenet" ? 3 : null,
    prazoMaximoEmDiasUteis: provedor === "frenet" ? 5 : null,
    valorEmCentavos,
    tipo: provedor === "retirada" ? "retirada" : "entrega",
    provedor,
    servico: identificador,
    transportadora: provedor === "frenet" ? "Correios" : null,
    metadadosRelevantes:
      provedor === "entrega-propria"
        ? { promessaEntregaPropria: { texto: "Entrega hoje" } }
        : null,
  };
}

function criarResumo({
  opcaoLoja = criarOpcao({
    identificador: "pac-loja",
    provedor: "frenet",
    valorEmCentavos: 1200,
  }),
  opcaoFornecedor = criarOpcao({
    identificador: "pac-fornecedor",
    provedor: "frenet",
    valorEmCentavos: 2150,
  }),
}: {
  opcaoLoja?: OpcaoEntregaCheckout;
  opcaoFornecedor?: OpcaoEntregaCheckout;
} = {}) {
  const itemLoja = criarItem("loja", "loja");
  const itemFornecedor = criarItem("fornecedor", "fornecedor");

  return {
    gruposLogisticos: [
      {
        chave: "expedicao:loja",
        origemExpedicao: "loja",
        fornecedorProvedor: null,
        necessitaEtiquetaFornecedor: false,
        itens: [itemLoja],
      },
      {
        chave: "expedicao:fornecedor:laquila",
        origemExpedicao: "fornecedor",
        fornecedorProvedor: "laquila",
        necessitaEtiquetaFornecedor: true,
        itens: [itemFornecedor],
      },
    ],
    cotacoesEntrega: [
      {
        chaveGrupo: "expedicao:loja",
        cepOrigem: "30668635",
        opcoes: [opcaoLoja],
        mensagemErro: null,
      },
      {
        chaveGrupo: "expedicao:fornecedor:laquila",
        cepOrigem: "83430000",
        opcoes: [opcaoFornecedor],
        mensagemErro: null,
      },
    ],
  } as ResumoCheckoutCalculado;
}

function selecionar(
  chaveGrupo: string,
  opcao: OpcaoEntregaCheckout,
  alteracoes: Partial<SelecaoEntregaGrupoCheckout> = {},
): SelecaoEntregaGrupoCheckout {
  return { ...opcao, chaveGrupo, cep: "30140071", ...alteracoes };
}

function montar(
  resumo = criarResumo(),
  selecoes = resumo.cotacoesEntrega.map((cotacao) =>
    selecionar(cotacao.chaveGrupo, cotacao.opcoes[0]!),
  ),
) {
  return montarSnapshotFretePorGrupos({
    resumoRevalidado: resumo,
    selecoesRecebidas: selecoes,
    cep: "30140071",
    itensPedido: [
      {
        itemCarrinhoId: "loja",
        produtoId: "produto-loja",
        varianteId: "variante-loja",
        quantidade: 1,
        valorUnitarioEmCentavos: 10000,
      },
      {
        itemCarrinhoId: "fornecedor",
        produtoId: "produto-fornecedor",
        varianteId: "variante-fornecedor",
        quantidade: 2,
        valorUnitarioEmCentavos: 20000,
      },
    ],
  });
}

descrever("snapshot definitivo de frete por grupos", () => {
  verificar("grava ambos os grupos, seus itens e a soma exata", () => {
    const resultado = montar();
    afirmacoes.equal(resultado.sucesso, true);
    if (!resultado.sucesso) return;

    afirmacoes.equal(resultado.snapshot.versao, "2");
    afirmacoes.equal(resultado.snapshot.grupos.length, 2);
    afirmacoes.deepEqual(
      resultado.snapshot.grupos.map((grupo) => grupo.cepOrigem),
      ["30668635", "83430000"],
    );
    afirmacoes.equal(resultado.snapshot.valorTotalEmCentavos, 3350);
    afirmacoes.deepEqual(
      resultado.snapshot.grupos.map((grupo) =>
        grupo.itens.map((item) => item.itemCarrinhoId),
      ),
      [["loja"], ["fornecedor"]],
    );
    afirmacoes.equal(resultado.snapshot.grupos[1]?.itens[0]?.quantidade, 2);
    afirmacoes.equal(
      resultado.snapshot.grupos[1]?.itens[0]?.valorUnitarioEmCentavos,
      20000,
    );
  });

  verificar("rejeita preço manipulado pelo cliente", () => {
    const resumo = criarResumo();
    const selecoes = resumo.cotacoesEntrega.map((cotacao) =>
      selecionar(cotacao.chaveGrupo, cotacao.opcoes[0]!, {
        valorEmCentavos: 1,
      }),
    );
    const resultado = montar(resumo, selecoes);
    afirmacoes.equal(resultado.sucesso, false);
  });

  verificar("nome e prazo finais sempre vêm da recotação do servidor", () => {
    const resumo = criarResumo();
    const selecoes = resumo.cotacoesEntrega.map((cotacao) =>
      selecionar(cotacao.chaveGrupo, cotacao.opcoes[0]!, {
        nome: "forjado",
        descricao: "agora",
      }),
    );
    const resultado = montar(resumo, selecoes);
    afirmacoes.equal(resultado.sucesso, true);
    if (!resultado.sucesso) return;
    afirmacoes.equal(
      resultado.snapshot.grupos[0]?.entrega.prazo,
      "3 a 5 dias uteis",
    );
  });

  verificar("rejeita serviço removido entre cotação e finalização", () => {
    const resumo = criarResumo();
    const selecoes = resumo.cotacoesEntrega.map((cotacao) =>
      selecionar(cotacao.chaveGrupo, cotacao.opcoes[0]!),
    );
    resumo.cotacoesEntrega[1]!.opcoes = [];
    afirmacoes.equal(montar(resumo, selecoes).sucesso, false);
  });

  verificar("rejeita CEP divergente, grupo ausente ou grupo novo", () => {
    const resumo = criarResumo();
    const selecoes = resumo.cotacoesEntrega.map((cotacao) =>
      selecionar(cotacao.chaveGrupo, cotacao.opcoes[0]!),
    );
    afirmacoes.equal(
      montar(resumo, [{ ...selecoes[0]!, cep: "01310100" }, selecoes[1]!])
        .sucesso,
      false,
    );
    afirmacoes.equal(montar(resumo, selecoes.slice(0, 1)).sucesso, false);
    afirmacoes.equal(
      montar(resumo, [
        ...selecoes,
        selecionar("grupo-novo", resumo.cotacoesEntrega[0]!.opcoes[0]!),
      ]).sucesso,
      false,
    );
  });

  verificar("representa Retirada somente no grupo loja", () => {
    const retirada = criarOpcao({
      identificador: "retirada-atual",
      provedor: "retirada",
      valorEmCentavos: 0,
    });
    const resultado = montar(criarResumo({ opcaoLoja: retirada }));
    afirmacoes.equal(resultado.sucesso, true);
    if (!resultado.sucesso) return;
    afirmacoes.equal(resultado.snapshot.grupos[0]?.entrega.tipo, "retirada");
    afirmacoes.equal(resultado.snapshot.grupos[0]?.entrega.valorEmCentavos, 0);
    afirmacoes.equal(resultado.snapshot.grupos[1]?.entrega.tipo, "entrega");
    afirmacoes.equal(resultado.snapshot.valorTotalEmCentavos, 2150);
  });

  verificar("preserva promessa de Entrega própria e auditoria Frenet", () => {
    const propria = criarOpcao({
      identificador: "entrega-programada",
      provedor: "entrega-propria",
      valorEmCentavos: 800,
    });
    const resultado = montar(criarResumo({ opcaoLoja: propria }));
    afirmacoes.equal(resultado.sucesso, true);
    if (!resultado.sucesso) return;
    afirmacoes.deepEqual(
      resultado.snapshot.grupos[0]?.entrega.metadadosRelevantes,
      { promessaEntregaPropria: { texto: "Entrega hoje" } },
    );
    afirmacoes.equal(
      resultado.snapshot.grupos[1]?.entrega.transportadora,
      "Correios",
    );
  });

  verificar(
    "leitor e persistência continuam aceitando snapshot versão 1",
    () => {
      const antigo = {
        versao: "1" as const,
        cep: "30140071",
        valorTotalEmCentavos: 1200,
        fallbackAcionado: false,
        itens: [
          {
            itemCarrinhoId: "antigo",
            produtoId: "produto-antigo",
            varianteId: null,
            provedor: "frenet",
            servico: "PAC",
            modalidade: "entrega",
            valorEmCentavos: 1200,
            prazo: "5 dias uteis",
            itensLogisticos: [],
            pacotes: [],
            metadataResumida: { transportadora: "Correios" },
            fallbackAcionado: false,
          },
        ],
      };
      afirmacoes.equal(listarEntregasDoSnapshot(antigo)[0]?.servico, "PAC");
      afirmacoes.equal(
        montarRegistroSnapshotFretePedido({
          pedidoId: "pedido",
          snapshot: antigo,
        }).provedorFrete,
        "frenet",
      );
    },
  );

  verificar("campos escalares do pedido resumem snapshot versão 2", () => {
    const resultado = montar();
    afirmacoes.equal(resultado.sucesso, true);
    if (!resultado.sucesso) return;
    const registro = montarRegistroSnapshotFretePedido({
      pedidoId: "pedido",
      snapshot: resultado.snapshot,
    });
    afirmacoes.equal(registro.provedorFrete, "frenet");
    afirmacoes.equal(registro.valorFreteEmCentavos, 3350);
    afirmacoes.equal(registro.metadata.snapshotFreteVersao, "2");
  });
});
