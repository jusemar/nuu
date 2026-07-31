import assert from "node:assert/strict";
import test from "node:test";

import type { FontesFerramentasPublicas } from "../../queries/fontes-ferramentas-publicas";
import type {
  RepositorioExecucoesFerramentas,
  ResultadoFerramentaPublica,
} from "../../types/ferramentas-publicas";
import { criarCatalogoFerramentasPublicas } from "./catalogo-ferramentas-publicas";
import { criarExecutorFerramentasPublicas } from "./executar-ferramenta-publica";
import { validarTransicaoFerramentaPublica } from "./transicoes-ferramentas-publicas";

function base(
  fonte: string,
  dados: Record<string, unknown> | null,
  status: ResultadoFerramentaPublica["status"] = "encontrado",
) {
  return {
    consultado_em: "2026-07-30T12:00:00.000Z",
    dados,
    fonte,
    status,
  };
}

function criarFontesTeste(): FontesFerramentasPublicas {
  return {
    async buscarProdutos() {
      return base("catalogo_loja", {
        produtos: [
          {
            categoria: "Categoria",
            imagem_url: null,
            nome: "Produto publicado",
            preco_em_centavos: 10_000,
            slug: "produto-publicado",
          },
        ],
      });
    },
    async consultarProduto({ slug }) {
      if (slug === "produto-inexistente") {
        return base("catalogo_loja", null, "nenhum_resultado");
      }
      return base("catalogo_loja", {
        atributos: [],
        categoria: "Categoria",
        descricao: "Descrição pública.",
        garantia_dias: 90,
        marca: "Marca",
        nome: slug === "produto-variavel" ? "Variável" : "Simples",
        slug,
        tipo: slug === "produto-variavel" ? "variavel" : "simples",
        variantes:
          slug === "produto-variavel"
            ? [
                {
                  atributos: { cor: "azul" },
                  nome: "Azul",
                  sku: "SKU-AZUL",
                },
              ]
            : [],
      });
    },
    async consultarPrecos({ sku_variante }) {
      return base("precificacao_loja", {
        precos: [
          {
            boleto_ativo: true,
            modalidade: sku_variante ? "variante" : "stock",
            moeda: "BRL",
            parcelamentos_cartao: [],
            pix_ativo: true,
            preco_final_em_centavos: 9_000,
            preco_original_em_centavos: 10_000,
            valor_pix_em_centavos: 8_900,
          },
        ],
        produto: "Produto",
        variante: sku_variante,
      });
    },
    async consultarEstoque({ sku_variante }) {
      return base("estoque_loja", {
        disponibilidade: sku_variante ? "disponivel" : "selecione_variante",
        modalidade: "stock",
        produto: "Produto",
        variante: sku_variante,
      });
    },
    async consultarPromocoes({ modalidade }) {
      if (modalidade === "expirada" || modalidade === "sem_promocao") {
        return base(
          "promotion_engine",
          {
            modalidade,
            produto: "Produto",
            promocoes: [],
            variante: null,
          },
          "nenhum_resultado",
        );
      }
      return base("promotion_engine", {
        modalidade,
        produto: "Produto",
        promocoes: [
          {
            badge: "Oferta",
            desconto_em_centavos: 1_000,
            preco_final_em_centavos: 9_000,
            preco_original_em_centavos: 10_000,
            termina_em: "2026-07-31T12:00:00.000Z",
            tipo: "normal",
          },
        ],
        variante: null,
      });
    },
    async consultarLogistica() {
      return base("logistica_loja", {
        opcoes: [
          {
            nome: "Entrega permitida após bloqueios e heranças",
            prazo: "2 dias úteis",
            tipo: "entrega",
            valor_em_centavos: 1_500,
          },
          {
            nome: "Retirada ativa",
            prazo: "Após confirmação",
            tipo: "retirada",
            valor_em_centavos: 0,
          },
        ],
        produto: "Produto",
        variante: null,
      });
    },
  };
}

class RepositorioFerramentasMemoria implements RepositorioExecucoesFerramentas {
  private sequencia = 0;
  private registros = new Map<
    string,
    {
      id: string;
      resultado?: ResultadoFerramentaPublica;
      status: "processando" | "concluida" | "falhou";
    }
  >();
  falhas = 0;

  async reivindicar(
    dados: Parameters<RepositorioExecucoesFerramentas["reivindicar"]>[0],
  ) {
    const existente = this.registros.get(dados.chaveIdempotencia);
    if (existente?.status === "concluida" && existente.resultado) {
      return { resultado: existente.resultado, tipo: "concluida" as const };
    }
    if (existente) return { tipo: "em_processamento" as const };
    const id = `ferramenta-${++this.sequencia}`;
    this.registros.set(dados.chaveIdempotencia, {
      id,
      status: "processando",
    });
    return { execucaoFerramentaId: id, tipo: "adquirida" as const };
  }

  async concluir(
    dados: Parameters<RepositorioExecucoesFerramentas["concluir"]>[0],
  ) {
    const registro = [...this.registros.values()].find(
      (item) => item.id === dados.execucaoFerramentaId,
    );
    if (!registro) throw new Error("Registro ausente");
    registro.resultado = dados.resultado;
    registro.status = "concluida";
  }

  async falhar() {
    this.falhas += 1;
  }
}

function criarExecutor(
  fontes = criarFontesTeste(),
  repositorio = new RepositorioFerramentasMemoria(),
) {
  return {
    catalogo: criarCatalogoFerramentasPublicas(fontes),
    executor: criarExecutorFerramentasPublicas({
      catalogo: criarCatalogoFerramentasPublicas(fontes),
      repositorio,
    }),
    repositorio,
  };
}

test("consulta catálogo e não encontra produto não publicado ou inexistente", async () => {
  const { executor } = criarExecutor();
  const busca = await executor.executar({
    argumentosJson: '{"termo":"produto"}',
    chamadaId: "call-1",
    execucaoId: "exec-1",
    nome: "buscar_produtos_publicos",
  });
  const ausente = await executor.executar({
    argumentosJson: '{"slug":"produto-inexistente"}',
    chamadaId: "call-2",
    execucaoId: "exec-1",
    nome: "consultar_produto_publico",
  });
  assert.equal(busca.status, "encontrado");
  assert.equal(ausente.status, "nenhum_resultado");
});

test("consulta produto simples e produto com variantes sem IDs internos", async () => {
  const { executor } = criarExecutor();
  for (const slug of ["produto-publicado", "produto-variavel"]) {
    const retorno = await executor.executar({
      argumentosJson: JSON.stringify({ slug }),
      chamadaId: `call-${slug}`,
      execucaoId: "exec-produtos",
      nome: "consultar_produto_publico",
    });
    assert.equal(retorno.status, "encontrado");
    assert.doesNotMatch(
      JSON.stringify(retorno),
      /costPrice|margem|fornecedor|internalCode|sellerInfo|produtoId|id":/,
    );
  }
});

test("consulta preço e estoque por modalidade e variante", async () => {
  const { executor } = criarExecutor();
  const argumentos = JSON.stringify({
    modalidade: "stock",
    sku_variante: "SKU-AZUL",
    slug: "produto-variavel",
  });
  const preco = await executor.executar({
    argumentosJson: argumentos,
    chamadaId: "call-preco",
    execucaoId: "exec-condicoes",
    nome: "consultar_precos_publicos",
  });
  const estoque = await executor.executar({
    argumentosJson: argumentos,
    chamadaId: "call-estoque",
    execucaoId: "exec-condicoes",
    nome: "consultar_estoque_publico",
  });
  assert.equal(preco.status, "encontrado");
  assert.equal(estoque.status, "encontrado");
  assert.doesNotMatch(JSON.stringify(estoque), /quantidade_disponivel/);
});

test("diferencia promoção vigente, expirada e inexistente", async () => {
  const { executor } = criarExecutor();
  for (const [modalidade, status] of [
    ["stock", "encontrado"],
    ["expirada", "nenhum_resultado"],
    ["sem_promocao", "nenhum_resultado"],
  ] as const) {
    const retorno = await executor.executar({
      argumentosJson: JSON.stringify({
        modalidade,
        sku_variante: null,
        slug: "produto-publicado",
      }),
      chamadaId: `call-${modalidade}`,
      execucaoId: "exec-promocoes",
      nome: "consultar_promocoes_publicas",
    });
    assert.equal(retorno.status, status);
  }
});

test("expõe somente opções logísticas públicas após regras e retirada", async () => {
  const { executor } = criarExecutor();
  const retorno = await executor.executar({
    argumentosJson: JSON.stringify({
      cep: "01001-000",
      modalidade: "stock",
      quantidade: 1,
      sku_variante: null,
      slug: "produto-publicado",
    }),
    chamadaId: "call-logistica",
    execucaoId: "exec-logistica",
    nome: "consultar_logistica_publica",
  });
  assert.equal(retorno.status, "encontrado");
  assert.match(JSON.stringify(retorno), /retirada/);
  assert.doesNotMatch(JSON.stringify(retorno), /provedor|regraId|configuracao/);
});

test("rejeita argumentos extras, JSON inválido e ferramenta desconhecida", async () => {
  const { executor } = criarExecutor();
  const extra = await executor.executar({
    argumentosJson: '{"slug":"produto-publicado","admin":true}',
    chamadaId: "call-extra",
    execucaoId: "exec-seguranca",
    nome: "consultar_produto_publico",
  });
  const jsonInvalido = await executor.executar({
    argumentosJson: "{",
    chamadaId: "call-json",
    execucaoId: "exec-seguranca",
    nome: "consultar_produto_publico",
  });
  const desconhecida = await executor.executar({
    argumentosJson: "{}",
    chamadaId: "call-admin",
    execucaoId: "exec-seguranca",
    nome: "consultar_dados_administrativos",
  });
  assert.equal(extra.status, "argumento_invalido");
  assert.equal(jsonInvalido.status, "argumento_invalido");
  assert.equal(desconhecida.status, "ferramenta_nao_autorizada");
});

test("classifica indisponibilidade como recuperável e resultado incompatível como definitivo", async () => {
  const fontesIndisponiveis = criarFontesTeste();
  fontesIndisponiveis.buscarProdutos = async () => {
    throw new Error("Banco indisponível");
  };
  const falhaRecuperavel = await criarExecutor(
    fontesIndisponiveis,
  ).executor.executar({
    argumentosJson: '{"termo":"produto"}',
    chamadaId: "call-falha",
    execucaoId: "exec-falha",
    nome: "buscar_produtos_publicos",
  });
  const fontesInvalidas = criarFontesTeste();
  fontesInvalidas.consultarProduto = async () =>
    base("catalogo_loja", { custo: 10_000 });
  const falhaDefinitiva = await criarExecutor(
    fontesInvalidas,
  ).executor.executar({
    argumentosJson: '{"slug":"produto-publicado"}',
    chamadaId: "call-interno",
    execucaoId: "exec-interno",
    nome: "consultar_produto_publico",
  });
  assert.equal(falhaRecuperavel.status, "falha_recuperavel");
  assert.equal(falhaDefinitiva.status, "falha_definitiva");
});

test("idempotência reaproveita resultado e concorrência não duplica execução", async () => {
  let chamadasFonte = 0;
  let liberar!: () => void;
  const bloqueio = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  const fontes = criarFontesTeste();
  fontes.buscarProdutos = async () => {
    chamadasFonte += 1;
    await bloqueio;
    return base("catalogo_loja", { produtos: [] }, "nenhum_resultado");
  };
  const { executor } = criarExecutor(fontes);
  const dados = {
    argumentosJson: '{"termo":"produto"}',
    chamadaId: "call-concorrente",
    execucaoId: "exec-concorrente",
    nome: "buscar_produtos_publicos",
  };
  const primeira = executor.executar(dados);
  await new Promise((resolve) => setImmediate(resolve));
  const concorrente = await executor.executar(dados);
  liberar();
  const concluida = await primeira;
  const repetida = await executor.executar(dados);

  assert.equal(concorrente.status, "falha_recuperavel");
  assert.equal(concluida.status, "nenhum_resultado");
  assert.deepEqual(repetida, concluida);
  assert.equal(chamadasFonte, 1);
});

test("permite somente o ciclo técnico aprovado da ferramenta", () => {
  assert.doesNotThrow(() =>
    validarTransicaoFerramentaPublica("processando", "aguardando_ferramenta"),
  );
  assert.doesNotThrow(() =>
    validarTransicaoFerramentaPublica(
      "aguardando_ferramenta",
      "executando_ferramenta",
    ),
  );
  assert.doesNotThrow(() =>
    validarTransicaoFerramentaPublica("executando_ferramenta", "processando"),
  );
  assert.throws(() =>
    validarTransicaoFerramentaPublica(
      "executando_ferramenta",
      "gerando_resposta",
    ),
  );
});
