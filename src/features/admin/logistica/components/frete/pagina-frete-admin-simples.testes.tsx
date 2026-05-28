import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PaginaFreteAdminSimples } from "./pagina-frete-admin-simples";

const alternar = async (_id?: string, _ativo?: boolean) => {};
const acaoFormulario = async () => {};
const acaoFormularioComId = async () => {};

function criarPagina(
  htmlProps?: Partial<React.ComponentProps<typeof PaginaFreteAdminSimples>>,
) {
  return renderToStaticMarkup(
    <PaginaFreteAdminSimples
      provedores={[]}
      transportadoras={[]}
      servicos={[]}
      alternarProvedor={alternar}
      alternarTransportadora={alternar}
      alternarServico={alternar}
      acaoSincronizarCatalogoFrenet={acaoFormulario}
      acaoCriarProvedor={acaoFormulario}
      acaoEditarProvedor={acaoFormularioComId}
      acaoCriarTransportadora={acaoFormulario}
      acaoEditarTransportadora={acaoFormularioComId}
      acaoCriarServico={acaoFormulario}
      acaoEditarServico={acaoFormularioComId}
      categorias={[]}
      regrasCategorias={[]}
      produtos={[]}
      regrasProdutos={[]}
      tiposLogisticos={[]}
      produtosVinculadosTiposLogisticos={[]}
      regrasTiposLogisticos={[]}
      acaoCriarRegraCategoria={acaoFormulario}
      acaoEditarRegraCategoria={acaoFormularioComId}
      acaoRemoverRegraCategoria={alternar}
      acaoAlternarRegraCategoria={alternar}
      acaoCriarRegraProduto={acaoFormulario}
      acaoEditarRegraProduto={acaoFormularioComId}
      acaoRemoverRegraProduto={alternar}
      acaoAlternarRegraProduto={alternar}
      acaoCriarTipoLogistico={acaoFormulario}
      acaoEditarTipoLogistico={acaoFormularioComId}
      acaoAlternarTipoLogistico={alternar}
      acaoRemoverTipoLogistico={alternar}
      acaoVincularProdutoTipoLogistico={acaoFormulario}
      acaoDesvincularProdutoTipoLogistico={alternar}
      acaoCriarRegraTipoLogistico={acaoFormulario}
      acaoEditarRegraTipoLogistico={acaoFormularioComId}
      acaoAlternarRegraTipoLogistico={alternar}
      acaoRemoverRegraTipoLogistico={alternar}
      filtros={{
        ativo: "todos",
        provedorFreteId: "",
        transportadoraFreteId: "",
      }}
      paginacao={{
        paginaProvedores: 1,
        paginaTransportadoras: 1,
        paginaServicos: 1,
        tamanhoPagina: 5,
      }}
      mensagem={null}
      statusIntegracaoFrenet={{
        ativo: true,
        tokenConfigurado: true,
        cepOrigem: "01001000",
        ultimaCotacaoTeste: null,
      }}
      {...htmlProps}
    />,
  );
}

describe("pagina frete admin simples", () => {
  it("renderiza secoes principais", () => {
    const html = criarPagina();
    assert.equal(html.includes("Transportadoras e integrações"), true);
    assert.equal(html.includes("Ativar integração"), true);
    assert.equal(html.includes("Conexão com a Frenet"), true);
    assert.equal(html.includes("Provedores de frete"), true);
    assert.equal(html.includes("Transportadoras do catálogo"), true);
    assert.equal(html.includes("Serviços de frete disponíveis"), true);
    assert.equal(html.includes("Regras por categoria"), true);
    assert.equal(html.includes("Regras por produto específico"), true);
    assert.equal(html.includes("Tipos / classificações logísticas"), true);
    assert.equal(html.includes("Prontidão operacional"), true);
    assert.equal(html.includes("Checklist da Base Operacional"), true);
  });

  it("renderiza estado vazio aprimorado", () => {
    const html = criarPagina();
    assert.equal(html.includes("Nenhum provedor para este filtro."), true);
    assert.equal(
      html.includes("Nenhuma transportadora para este filtro."),
      true,
    );
    assert.equal(html.includes("Nenhum serviço para este filtro."), true);
    assert.equal(
      html.includes("Nenhuma regra de produto para este filtro."),
      true,
    );
    assert.equal(html.includes("Nenhum tipo logístico cadastrado."), true);
    assert.equal(html.includes("Nenhum vínculo encontrado."), true);
    assert.equal(html.includes("Base incompleta"), true);
    assert.equal(html.includes("Cadastrar e ativar Frenet"), true);
  });

  it("renderiza mensagem de sucesso", () => {
    const html = criarPagina({
      mensagem: { tipo: "sucesso", texto: "Operação concluída." },
    });
    assert.equal(html.includes("Operação concluída."), true);
  });

  it("renderiza selects de vinculo", () => {
    const html = criarPagina({
      provedores: [
        {
          id: "p1",
          identificador: "frenet",
          nome: "Frenet",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      transportadoras: [
        {
          id: "t1",
          identificador: "jadlog",
          nome: "Jadlog",
          ativo: true,
          provedorFreteId: "p1",
          provedorNome: "Frenet",
          provedorIdentificador: "frenet",
          pesoMaximoEmGramas: null,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      categorias: [{ id: "c1", nome: "Colchões", ativo: true }],
      produtos: [{ id: "pr1", nome: "Produto A", ativo: true }],
    });

    assert.equal(html.includes("Selecione o provedor"), true);
    assert.equal(html.includes("Sem transportadora"), true);
    assert.equal(html.includes("Categoria"), true);
    assert.equal(html.includes("Produto"), true);
  });

  it("renderiza filtros e paginacao", () => {
    const html = criarPagina({
      provedores: [
        {
          id: "p1",
          identificador: "frenet",
          nome: "Frenet",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      transportadoras: [
        {
          id: "t1",
          identificador: "jadlog",
          nome: "Jadlog",
          ativo: true,
          provedorFreteId: "p1",
          provedorNome: "Frenet",
          provedorIdentificador: "frenet",
          pesoMaximoEmGramas: null,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      servicos: [
        {
          id: "s1",
          identificador: "expresso",
          nome: "Expresso",
          ativo: true,
          provedorFreteId: "p1",
          provedorNome: "Frenet",
          provedorIdentificador: "frenet",
          transportadoraFreteId: "t1",
          transportadoraNome: "Jadlog",
          transportadoraIdentificador: "jadlog",
          pesoMaximoEmGramas: null,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    assert.equal(html.includes("Filtros"), true);
    assert.equal(html.includes("Filtrar"), true);
    assert.equal(html.includes("Página 1 de 1"), true);
  });

  it("renderiza card da frenet sem expor token", () => {
    const html = criarPagina({
      provedores: [
        {
          id: "p1",
          identificador: "entrega_propria",
          nome: "Entrega Própria",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "p2",
          identificador: "frenet",
          nome: "Frenet",
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      servicos: [
        {
          id: "s1",
          identificador: "pac",
          nome: "Correios PAC",
          ativo: true,
          provedorFreteId: "p2",
          provedorNome: "Frenet",
          provedorIdentificador: "frenet",
          transportadoraFreteId: null,
          transportadoraNome: null,
          transportadoraIdentificador: null,
          pesoMaximoEmGramas: null,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      statusIntegracaoFrenet: {
        ativo: true,
        tokenConfigurado: true,
        cepOrigem: "01001000",
        ultimaCotacaoTeste: null,
      },
    });

    assert.equal(html.includes("Configurar Frenet"), true);
    assert.equal(html.includes('id="configuracao-frenet"'), true);
    assert.equal(html.includes("Desativar Frenet"), true);
    assert.equal(html.includes("Fluxo para ativar"), true);
    assert.equal(html.includes("Tipo:</span> API externa"), true);
    assert.equal(html.includes("Token:</span> Configurado"), true);
    assert.equal(html.includes("01001000"), true);
    assert.equal(html.includes("npg_"), false);
    assert.equal(html.includes("Provedores Internos"), true);
    assert.equal(html.includes("Provedores Externos"), true);
    assert.equal(html.includes("Correios PAC"), true);
    assert.equal(
      html.includes("Carregar transportadoras e serviços reais"),
      true,
    );
    assert.equal(html.includes("Buscar e salvar serviços retornados"), true);
    assert.equal(html.includes("Diagnóstico da API"), true);
    assert.equal(html.includes("Prioridade das regras"), true);
  });

  it("renderiza listagem de regra por produto", () => {
    const html = criarPagina({
      produtos: [{ id: "pr1", nome: "Produto A", ativo: true }],
      regrasProdutos: [
        {
          id: "rp1",
          produtoId: "pr1",
          produtoNome: "Produto A",
          efeito: "bloquear",
          ativo: true,
          provedorFreteId: null,
          provedorNome: null,
          transportadoraFreteId: null,
          transportadoraNome: null,
          servicoFreteId: null,
          servicoNome: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    assert.equal(html.includes("Produto A"), true);
    assert.equal(html.includes("Remover"), true);
  });
});
