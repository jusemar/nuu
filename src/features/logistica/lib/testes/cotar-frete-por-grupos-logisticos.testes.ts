import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type {
  ItemLogistico,
  OpcaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import { cotarFreteInterno } from "../cotacoes/cotar-frete-interno";
import { cotarFretePorGruposLogisticos } from "../cotacoes/cotar-frete-por-grupos-logisticos";
import { agruparItensPorOrigemExpedicao } from "../grupos-logisticos/agrupar-itens-por-origem-expedicao";
import type { ConfiguracaoProvedorFreteFrenet } from "../provedores/criar-provedor-frete-frenet";
import { montarRequisicaoCotacaoFrenet } from "../provedores/frenet/consultar-cotacao-frenet";

const configuracaoFrenet = {
  token: "token-teste",
  cepOrigem: "30140071",
  urlCotacao: "https://frenet.exemplo/cotacao",
  timeoutEmMs: 50,
  ambiente: "teste" as const,
};

const configuracaoCotacao = {
  frenet: configuracaoFrenet,
  cepOrigemFornecedorPorProvedor: { laquila: "83430000" },
};

function criarItem(
  identificador: string,
  origemExpedicao: "loja" | "fornecedor",
  quantidade: number,
  varianteId: string,
): ItemLogistico {
  return {
    identificador,
    produtoId: `produto-${identificador}`,
    varianteId,
    nome: `Produto ${identificador}`,
    codigoSku: `SKU-${identificador}`,
    quantidade,
    pesoEmGramas: origemExpedicao === "loja" ? 500 : 1200,
    dimensoes: { alturaEmCm: 10, larguraEmCm: 20, comprimentoEmCm: 30 },
    valorDeclaradoEmCentavos: 2500,
    origemExpedicao,
    fornecedorProvedor: origemExpedicao === "loja" ? null : "laquila",
    necessitaEtiquetaFornecedor: origemExpedicao === "fornecedor",
  };
}

function criarSolicitacao(itens: ItemLogistico[]): SolicitacaoCotacaoFrete {
  return {
    identificador: "cotacao-carrinho",
    destino: { cep: "30140071", pais: "BR" },
    itens,
    pacotes: itens.map((item) => ({
      identificador: `pacote-${item.identificador}`,
      itens: [item],
      quantidadeVolumes: item.quantidade,
      pesoTotalEmGramas: item.pesoEmGramas * item.quantidade,
      dimensoes: item.dimensoes,
    })),
    gruposLogisticos: agruparItensPorOrigemExpedicao(itens),
    moeda: "BRL",
  };
}

function criarOpcaoFrenet(solicitacao: SolicitacaoCotacaoFrete): OpcaoFrete {
  return {
    identificador: `frenet:${solicitacao.identificador}:sedex`,
    provedor: "frenet",
    servico: "SEDEX",
    nome: "Sedex",
    tipo: "entrega",
    valorEmCentavos: 2490,
  };
}

function criarDependencias(registro: {
  entregas: string[];
  retiradas: string[];
  frenet: SolicitacaoCotacaoFrete[];
  origens?: string[];
  falharFrenetLaquila?: boolean;
}) {
  return {
    entregaPropriaAtual: {
      async consultarEntregaPropriaAtual(consulta: {
        produtoId: string;
        cep: string;
      }) {
        registro.entregas.push(consulta.produtoId);
        return { disponivel: true as const, valorEmCentavos: 1500 };
      },
    },
    retiradaAtual: {
      async listarRetiradasAtuais(solicitacao: SolicitacaoCotacaoFrete) {
        registro.retiradas.push(solicitacao.identificador);
        return [{ identificador: "loja", nome: "Retirada na loja" }];
      },
    },
    frenet: {
      async consultarCotacao(
        solicitacao: SolicitacaoCotacaoFrete,
        configuracaoAtual: ConfiguracaoProvedorFreteFrenet,
      ) {
        registro.frenet.push(solicitacao);
        registro.origens?.push(configuracaoAtual.cepOrigem);
        if (
          registro.falharFrenetLaquila &&
          solicitacao.itens[0]?.fornecedorProvedor === "laquila"
        ) {
          throw new Error("Frenet indisponivel para o grupo Laquila");
        }
        return { opcoes: [criarOpcaoFrenet(solicitacao)], avisos: [] };
      },
      registrarEvento() {},
    },
  };
}

descrever("cotacao interna por grupos logisticos", () => {
  verificar("mantem equivalente o carrinho somente loja", async () => {
    const solicitacao = criarSolicitacao([
      criarItem("loja", "loja", 2, "variante-loja"),
    ]);
    const registro = {
      entregas: [] as string[],
      retiradas: [] as string[],
      frenet: [] as SolicitacaoCotacaoFrete[],
    };
    const dependencias = criarDependencias(registro);
    const oficial = await cotarFreteInterno(solicitacao, dependencias, {
      frenet: configuracaoFrenet,
    });
    const separado = await cotarFretePorGruposLogisticos(
      solicitacao,
      dependencias,
      configuracaoCotacao,
    );

    afirmacoes.equal(separado.cotacoes.length, 1);
    afirmacoes.deepEqual(separado.cotacoes[0]?.resultado, oficial);
    afirmacoes.equal(separado.cotacoes[0]?.solicitacao, solicitacao);
  });

  verificar("cota somente Laquila sem oferecer Retirada", async () => {
    const item = criarItem("laquila", "fornecedor", 3, "variante-laquila");
    const registro = {
      entregas: [] as string[],
      retiradas: [] as string[],
      frenet: [] as SolicitacaoCotacaoFrete[],
    };
    const resultado = await cotarFretePorGruposLogisticos(
      criarSolicitacao([item]),
      criarDependencias(registro),
      configuracaoCotacao,
    );
    const cotacao = resultado.cotacoes[0];

    afirmacoes.equal(cotacao?.fornecedorProvedor, "laquila");
    afirmacoes.equal(registro.retiradas.length, 0);
    afirmacoes.deepEqual(
      cotacao?.resultado.opcoes.map((opcao) => opcao.provedor).sort(),
      ["frenet"],
    );
    afirmacoes.equal(cotacao?.itens[0]?.quantidade, 3);
    afirmacoes.equal(cotacao?.itens[0]?.varianteId, "variante-laquila");
  });

  verificar(
    "separa carrinho misto sem duplicar itens, volumes ou chamadas",
    async () => {
      const loja = criarItem("loja", "loja", 2, "variante-loja");
      const laquila = criarItem("laquila", "fornecedor", 4, "variante-laquila");
      const registro = {
        entregas: [] as string[],
        retiradas: [] as string[],
        frenet: [] as SolicitacaoCotacaoFrete[],
        origens: [] as string[],
      };
      const resultado = await cotarFretePorGruposLogisticos(
        criarSolicitacao([loja, laquila]),
        criarDependencias(registro),
        configuracaoCotacao,
      );

      afirmacoes.equal(resultado.cotacoes.length, 2);
      afirmacoes.deepEqual(
        resultado.cotacoes.map((cotacao) =>
          cotacao.itens.map((item) => item.identificador),
        ),
        [["loja"], ["laquila"]],
      );
      afirmacoes.deepEqual(
        resultado.cotacoes.map((cotacao) =>
          cotacao.solicitacao.pacotes.map(
            (pacote) => pacote.itens[0]?.identificador,
          ),
        ),
        [["loja"], ["laquila"]],
      );
      afirmacoes.equal(
        new Set(
          resultado.cotacoes.flatMap((cotacao) =>
            cotacao.itens.map((item) => item.identificador),
          ),
        ).size,
        2,
      );
      afirmacoes.deepEqual(registro.entregas, ["produto-loja"]);
      afirmacoes.equal(registro.retiradas.length, 1);
      afirmacoes.equal(registro.frenet.length, 2);
      afirmacoes.deepEqual(registro.origens, ["30140071", "83430000"]);
      afirmacoes.deepEqual(
        registro.frenet.map((solicitacao) => solicitacao.destino.cep),
        ["30140071", "30140071"],
      );
    },
  );

  verificar(
    "envia para Frenet pesos, dimensoes e quantidades separados",
    async () => {
      const loja = criarItem("loja", "loja", 2, "variante-loja");
      const laquila = criarItem("laquila", "fornecedor", 4, "variante-laquila");
      const registro = {
        entregas: [] as string[],
        retiradas: [] as string[],
        frenet: [] as SolicitacaoCotacaoFrete[],
      };
      await cotarFretePorGruposLogisticos(
        criarSolicitacao([loja, laquila]),
        criarDependencias(registro),
        configuracaoCotacao,
      );
      const requisicoes = registro.frenet.map((solicitacao) =>
        montarRequisicaoCotacaoFrenet(solicitacao, configuracaoFrenet),
      );

      afirmacoes.deepEqual(
        requisicoes.map((requisicao) => requisicao.ShippingItemArray),
        [
          [
            {
              Height: 10,
              Length: 30,
              Quantity: 2,
              SKU: "SKU-loja",
              Weight: 0.5,
              Width: 20,
            },
          ],
          [
            {
              Height: 10,
              Length: 30,
              Quantity: 4,
              SKU: "SKU-laquila",
              Weight: 1.2,
              Width: 20,
            },
          ],
        ],
      );
      afirmacoes.equal(
        JSON.stringify(requisicoes).includes("cd_transportador"),
        false,
      );
    },
  );

  verificar("isola falha Frenet da Laquila e preserva grupo loja", async () => {
    const registro = {
      entregas: [] as string[],
      retiradas: [] as string[],
      frenet: [] as SolicitacaoCotacaoFrete[],
      falharFrenetLaquila: true,
    };
    const resultado = await cotarFretePorGruposLogisticos(
      criarSolicitacao([
        criarItem("loja", "loja", 1, "v1"),
        criarItem("laquila", "fornecedor", 1, "v2"),
      ]),
      criarDependencias(registro),
      configuracaoCotacao,
    );
    const loja = resultado.cotacoes.find(
      (cotacao) => cotacao.origemExpedicao === "loja",
    );
    const laquila = resultado.cotacoes.find(
      (cotacao) => cotacao.fornecedorProvedor === "laquila",
    );

    afirmacoes.equal(loja?.resultado.sucesso, true);
    afirmacoes.equal(
      loja?.resultado.opcoes.some((opcao) => opcao.tipo === "retirada"),
      true,
    );
    afirmacoes.equal(laquila?.resultado.sucesso, false);
    afirmacoes.equal(
      laquila?.resultado.opcoes.some(
        (opcao) => opcao.provedor === "entrega-propria",
      ),
      false,
    );
    afirmacoes.equal(
      laquila?.resultado.opcoes.some((opcao) => opcao.tipo === "retirada"),
      false,
    );
  });

  verificar("bloqueia fornecedor sem CEP sem usar origem da loja", async () => {
    const registro = {
      entregas: [] as string[],
      retiradas: [] as string[],
      frenet: [] as SolicitacaoCotacaoFrete[],
    };
    const resultado = await cotarFretePorGruposLogisticos(
      criarSolicitacao([
        criarItem("laquila", "fornecedor", 1, "variante-laquila"),
      ]),
      criarDependencias(registro),
      {
        frenet: configuracaoFrenet,
        cepOrigemFornecedorPorProvedor: { laquila: null },
      },
    );

    afirmacoes.equal(resultado.cotacoes[0]?.resultado.sucesso, false);
    afirmacoes.equal(registro.frenet.length, 0);
    afirmacoes.equal(resultado.cotacoes[0]?.cepOrigem, "");
  });

  verificar(
    "troca de origem muda a identidade da cotação Laquila",
    async () => {
      const criarRegistro = () => ({
        entregas: [] as string[],
        retiradas: [] as string[],
        frenet: [] as SolicitacaoCotacaoFrete[],
      });
      const solicitacao = criarSolicitacao([
        criarItem("laquila", "fornecedor", 1, "variante-laquila"),
      ]);
      const primeira = await cotarFretePorGruposLogisticos(
        solicitacao,
        criarDependencias(criarRegistro()),
        configuracaoCotacao,
      );
      const segunda = await cotarFretePorGruposLogisticos(
        solicitacao,
        criarDependencias(criarRegistro()),
        {
          ...configuracaoCotacao,
          cepOrigemFornecedorPorProvedor: { laquila: "83430999" },
        },
      );

      afirmacoes.notEqual(
        primeira.cotacoes[0]?.resultado.opcoes[0]?.identificador,
        segunda.cotacoes[0]?.resultado.opcoes[0]?.identificador,
      );
    },
  );
});
