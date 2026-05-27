import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  PaginaIntegracoesLogistica,
  PaginaRegrasDisponibilidadeLogistica,
  PaginaServicosEntregaLogistica,
  PaginaVisaoGeralLogistica,
} from "./paginas-logistica-operacional";

describe("páginas operacionais de logística", () => {
  it("renderiza cards, status e ações rápidas da visão geral", () => {
    const html = renderToStaticMarkup(
      <PaginaVisaoGeralLogistica
        integracoesAtivas={1}
        servicosAtivos={3}
        regrasAtivas={4}
        produtosClassificados={2}
        alertasOperacionais={3}
        frenetConectada
        servicosSemConfiguracao={1}
        produtosSemDimensoes={null}
        regrasBloqueandoServicos={2}
      />,
    );

    assert.equal(html.includes("Visão Geral da Logística"), true);
    assert.equal(html.includes("/admin/logistica/integracoes"), true);
    assert.equal(html.includes("Integrações ativas"), true);
    assert.equal(html.includes("Produtos classificados"), true);
    assert.equal(html.includes("Alertas operacionais"), true);
    assert.equal(html.includes("Status Operacional"), true);
    assert.equal(html.includes("Conectada para operação."), true);
    assert.equal(html.includes("Produtos sem peso/dimensões"), true);
    assert.equal(html.includes("Regras bloqueando serviços"), true);
    assert.equal(html.includes("Ações Rápidas"), true);
    assert.equal(html.includes("Abrir Serviços de Entrega"), true);
    assert.equal(html.includes("Abrir Produtos"), true);
  });

  it("renderiza estados vazios na visão geral", () => {
    const html = renderToStaticMarkup(
      <PaginaVisaoGeralLogistica
        integracoesAtivas={0}
        servicosAtivos={0}
        regrasAtivas={0}
        produtosClassificados={0}
        alertasOperacionais={0}
        frenetConectada
        servicosSemConfiguracao={0}
        produtosSemDimensoes={null}
        regrasBloqueandoServicos={0}
      />,
    );

    assert.equal(html.includes("Nenhum alerta operacional encontrado."), true);
  });

  it("renderiza cards, status e ações das integrações", () => {
    const html = renderToStaticMarkup(
      <PaginaIntegracoesLogistica
        integracoes={[
          {
            id: "frenet",
            nome: "Frenet",
            estado: "conectado",
            cepOrigem: "01001000",
            quantidadeServicosImportados: 2,
            ultimaSincronizacao: null,
            ultimoTeste: null,
            transportadoras: [
              { id: "t1", nome: "Correios", servicos: ["PAC", "SEDEX"] },
            ],
            configuravel: true,
            permiteAtivacao: false,
          },
          {
            id: "melhor-envio",
            nome: "Melhor Envio",
            estado: "nao-configurado",
            cepOrigem: null,
            quantidadeServicosImportados: 0,
            ultimaSincronizacao: null,
            ultimoTeste: null,
            transportadoras: [],
            configuravel: false,
            permiteAtivacao: false,
          },
          {
            id: "enviocom",
            nome: "EnvioCom",
            estado: "erro",
            cepOrigem: null,
            quantidadeServicosImportados: 0,
            ultimaSincronizacao: null,
            ultimoTeste: null,
            transportadoras: [],
            configuravel: false,
            permiteAtivacao: false,
          },
        ]}
      />,
    );

    assert.equal(html.includes("Frenet"), true);
    assert.equal(html.includes("Melhor Envio"), true);
    assert.equal(html.includes("EnvioCom"), true);
    assert.equal(html.includes("API externa"), true);
    assert.equal(html.includes("Conectado"), true);
    assert.equal(html.includes("Não configurado"), true);
    assert.equal(html.includes("Erro"), true);
    assert.equal(html.includes("Token"), false);
    assert.equal(html.includes("01001000"), true);
    assert.equal(html.includes("Serviços importados"), true);
    assert.equal(html.includes("Correios"), true);
    assert.equal(html.includes("PAC"), true);
    assert.equal(html.includes("SEDEX"), true);
    assert.equal(html.includes("Abrir configuração da Frenet"), true);
    assert.equal(
      html.includes(
        "/admin/logistica/transportadoras-integracoes#configuracao-frenet",
      ),
      true,
    );
    assert.equal(
      html.includes(
        "Na próxima tela, use o botão Ativar Frenet no card principal.",
      ),
      true,
    );
    assert.equal(
      html.includes(
        "Teste de conexão e sincronização de serviços serão liberados nesta tela.",
      ),
      true,
    );
    assert.equal(html.includes("Ativar/Desativar"), false);
    assert.equal(html.includes("Integração"), true);
    assert.equal(html.includes("Transportadora"), true);
    assert.equal(html.includes("Serviço"), true);
  });

  it("renderiza serviços, origem, limites e separação operacional", () => {
    const html = renderToStaticMarkup(
      <PaginaServicosEntregaLogistica
        servicos={[
          {
            id: "s1",
            nome: "PAC",
            ativo: true,
            transportadoraNome: "Correios",
            origemNome: "Frenet",
            origem: "externo",
            limitePeso: "até 30 kg",
            limiteDimensoes: "100 x 50 x 40 cm",
            tiposLogisticosCompativeis: ["Produto Pequeno"],
            quantidadeRegrasAplicadas: 2,
          },
          {
            id: "s2",
            nome: "Entrega agendada",
            ativo: true,
            transportadoraNome: "Entrega Própria",
            origemNome: "Entrega Própria",
            origem: "entrega-propria",
            limitePeso: "Sem limite configurado",
            limiteDimensoes: "Sem limite configurado",
            tiposLogisticosCompativeis: [],
            quantidadeRegrasAplicadas: 0,
          },
          {
            id: "s3",
            nome: "Retirada na loja",
            ativo: false,
            transportadoraNome: "Retirada",
            origemNome: "Retirada",
            origem: "retirada",
            limitePeso: "Sem limite configurado",
            limiteDimensoes: "Sem limite configurado",
            tiposLogisticosCompativeis: [],
            quantidadeRegrasAplicadas: 0,
          },
        ]}
        filtros={{ busca: "", origem: "todas", status: "todos" }}
      />,
    );

    assert.equal(html.includes("Serviços Externos"), true);
    assert.equal(html.includes("Entrega Própria"), true);
    assert.equal(html.includes("Retirada"), true);
    assert.equal(html.includes("Correios"), true);
    assert.equal(html.includes("PAC"), true);
    assert.equal(html.includes("via Frenet"), true);
    assert.equal(html.includes("até 30 kg"), true);
    assert.equal(html.includes("100 x 50 x 40 cm"), true);
    assert.equal(html.includes("Produto Pequeno"), true);
    assert.equal(html.includes("Regras aplicadas"), true);
    assert.equal(html.includes("Ativar/Desativar"), true);
    assert.equal(html.includes("Visualizar regras"), true);
    assert.equal(html.includes("Editar limites"), true);
  });

  it("aplica busca, origem e status na listagem de serviços", () => {
    const html = renderToStaticMarkup(
      <PaginaServicosEntregaLogistica
        servicos={[
          {
            id: "s1",
            nome: "PAC",
            ativo: true,
            transportadoraNome: "Correios",
            origemNome: "Frenet",
            origem: "externo",
            limitePeso: "até 30 kg",
            limiteDimensoes: "Sem limite configurado",
            tiposLogisticosCompativeis: [],
            quantidadeRegrasAplicadas: 0,
          },
          {
            id: "s2",
            nome: "Retirada secreta",
            ativo: false,
            transportadoraNome: "Retirada",
            origemNome: "Retirada",
            origem: "retirada",
            limitePeso: "Sem limite configurado",
            limiteDimensoes: "Sem limite configurado",
            tiposLogisticosCompativeis: [],
            quantidadeRegrasAplicadas: 0,
          },
        ]}
        filtros={{ busca: "Correios", origem: "externo", status: "ativos" }}
      />,
    );

    assert.equal(html.includes("PAC"), true);
    assert.equal(html.includes("Retirada secreta"), false);
    assert.equal(html.includes("Buscar transportadora ou serviço"), true);
    assert.equal(html.includes("Status operacional"), true);
  });

  it("apresenta abas, resumo, precedência e frase de regra", () => {
    const html = renderToStaticMarkup(
      <PaginaRegrasDisponibilidadeLogistica
        regrasCategorias={[
          {
            id: "r1",
            nome: "Colchões",
            ativo: true,
            frase: "Bloquear Correios PAC para categoria Colchões",
            alvo: "Colchões",
            efeito: "bloquear",
            servicoAfetado: "Correios PAC",
            precedencia: "Base da categoria",
          },
        ]}
        regrasProdutos={[]}
        regrasClassificacoes={[]}
      />,
    );

    assert.equal(html.includes("Regras de Disponibilidade"), true);
    assert.equal(html.includes("Categorias"), true);
    assert.equal(html.includes("Produtos"), true);
    assert.equal(html.includes("Classificações Logísticas"), true);
    assert.equal(
      html.includes("Bloquear Correios PAC para categoria Colchões"),
      true,
    );
    assert.equal(html.includes("Regras ativas"), true);
    assert.equal(html.includes("Bloqueando serviços"), true);
    assert.equal(html.includes("produto</strong> sobrescreve"), true);
    assert.equal(html.includes("Bloqueio</strong> vence permissão"), true);
    assert.equal(html.includes("Editar"), true);
    assert.equal(html.includes("Desativar"), true);
    assert.equal(html.includes("Remover"), true);
  });

  it("apresenta estado vazio de regras", () => {
    const html = renderToStaticMarkup(
      <PaginaRegrasDisponibilidadeLogistica
        regrasCategorias={[]}
        regrasProdutos={[]}
        regrasClassificacoes={[]}
      />,
    );

    assert.equal(
      html.includes("Nenhuma regra para categorias foi configurada."),
      true,
    );
  });
});
