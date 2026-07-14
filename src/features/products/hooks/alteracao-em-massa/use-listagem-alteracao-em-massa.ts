"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  CategoriaAlteracaoEmMassa,
  DadosAlteracaoEmMassa,
  DensidadeTabelaProdutos,
  StatusFiltroProduto,
  TipoProdutoConfiavel,
} from "../../types/alteracao-em-massa.types";

export type CampoOrdenacaoProdutos = "nome" | "sku" | "categoria" | "marca";

function normalizarBusca(valor: string) {
  return valor.trim().toLocaleLowerCase("pt-BR");
}

function coletarCategoriaEDescendentes(
  categoriaId: string,
  categorias: CategoriaAlteracaoEmMassa[],
) {
  const ids = new Set([categoriaId]);
  const pendentes = [categoriaId];

  while (pendentes.length > 0) {
    const paiId = pendentes.shift();
    categorias
      .filter((categoria) => categoria.parentId === paiId)
      .forEach((filha) => {
        if (!ids.has(filha.id)) {
          ids.add(filha.id);
          pendentes.push(filha.id);
        }
      });
  }

  return ids;
}

export function useListagemAlteracaoEmMassa(dados: DadosAlteracaoEmMassa) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<Set<StatusFiltroProduto>>(new Set());
  const [categoriasIds, setCategoriasIds] = useState<Set<string>>(new Set());
  const [marcasIds, setMarcasIds] = useState<Set<string>>(new Set());
  const [secoesIds, setSecoesIds] = useState<Set<string>>(new Set());
  const [tipos, setTipos] = useState<Set<TipoProdutoConfiavel>>(new Set());
  const [selecionadosIds, setSelecionadosIds] = useState<Set<string>>(
    new Set(),
  );
  const [densidade, setDensidade] =
    useState<DensidadeTabelaProdutos>("confortavel");
  const [campoOrdenacao, setCampoOrdenacao] =
    useState<CampoOrdenacaoProdutos>("nome");
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<"asc" | "desc">(
    "asc",
  );
  const [pagina, setPagina] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  const categoriasAbrangidas = useMemo(() => {
    const ids = new Set<string>();
    categoriasIds.forEach((categoriaId) => {
      coletarCategoriaEDescendentes(categoriaId, dados.categorias).forEach(
        (id) => ids.add(id),
      );
    });
    return ids;
  }, [categoriasIds, dados.categorias]);

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca);
    const filtrados = dados.produtos.filter((produto) => {
      const correspondeBusca =
        !termo ||
        normalizarBusca(produto.nome).includes(termo) ||
        normalizarBusca(produto.sku).includes(termo);
      const correspondeStatus =
        status.size === 0 || status.has(produto.ativo ? "ativo" : "inativo");
      const correspondeCategoria =
        categoriasAbrangidas.size === 0 ||
        categoriasAbrangidas.has(produto.categoriaId);
      const correspondeMarca =
        marcasIds.size === 0 || marcasIds.has(produto.marcaId);
      const correspondeSecoes =
        secoesIds.size === 0 ||
        Array.from(secoesIds).every((secao) =>
          produto.secoesLoja.includes(secao),
        );
      const correspondeTipo =
        tipos.size === 0 ||
        tipos.has(produto.tipoProduto as TipoProdutoConfiavel);

      return (
        correspondeBusca &&
        correspondeStatus &&
        correspondeCategoria &&
        correspondeMarca &&
        correspondeSecoes &&
        correspondeTipo
      );
    });

    const valorOrdenacao = (produto: (typeof filtrados)[number]) => {
      if (campoOrdenacao === "sku") return produto.sku;
      if (campoOrdenacao === "categoria") return produto.categoriaNome;
      if (campoOrdenacao === "marca") return produto.marcaNome;
      return produto.nome;
    };

    return filtrados.toSorted((produtoA, produtoB) => {
      const comparacao = valorOrdenacao(produtoA).localeCompare(
        valorOrdenacao(produtoB),
        "pt-BR",
        { sensitivity: "base", numeric: true },
      );
      return direcaoOrdenacao === "asc" ? comparacao : -comparacao;
    });
  }, [
    busca,
    campoOrdenacao,
    categoriasAbrangidas,
    dados.produtos,
    direcaoOrdenacao,
    marcasIds,
    secoesIds,
    status,
    tipos,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / itensPorPagina),
  );
  const produtosPagina = produtosFiltrados.slice(
    pagina * itensPorPagina,
    pagina * itensPorPagina + itensPorPagina,
  );

  useEffect(() => {
    setPagina(0);
  }, [
    busca,
    status,
    categoriasIds,
    marcasIds,
    secoesIds,
    tipos,
    itensPorPagina,
  ]);

  useEffect(() => {
    if (pagina >= totalPaginas) setPagina(totalPaginas - 1);
  }, [pagina, totalPaginas]);

  function alternarEmConjunto<T>(
    valor: T,
    atualizar: React.Dispatch<React.SetStateAction<Set<T>>>,
  ) {
    atualizar((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(valor)) proximos.delete(valor);
      else proximos.add(valor);
      return proximos;
    });
  }

  function alternarOrdenacao(campo: CampoOrdenacaoProdutos) {
    if (campo === campoOrdenacao) {
      setDirecaoOrdenacao((atual) => (atual === "asc" ? "desc" : "asc"));
      return;
    }
    setCampoOrdenacao(campo);
    setDirecaoOrdenacao("asc");
  }

  const idsPagina = produtosPagina.map((produto) => produto.id);
  const paginaTodaSelecionada =
    idsPagina.length > 0 && idsPagina.every((id) => selecionadosIds.has(id));
  const paginaParcialmenteSelecionada =
    !paginaTodaSelecionada && idsPagina.some((id) => selecionadosIds.has(id));

  function alternarSelecaoPagina() {
    setSelecionadosIds((atuais) => {
      const proximos = new Set(atuais);
      if (paginaTodaSelecionada) idsPagina.forEach((id) => proximos.delete(id));
      else idsPagina.forEach((id) => proximos.add(id));
      return proximos;
    });
  }

  function limparFiltros() {
    setBusca("");
    setStatus(new Set());
    setCategoriasIds(new Set());
    setMarcasIds(new Set());
    setSecoesIds(new Set());
    setTipos(new Set());
  }

  return {
    busca,
    setBusca,
    status,
    alternarStatus: (valor: StatusFiltroProduto) =>
      alternarEmConjunto(valor, setStatus),
    categoriasIds,
    alternarCategoria: (id: string) => alternarEmConjunto(id, setCategoriasIds),
    marcasIds,
    alternarMarca: (id: string) => alternarEmConjunto(id, setMarcasIds),
    secoesIds,
    alternarSecao: (id: string) => alternarEmConjunto(id, setSecoesIds),
    tipos,
    alternarTipo: (tipo: TipoProdutoConfiavel) =>
      alternarEmConjunto(tipo, setTipos),
    limparFiltros,
    totalFiltrosAtivos:
      status.size +
      categoriasIds.size +
      marcasIds.size +
      secoesIds.size +
      tipos.size,
    produtosFiltrados,
    produtosPagina,
    selecionadosIds,
    alternarProduto: (id: string) => alternarEmConjunto(id, setSelecionadosIds),
    limparSelecao: () => setSelecionadosIds(new Set()),
    alternarSelecaoPagina,
    paginaTodaSelecionada,
    paginaParcialmenteSelecionada,
    densidade,
    setDensidade,
    campoOrdenacao,
    direcaoOrdenacao,
    alternarOrdenacao,
    pagina,
    setPagina,
    totalPaginas,
    itensPorPagina,
    setItensPorPagina,
  };
}

export type EstadoListagemAlteracaoEmMassa = ReturnType<
  typeof useListagemAlteracaoEmMassa
>;
