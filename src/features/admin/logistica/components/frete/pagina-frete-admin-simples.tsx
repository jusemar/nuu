import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { listarProvedoresFrete } from "@/features/admin/logistica/queries/frete/provedores";
import type { listarCategoriasFrete } from "@/features/admin/logistica/queries/regras-categorias";
import type { listarRegrasCategoriasFrete } from "@/features/admin/logistica/queries/regras-categorias";
import type { listarProdutosFrete } from "@/features/admin/logistica/queries/regras-produtos";
import type { listarRegrasProdutosFrete } from "@/features/admin/logistica/queries/regras-produtos";
import type { listarServicosFrete } from "@/features/admin/logistica/queries/frete/servicos";
import type { listarProdutosVinculadosTiposLogisticos } from "@/features/admin/logistica/queries/tipos-logisticos";
import type { listarRegrasTiposLogisticosFrete } from "@/features/admin/logistica/queries/tipos-logisticos";
import type { listarTiposLogisticos } from "@/features/admin/logistica/queries/tipos-logisticos";
import type { listarTransportadorasFrete } from "@/features/admin/logistica/queries/frete/transportadoras";

import { NavegacaoLogisticaOperacional } from "../operacao/navegacao-logistica-operacional";
import { LinhaAlternarAtivacao } from "./secao-alternar-ativacao";

type ProvedorFrete = Awaited<ReturnType<typeof listarProvedoresFrete>>[number];
type TransportadoraFrete = Awaited<
  ReturnType<typeof listarTransportadorasFrete>
>[number];
type ServicoFrete = Awaited<ReturnType<typeof listarServicosFrete>>[number];
type CategoriaFrete = Awaited<ReturnType<typeof listarCategoriasFrete>>[number];
type RegraCategoriaFrete = Awaited<
  ReturnType<typeof listarRegrasCategoriasFrete>
>[number];
type ProdutoFrete = Awaited<ReturnType<typeof listarProdutosFrete>>[number];
type RegraProdutoFrete = Awaited<
  ReturnType<typeof listarRegrasProdutosFrete>
>[number];
type TipoLogistico = Awaited<ReturnType<typeof listarTiposLogisticos>>[number];
type ProdutoVinculadoTipoLogistico = Awaited<
  ReturnType<typeof listarProdutosVinculadosTiposLogisticos>
>[number];
type RegraTipoLogisticoFrete = Awaited<
  ReturnType<typeof listarRegrasTiposLogisticosFrete>
>[number];

type FiltroAtivo = "todos" | "ativos" | "inativos";

type FiltrosFreteAdmin = {
  ativo: FiltroAtivo;
  provedorFreteId: string;
  transportadoraFreteId: string;
};

type PaginacaoFreteAdmin = {
  paginaProvedores: number;
  paginaTransportadoras: number;
  paginaServicos: number;
  tamanhoPagina: number;
};

type MensagemFreteAdmin = {
  tipo: "sucesso" | "erro";
  texto: string;
} | null;

type StatusIntegracaoFrenet = {
  ativo: boolean;
  tokenConfigurado: boolean;
  cepOrigem: string | null;
  ultimaCotacaoTeste: string | null;
};

function campoLimite(valor: number | null) {
  return valor === null ? "" : String(valor);
}

function filtrarPorAtivo<T extends { ativo: boolean }>(
  lista: T[],
  ativo: FiltroAtivo,
) {
  if (ativo === "ativos") return lista.filter((item) => item.ativo);
  if (ativo === "inativos") return lista.filter((item) => !item.ativo);
  return lista;
}

function paginar<T>(lista: T[], pagina: number, tamanhoPagina: number) {
  const inicio = (pagina - 1) * tamanhoPagina;
  return lista.slice(inicio, inicio + tamanhoPagina);
}

function StatusAtivo({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "default" : "secondary"}>
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}

function MensagemResultado({ mensagem }: { mensagem: MensagemFreteAdmin }) {
  if (!mensagem) return null;

  return (
    <Card
      className={
        mensagem.tipo === "sucesso"
          ? "border-emerald-500/50"
          : "border-red-500/50"
      }
    >
      <CardContent className="py-3 text-sm">{mensagem.texto}</CardContent>
    </Card>
  );
}

function ControlesFiltros({
  filtros,
  provedores,
  transportadoras,
}: {
  filtros: FiltrosFreteAdmin;
  provedores: ProvedorFrete[];
  transportadoras: TransportadoraFrete[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-2 sm:grid-cols-4">
          <input type="hidden" name="paginaProvedores" value="1" />
          <input type="hidden" name="paginaTransportadoras" value="1" />
          <input type="hidden" name="paginaServicos" value="1" />
          <div className="space-y-1">
            <Label htmlFor="filtro-ativo">Status</Label>
            <select
              id="filtro-ativo"
              name="ativo"
              defaultValue={filtros.ativo}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filtro-provedor">Provedor</Label>
            <select
              id="filtro-provedor"
              name="provedorFreteId"
              defaultValue={filtros.provedorFreteId}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Todos</option>
              {provedores.map((provedor) => (
                <option key={provedor.id} value={provedor.id}>
                  {provedor.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filtro-transportadora">Transportadora</Label>
            <select
              id="filtro-transportadora"
              name="transportadoraFreteId"
              defaultValue={filtros.transportadoraFreteId}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Todas</option>
              {transportadoras.map((transportadora) => (
                <option key={transportadora.id} value={transportadora.id}>
                  {transportadora.nome}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="self-end">
            Filtrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PaginacaoSimples({
  chavePagina,
  paginaAtual,
  totalItens,
  tamanhoPagina,
  filtros,
}: {
  chavePagina: "paginaProvedores" | "paginaTransportadoras" | "paginaServicos";
  paginaAtual: number;
  totalItens: number;
  tamanhoPagina: number;
  filtros: FiltrosFreteAdmin;
}) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / tamanhoPagina));
  const anterior = Math.max(1, paginaAtual - 1);
  const proxima = Math.min(totalPaginas, paginaAtual + 1);

  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Página {paginaAtual} de {totalPaginas}
      </span>
      <div className="flex gap-2">
        <a
          href={`?ativo=${filtros.ativo}&provedorFreteId=${filtros.provedorFreteId}&transportadoraFreteId=${filtros.transportadoraFreteId}&${chavePagina}=${anterior}`}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={paginaAtual === 1}
          >
            Anterior
          </Button>
        </a>
        <a
          href={`?ativo=${filtros.ativo}&provedorFreteId=${filtros.provedorFreteId}&transportadoraFreteId=${filtros.transportadoraFreteId}&${chavePagina}=${proxima}`}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={paginaAtual >= totalPaginas}
          >
            Próxima
          </Button>
        </a>
      </div>
    </div>
  );
}

export function PaginaFreteAdminSimples({
  provedores,
  transportadoras,
  servicos,
  alternarProvedor,
  alternarTransportadora,
  alternarServico,
  acaoSincronizarCatalogoFrenet,
  acaoCriarProvedor,
  acaoEditarProvedor,
  acaoCriarTransportadora,
  acaoEditarTransportadora,
  acaoCriarServico,
  acaoEditarServico,
  categorias,
  regrasCategorias,
  produtos,
  regrasProdutos,
  tiposLogisticos,
  produtosVinculadosTiposLogisticos,
  regrasTiposLogisticos,
  acaoCriarRegraCategoria,
  acaoEditarRegraCategoria,
  acaoRemoverRegraCategoria,
  acaoAlternarRegraCategoria,
  acaoCriarRegraProduto,
  acaoEditarRegraProduto,
  acaoRemoverRegraProduto,
  acaoAlternarRegraProduto,
  acaoCriarTipoLogistico,
  acaoEditarTipoLogistico,
  acaoAlternarTipoLogistico,
  acaoRemoverTipoLogistico,
  acaoVincularProdutoTipoLogistico,
  acaoDesvincularProdutoTipoLogistico,
  acaoCriarRegraTipoLogistico,
  acaoEditarRegraTipoLogistico,
  acaoAlternarRegraTipoLogistico,
  acaoRemoverRegraTipoLogistico,
  filtros,
  paginacao,
  mensagem,
  statusIntegracaoFrenet,
}: {
  provedores: ProvedorFrete[];
  transportadoras: TransportadoraFrete[];
  servicos: ServicoFrete[];
  alternarProvedor: (id: string, ativo: boolean) => Promise<void>;
  alternarTransportadora: (id: string, ativo: boolean) => Promise<void>;
  alternarServico: (id: string, ativo: boolean) => Promise<void>;
  acaoSincronizarCatalogoFrenet: (formData: FormData) => Promise<void>;
  acaoCriarProvedor: (formData: FormData) => Promise<void>;
  acaoEditarProvedor: (id: string, formData: FormData) => Promise<void>;
  acaoCriarTransportadora: (formData: FormData) => Promise<void>;
  acaoEditarTransportadora: (id: string, formData: FormData) => Promise<void>;
  acaoCriarServico: (formData: FormData) => Promise<void>;
  acaoEditarServico: (id: string, formData: FormData) => Promise<void>;
  categorias: CategoriaFrete[];
  regrasCategorias: RegraCategoriaFrete[];
  produtos: ProdutoFrete[];
  regrasProdutos: RegraProdutoFrete[];
  tiposLogisticos: TipoLogistico[];
  produtosVinculadosTiposLogisticos: ProdutoVinculadoTipoLogistico[];
  regrasTiposLogisticos: RegraTipoLogisticoFrete[];
  acaoCriarRegraCategoria: (formData: FormData) => Promise<void>;
  acaoEditarRegraCategoria: (id: string, formData: FormData) => Promise<void>;
  acaoRemoverRegraCategoria: (id: string) => Promise<void>;
  acaoAlternarRegraCategoria: (id: string, ativo: boolean) => Promise<void>;
  acaoCriarRegraProduto: (formData: FormData) => Promise<void>;
  acaoEditarRegraProduto: (id: string, formData: FormData) => Promise<void>;
  acaoRemoverRegraProduto: (id: string) => Promise<void>;
  acaoAlternarRegraProduto: (id: string, ativo: boolean) => Promise<void>;
  acaoCriarTipoLogistico: (formData: FormData) => Promise<void>;
  acaoEditarTipoLogistico: (id: string, formData: FormData) => Promise<void>;
  acaoAlternarTipoLogistico: (id: string, ativo: boolean) => Promise<void>;
  acaoRemoverTipoLogistico: (id: string) => Promise<void>;
  acaoVincularProdutoTipoLogistico: (formData: FormData) => Promise<void>;
  acaoDesvincularProdutoTipoLogistico: (id: string) => Promise<void>;
  acaoCriarRegraTipoLogistico: (formData: FormData) => Promise<void>;
  acaoEditarRegraTipoLogistico: (
    id: string,
    formData: FormData,
  ) => Promise<void>;
  acaoAlternarRegraTipoLogistico: (id: string, ativo: boolean) => Promise<void>;
  acaoRemoverRegraTipoLogistico: (id: string) => Promise<void>;
  filtros: FiltrosFreteAdmin;
  paginacao: PaginacaoFreteAdmin;
  mensagem: MensagemFreteAdmin;
  statusIntegracaoFrenet: StatusIntegracaoFrenet;
}) {
  const identificadoresInternos = new Set([
    "entrega_propria",
    "retirada",
    "retirada_local",
  ]);
  const provedorFrenet = provedores.find(
    (provedor) => provedor.identificador.toLowerCase() === "frenet",
  );
  const provedoresInternos = provedores.filter((provedor) =>
    identificadoresInternos.has(provedor.identificador),
  );
  const provedoresExternos = provedores.filter(
    (provedor) => !identificadoresInternos.has(provedor.identificador),
  );
  const servicosConhecidosFrenet = servicos.filter((servico) => {
    const nomeNormalizado = servico.nome.toLowerCase();
    const identificadorNormalizado = servico.identificador.toLowerCase();
    return (
      nomeNormalizado.includes("pac") ||
      nomeNormalizado.includes("sedex") ||
      nomeNormalizado.includes("jadlog") ||
      identificadorNormalizado.includes("pac") ||
      identificadorNormalizado.includes("sedex") ||
      identificadorNormalizado.includes("jadlog")
    );
  });

  const provedoresFiltrados = filtrarPorAtivo(provedores, filtros.ativo);
  const transportadorasFiltradas = filtrarPorAtivo(
    transportadoras.filter((transportadora) =>
      filtros.provedorFreteId
        ? transportadora.provedorFreteId === filtros.provedorFreteId
        : true,
    ),
    filtros.ativo,
  );
  const servicosFiltrados = filtrarPorAtivo(
    servicos.filter((servico) => {
      if (
        filtros.provedorFreteId &&
        servico.provedorFreteId !== filtros.provedorFreteId
      )
        return false;
      if (
        filtros.transportadoraFreteId &&
        (servico.transportadoraFreteId ?? "") !== filtros.transportadoraFreteId
      ) {
        return false;
      }
      return true;
    }),
    filtros.ativo,
  );

  const provedoresPaginados = paginar(
    provedoresFiltrados,
    paginacao.paginaProvedores,
    paginacao.tamanhoPagina,
  );
  const transportadorasPaginadas = paginar(
    transportadorasFiltradas,
    paginacao.paginaTransportadoras,
    paginacao.tamanhoPagina,
  );
  const servicosPaginados = paginar(
    servicosFiltrados,
    paginacao.paginaServicos,
    paginacao.tamanhoPagina,
  );
  const regrasCategoriasFiltradas = filtrarPorAtivo(
    regrasCategorias,
    filtros.ativo,
  ).filter((regra) => {
    if (
      filtros.provedorFreteId &&
      (regra.provedorFreteId ?? "") !== filtros.provedorFreteId
    ) {
      return false;
    }
    if (
      filtros.transportadoraFreteId &&
      (regra.transportadoraFreteId ?? "") !== filtros.transportadoraFreteId
    ) {
      return false;
    }
    return true;
  });
  const regrasProdutosFiltradas = filtrarPorAtivo(
    regrasProdutos,
    filtros.ativo,
  ).filter((regra) => {
    if (
      filtros.provedorFreteId &&
      (regra.provedorFreteId ?? "") !== filtros.provedorFreteId
    ) {
      return false;
    }
    if (
      filtros.transportadoraFreteId &&
      (regra.transportadoraFreteId ?? "") !== filtros.transportadoraFreteId
    ) {
      return false;
    }
    return true;
  });

  const provedoresAtivos = provedores.filter((item) => item.ativo);
  const transportadorasAtivas = transportadoras.filter((item) => item.ativo);
  const servicosAtivos = servicos.filter((item) => item.ativo);
  const idsProvedoresAtivos = new Set(provedoresAtivos.map((item) => item.id));
  const idsTransportadorasAtivas = new Set(
    transportadorasAtivas.map((item) => item.id),
  );
  const provedoresExternosAtivos = provedoresAtivos.filter(
    (item) => !identificadoresInternos.has(item.identificador),
  );
  const servicosSemTransportadora = servicosAtivos.filter(
    (item) => !item.transportadoraFreteId,
  );
  const transportadorasSemServicoAtivo = transportadorasAtivas.filter(
    (transportadora) =>
      !servicosAtivos.some(
        (servico) => servico.transportadoraFreteId === transportadora.id,
      ),
  );
  const consistenciaBase =
    provedoresExternosAtivos.length > 0 &&
    transportadorasAtivas.some((item) =>
      idsProvedoresAtivos.has(item.provedorFreteId),
    ) &&
    servicosAtivos.some(
      (item) =>
        idsProvedoresAtivos.has(item.provedorFreteId) &&
        (!item.transportadoraFreteId ||
          idsTransportadorasAtivas.has(item.transportadoraFreteId)),
    );
  const pendenciasBaseOperacional: string[] = [];

  if (provedoresExternosAtivos.length === 0) {
    pendenciasBaseOperacional.push(
      "Ative ao menos um provedor externo para frete externo.",
    );
  }
  if (
    !transportadorasAtivas.some((item) =>
      idsProvedoresAtivos.has(item.provedorFreteId),
    )
  ) {
    pendenciasBaseOperacional.push(
      "Cadastre e ative ao menos uma transportadora vinculada a provedor ativo.",
    );
  }
  if (
    !servicosAtivos.some(
      (item) =>
        idsProvedoresAtivos.has(item.provedorFreteId) &&
        (!item.transportadoraFreteId ||
          idsTransportadorasAtivas.has(item.transportadoraFreteId)),
    )
  ) {
    pendenciasBaseOperacional.push(
      "Cadastre e ative ao menos um serviço válido para cotação.",
    );
  }
  if (servicosSemTransportadora.length > 0) {
    pendenciasBaseOperacional.push(
      `${servicosSemTransportadora.length} serviço(s) ativo(s) sem transportadora vinculada.`,
    );
  }
  if (transportadorasSemServicoAtivo.length > 0) {
    pendenciasBaseOperacional.push(
      `${transportadorasSemServicoAtivo.length} transportadora(s) ativa(s) sem serviço ativo.`,
    );
  }

  return (
    <div className="space-y-6">
      <NavegacaoLogisticaOperacional />
      <MensagemResultado mensagem={mensagem} />

      <Card>
        <CardHeader>
          <CardTitle>Configuração das Integrações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Frenet é a integração externa. Correios, Jadlog e demais
            transportadoras/serviços são retornados por ela e podem ser
            permitidos ou bloqueados nas regras.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Provedores Internos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {provedoresInternos.length === 0 ? (
                  <span className="text-muted-foreground">
                    Nenhum provedor interno cadastrado.
                  </span>
                ) : (
                  provedoresInternos.map((provedor) => (
                    <div
                      key={provedor.id}
                      className="flex items-center justify-between"
                    >
                      <span>{provedor.nome}</span>
                      <StatusAtivo ativo={provedor.ativo} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Provedores Externos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {provedoresExternos.length === 0 ? (
                  <span className="text-muted-foreground">
                    Nenhum provedor externo cadastrado.
                  </span>
                ) : (
                  provedoresExternos.map((provedor) => (
                    <div
                      key={provedor.id}
                      className="flex items-center justify-between"
                    >
                      <span>{provedor.nome}</span>
                      <StatusAtivo ativo={provedor.ativo} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card
            id="configuracao-frenet"
            className="border-primary/30 scroll-mt-6"
          >
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Configurar Frenet</CardTitle>
              <p className="text-muted-foreground text-sm">
                Ative a integração e confira os dados necessários para operar
                com frete externo.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <span className="font-medium">Provedor:</span> Frenet
                </div>
                <div>
                  <span className="font-medium">Tipo:</span> API externa
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {statusIntegracaoFrenet.ativo ? "Ativo" : "Inativo"}
                </div>
                <div>
                  <span className="font-medium">Token:</span>{" "}
                  {statusIntegracaoFrenet.tokenConfigurado
                    ? "Configurado"
                    : "Não configurado"}
                </div>
                <div>
                  <span className="font-medium">CEP origem:</span>{" "}
                  {statusIntegracaoFrenet.cepOrigem ?? "Não configurado"}
                </div>
                <div>
                  <span className="font-medium">Última cotação/teste:</span>{" "}
                  {statusIntegracaoFrenet.ultimaCotacaoTeste ??
                    "Não disponível"}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Serviços conhecidos:</span>{" "}
                  {servicosConhecidosFrenet.length > 0
                    ? servicosConhecidosFrenet
                        .map((servico) => servico.nome)
                        .join(", ")
                    : "PAC, SEDEX, Jadlog"}
                </div>
              </div>
              <div className="rounded-md border border-dashed p-3 text-sm">
                <p className="font-medium">Fluxo para ativar</p>
                <p className="text-muted-foreground mt-1">
                  1. Ative a Frenet. 2. Confira token e CEP de origem. 3. Valide
                  transportadoras e serviços abaixo.
                </p>
              </div>
              {provedorFrenet ? (
                <form
                  action={async () => {
                    "use server";
                    await alternarProvedor(
                      provedorFrenet.id,
                      !provedorFrenet.ativo,
                    );
                  }}
                >
                  <Button type="submit">
                    {provedorFrenet.ativo
                      ? "Desativar Frenet"
                      : "Ativar Frenet"}
                  </Button>
                </form>
              ) : (
                <form action={acaoCriarProvedor}>
                  <input type="hidden" name="identificador" value="frenet" />
                  <input type="hidden" name="nome" value="Frenet" />
                  <Button type="submit">Cadastrar e ativar Frenet</Button>
                </form>
              )}
              <p className="text-muted-foreground text-xs">
                Token e CEP de origem são exibidos para conferência e não são
                editados nesta tela.
              </p>
              {provedorFrenet?.ativo ? (
                <div className="space-y-3 rounded-md border p-4">
                  <div>
                    <p className="font-medium">
                      Carregar transportadoras e serviços reais
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Informe um destino e pacote de referência. A Frenet
                      retorna as opções disponíveis para este cenário.
                    </p>
                  </div>
                  <form
                    action={acaoSincronizarCatalogoFrenet}
                    className="grid gap-3 md:grid-cols-6"
                  >
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="cep-destino-sincronizacao">
                        CEP de destino
                      </Label>
                      <Input
                        id="cep-destino-sincronizacao"
                        name="cepDestino"
                        inputMode="numeric"
                        placeholder="00000000"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="peso-sincronizacao">Peso (kg)</Label>
                      <Input
                        id="peso-sincronizacao"
                        name="pesoEmKg"
                        type="number"
                        min="0.001"
                        step="0.001"
                        placeholder="1"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="altura-sincronizacao">Altura (cm)</Label>
                      <Input
                        id="altura-sincronizacao"
                        name="alturaEmCm"
                        type="number"
                        min="1"
                        placeholder="10"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="largura-sincronizacao">
                        Largura (cm)
                      </Label>
                      <Input
                        id="largura-sincronizacao"
                        name="larguraEmCm"
                        type="number"
                        min="1"
                        placeholder="10"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="comprimento-sincronizacao">
                        Comprimento (cm)
                      </Label>
                      <Input
                        id="comprimento-sincronizacao"
                        name="comprimentoEmCm"
                        type="number"
                        min="1"
                        placeholder="10"
                        required
                      />
                    </div>
                    <Button type="submit" className="md:col-span-6 md:w-fit">
                      Buscar e salvar serviços retornados
                    </Button>
                  </form>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Provedores</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {provedores.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Transportadoras</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {transportadoras.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Serviços</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {servicos.length}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist da Base Operacional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={consistenciaBase ? "default" : "destructive"}>
              {consistenciaBase
                ? "Base pronta para validação"
                : "Base incompleta"}
            </Badge>
            <span className="text-muted-foreground">
              Valide provedores, transportadoras e serviços antes das regras de
              disponibilidade.
            </span>
          </div>
          {pendenciasBaseOperacional.length === 0 ? (
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
              Sem pendências na estrutura base. Próximo passo: validar regras e
              vínculos.
            </div>
          ) : (
            <div className="space-y-2">
              {pendenciasBaseOperacional.map((pendencia) => (
                <div
                  key={pendencia}
                  className="rounded-md border border-amber-300/40 bg-amber-50/50 p-3 text-sm"
                >
                  {pendencia}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ControlesFiltros
        filtros={filtros}
        provedores={provedores}
        transportadoras={transportadoras}
      />

      <Card>
        <CardHeader>
          <CardTitle>Provedores de Frete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={acaoCriarProvedor}
            className="grid gap-2 sm:grid-cols-3"
          >
            <Input
              name="identificador"
              placeholder="Identificador interno"
              required
            />
            <Input name="nome" placeholder="Nome para exibição" required />
            <Button type="submit">Criar</Button>
          </form>

          {provedoresPaginados.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhum provedor para este filtro.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {provedoresPaginados.map((provedor) => (
                <div key={provedor.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusAtivo ativo={provedor.ativo} />
                    <span className="text-muted-foreground text-sm">
                      {provedor.identificador}
                    </span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await acaoEditarProvedor(provedor.id, formData);
                    }}
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    <Input
                      name="identificador"
                      defaultValue={provedor.identificador}
                      required
                    />
                    <Input name="nome" defaultValue={provedor.nome} required />
                    <Button type="submit" variant="outline">
                      Salvar
                    </Button>
                  </form>
                  <LinhaAlternarAtivacao
                    ativo={provedor.ativo}
                    aoAlternar={async () => {
                      "use server";
                      await alternarProvedor(provedor.id, !provedor.ativo);
                    }}
                  />
                </div>
              ))}
              <PaginacaoSimples
                chavePagina="paginaProvedores"
                paginaAtual={paginacao.paginaProvedores}
                totalItens={provedoresFiltrados.length}
                tamanhoPagina={paginacao.tamanhoPagina}
                filtros={filtros}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={acaoCriarRegraCategoria}
            className="grid gap-2 sm:grid-cols-6"
          >
            <select
              name="categoriaId"
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
            <select
              name="efeito"
              defaultValue="bloquear"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="bloquear">Bloquear</option>
              <option value="permitir">Permitir</option>
            </select>
            <select
              name="provedorFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem provedor</option>
              {provedores.map((provedor) => (
                <option key={provedor.id} value={provedor.id}>
                  {provedor.nome}
                </option>
              ))}
            </select>
            <select
              name="transportadoraFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem transportadora</option>
              {transportadoras.map((transportadora) => (
                <option key={transportadora.id} value={transportadora.id}>
                  {transportadora.nome}
                </option>
              ))}
            </select>
            <select
              name="servicoFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem serviço</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome}
                </option>
              ))}
            </select>
            <Button type="submit">Criar Regra</Button>
          </form>

          {regrasCategoriasFiltradas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhuma regra de categoria para este filtro.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {regrasCategoriasFiltradas.map((regra) => (
                <div key={regra.id} className="rounded-md border p-3">
                  <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <StatusAtivo ativo={regra.ativo} />
                    <span>{regra.categoriaNome}</span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await acaoEditarRegraCategoria(regra.id, formData);
                    }}
                    className="grid gap-2 sm:grid-cols-6"
                  >
                    <select
                      name="categoriaId"
                      defaultValue={regra.categoriaId}
                      required
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="efeito"
                      defaultValue={regra.efeito}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="bloquear">Bloquear</option>
                      <option value="permitir">Permitir</option>
                    </select>
                    <select
                      name="provedorFreteId"
                      defaultValue={regra.provedorFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem provedor</option>
                      {provedores.map((provedor) => (
                        <option key={provedor.id} value={provedor.id}>
                          {provedor.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="transportadoraFreteId"
                      defaultValue={regra.transportadoraFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem transportadora</option>
                      {transportadoras.map((transportadora) => (
                        <option
                          key={transportadora.id}
                          value={transportadora.id}
                        >
                          {transportadora.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="servicoFreteId"
                      defaultValue={regra.servicoFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem serviço</option>
                      {servicos.map((servico) => (
                        <option key={servico.id} value={servico.id}>
                          {servico.nome}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="outline">
                      Salvar
                    </Button>
                  </form>
                  <div className="mt-3 flex gap-2">
                    <LinhaAlternarAtivacao
                      ativo={regra.ativo}
                      aoAlternar={async () => {
                        "use server";
                        await acaoAlternarRegraCategoria(
                          regra.id,
                          !regra.ativo,
                        );
                      }}
                    />
                    <form
                      action={async () => {
                        "use server";
                        await acaoRemoverRegraCategoria(regra.id);
                      }}
                    >
                      <Button type="submit" size="sm" variant="destructive">
                        Remover
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transportadoras</CardTitle>
          <p className="text-muted-foreground text-sm">
            Transportadoras retornadas pela Frenet aparecem aqui para ativação
            ou desativação operacional.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={acaoCriarTransportadora}
            className="grid gap-2 sm:grid-cols-4"
          >
            <select
              name="provedorFreteId"
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Selecione o provedor</option>
              {provedores.map((provedor) => (
                <option key={provedor.id} value={provedor.id}>
                  {provedor.nome}
                </option>
              ))}
            </select>
            <Input
              name="identificador"
              placeholder="Identificador interno"
              required
            />
            <Input name="nome" placeholder="Nome para exibição" required />
            <Button type="submit">Criar</Button>
          </form>

          {transportadorasPaginadas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhuma transportadora para este filtro.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transportadorasPaginadas.map((transportadora) => (
                <div key={transportadora.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusAtivo ativo={transportadora.ativo} />
                    <span className="text-muted-foreground text-sm">
                      {transportadora.identificador} •{" "}
                      {transportadora.provedorIdentificador}
                    </span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await acaoEditarTransportadora(
                        transportadora.id,
                        formData,
                      );
                    }}
                    className="grid gap-2 sm:grid-cols-4"
                  >
                    <select
                      name="provedorFreteId"
                      defaultValue={transportadora.provedorFreteId}
                      required
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      {provedores.map((provedor) => (
                        <option key={provedor.id} value={provedor.id}>
                          {provedor.nome}
                        </option>
                      ))}
                    </select>
                    <Input
                      name="identificador"
                      defaultValue={transportadora.identificador}
                      required
                    />
                    <Input
                      name="nome"
                      defaultValue={transportadora.nome}
                      required
                    />
                    <Button type="submit" variant="outline">
                      Salvar
                    </Button>
                    <Input
                      name="pesoMaximoEmGramas"
                      type="number"
                      defaultValue={campoLimite(
                        transportadora.pesoMaximoEmGramas,
                      )}
                      placeholder="pesoMaximoEmGramas"
                    />
                    <Input
                      name="alturaMaximaEmCm"
                      type="number"
                      defaultValue={campoLimite(
                        transportadora.alturaMaximaEmCm,
                      )}
                      placeholder="alturaMaximaEmCm"
                    />
                    <Input
                      name="larguraMaximaEmCm"
                      type="number"
                      defaultValue={campoLimite(
                        transportadora.larguraMaximaEmCm,
                      )}
                      placeholder="larguraMaximaEmCm"
                    />
                    <Input
                      name="comprimentoMaximoEmCm"
                      type="number"
                      defaultValue={campoLimite(
                        transportadora.comprimentoMaximoEmCm,
                      )}
                      placeholder="comprimentoMaximoEmCm"
                    />
                  </form>
                  <LinhaAlternarAtivacao
                    ativo={transportadora.ativo}
                    aoAlternar={async () => {
                      "use server";
                      await alternarTransportadora(
                        transportadora.id,
                        !transportadora.ativo,
                      );
                    }}
                  />
                </div>
              ))}
              <PaginacaoSimples
                chavePagina="paginaTransportadoras"
                paginaAtual={paginacao.paginaTransportadoras}
                totalItens={transportadorasFiltradas.length}
                tamanhoPagina={paginacao.tamanhoPagina}
                filtros={filtros}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
          <p className="text-muted-foreground text-sm">
            Serviços retornados por transportadora, como PAC, SEDEX e opções
            Jadlog, podem ser ativados ou desativados abaixo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={acaoCriarServico} className="grid gap-2 sm:grid-cols-5">
            <select
              name="provedorFreteId"
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Selecione o provedor</option>
              {provedores.map((provedor) => (
                <option key={provedor.id} value={provedor.id}>
                  {provedor.nome}
                </option>
              ))}
            </select>
            <select
              name="transportadoraFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem transportadora</option>
              {transportadoras.map((transportadora) => (
                <option key={transportadora.id} value={transportadora.id}>
                  {transportadora.nome}
                </option>
              ))}
            </select>
            <Input
              name="identificador"
              placeholder="Identificador interno"
              required
            />
            <Input name="nome" placeholder="Nome para exibição" required />
            <Button type="submit">Criar</Button>
          </form>

          {servicosPaginados.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhum serviço para este filtro.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {servicosPaginados.map((servico) => (
                <div key={servico.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusAtivo ativo={servico.ativo} />
                    <span className="text-muted-foreground text-sm">
                      {servico.identificador} • {servico.provedorIdentificador}
                    </span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await acaoEditarServico(servico.id, formData);
                    }}
                    className="grid gap-2 sm:grid-cols-5"
                  >
                    <select
                      name="provedorFreteId"
                      defaultValue={servico.provedorFreteId}
                      required
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      {provedores.map((provedor) => (
                        <option key={provedor.id} value={provedor.id}>
                          {provedor.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="transportadoraFreteId"
                      defaultValue={servico.transportadoraFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem transportadora</option>
                      {transportadoras.map((transportadora) => (
                        <option
                          key={transportadora.id}
                          value={transportadora.id}
                        >
                          {transportadora.nome}
                        </option>
                      ))}
                    </select>
                    <Input
                      name="identificador"
                      defaultValue={servico.identificador}
                      required
                    />
                    <Input name="nome" defaultValue={servico.nome} required />
                    <Button type="submit" variant="outline">
                      Salvar
                    </Button>
                    <Input
                      name="pesoMaximoEmGramas"
                      type="number"
                      defaultValue={campoLimite(servico.pesoMaximoEmGramas)}
                      placeholder="pesoMaximoEmGramas"
                    />
                    <Input
                      name="alturaMaximaEmCm"
                      type="number"
                      defaultValue={campoLimite(servico.alturaMaximaEmCm)}
                      placeholder="alturaMaximaEmCm"
                    />
                    <Input
                      name="larguraMaximaEmCm"
                      type="number"
                      defaultValue={campoLimite(servico.larguraMaximaEmCm)}
                      placeholder="larguraMaximaEmCm"
                    />
                    <Input
                      name="comprimentoMaximoEmCm"
                      type="number"
                      defaultValue={campoLimite(servico.comprimentoMaximoEmCm)}
                      placeholder="comprimentoMaximoEmCm"
                    />
                  </form>
                  <LinhaAlternarAtivacao
                    ativo={servico.ativo}
                    aoAlternar={async () => {
                      "use server";
                      await alternarServico(servico.id, !servico.ativo);
                    }}
                  />
                </div>
              ))}
              <PaginacaoSimples
                chavePagina="paginaServicos"
                paginaAtual={paginacao.paginaServicos}
                totalItens={servicosFiltrados.length}
                tamanhoPagina={paginacao.tamanhoPagina}
                filtros={filtros}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras por Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={acaoCriarRegraProduto}
            className="grid gap-2 sm:grid-cols-6"
          >
            <select
              name="produtoId"
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Produto</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
            <select
              name="efeito"
              defaultValue="bloquear"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="bloquear">Bloquear</option>
              <option value="permitir">Permitir</option>
            </select>
            <select
              name="provedorFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem provedor</option>
              {provedores.map((provedor) => (
                <option key={provedor.id} value={provedor.id}>
                  {provedor.nome}
                </option>
              ))}
            </select>
            <select
              name="transportadoraFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem transportadora</option>
              {transportadoras.map((transportadora) => (
                <option key={transportadora.id} value={transportadora.id}>
                  {transportadora.nome}
                </option>
              ))}
            </select>
            <select
              name="servicoFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem serviço</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome}
                </option>
              ))}
            </select>
            <Button type="submit">Criar Regra</Button>
          </form>

          {regrasProdutosFiltradas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhuma regra de produto para este filtro.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {regrasProdutosFiltradas.map((regra) => (
                <div key={regra.id} className="rounded-md border p-3">
                  <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <StatusAtivo ativo={regra.ativo} />
                    <span>{regra.produtoNome}</span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await acaoEditarRegraProduto(regra.id, formData);
                    }}
                    className="grid gap-2 sm:grid-cols-6"
                  >
                    <select
                      name="produtoId"
                      defaultValue={regra.produtoId}
                      required
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>
                          {produto.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="efeito"
                      defaultValue={regra.efeito}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="bloquear">Bloquear</option>
                      <option value="permitir">Permitir</option>
                    </select>
                    <select
                      name="provedorFreteId"
                      defaultValue={regra.provedorFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem provedor</option>
                      {provedores.map((provedor) => (
                        <option key={provedor.id} value={provedor.id}>
                          {provedor.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="transportadoraFreteId"
                      defaultValue={regra.transportadoraFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem transportadora</option>
                      {transportadoras.map((transportadora) => (
                        <option
                          key={transportadora.id}
                          value={transportadora.id}
                        >
                          {transportadora.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="servicoFreteId"
                      defaultValue={regra.servicoFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem serviço</option>
                      {servicos.map((servico) => (
                        <option key={servico.id} value={servico.id}>
                          {servico.nome}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="outline">
                      Salvar
                    </Button>
                  </form>
                  <div className="mt-3 flex gap-2">
                    <LinhaAlternarAtivacao
                      ativo={regra.ativo}
                      aoAlternar={async () => {
                        "use server";
                        await acaoAlternarRegraProduto(regra.id, !regra.ativo);
                      }}
                    />
                    <form
                      action={async () => {
                        "use server";
                        await acaoRemoverRegraProduto(regra.id);
                      }}
                    >
                      <Button type="submit" size="sm" variant="destructive">
                        Remover
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos Logísticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={acaoCriarTipoLogistico}
            className="grid gap-2 sm:grid-cols-4"
          >
            <Input name="identificador" placeholder="identificador" required />
            <Input name="nome" placeholder="nome" required />
            <Input name="descricao" placeholder="descrição (opcional)" />
            <Button type="submit">Criar Tipo</Button>
          </form>

          {tiposLogisticos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhum tipo logístico cadastrado.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tiposLogisticos.map((tipo) => (
                <div key={tipo.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusAtivo ativo={tipo.ativo} />
                    <span className="text-muted-foreground text-sm">
                      {tipo.nome}
                    </span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await acaoEditarTipoLogistico(tipo.id, formData);
                    }}
                    className="grid gap-2 sm:grid-cols-4"
                  >
                    <Input
                      name="identificador"
                      defaultValue={tipo.identificador}
                      required
                    />
                    <Input name="nome" defaultValue={tipo.nome} required />
                    <Input
                      name="descricao"
                      defaultValue={tipo.descricao ?? ""}
                    />
                    <Button type="submit" variant="outline">
                      Salvar
                    </Button>
                  </form>
                  <div className="mt-3 flex gap-2">
                    <LinhaAlternarAtivacao
                      ativo={tipo.ativo}
                      aoAlternar={async () => {
                        "use server";
                        await acaoAlternarTipoLogistico(tipo.id, !tipo.ativo);
                      }}
                    />
                    <form
                      action={async () => {
                        "use server";
                        await acaoRemoverTipoLogistico(tipo.id);
                      }}
                    >
                      <Button type="submit" size="sm" variant="destructive">
                        Remover
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vínculos Produto x Tipo Logístico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={acaoVincularProdutoTipoLogistico}
            className="grid gap-2 sm:grid-cols-3"
          >
            <select
              name="produtoId"
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Produto</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
            <select
              name="tipoLogisticoId"
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Tipo logístico</option>
              {tiposLogisticos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
            <Button type="submit">Vincular</Button>
          </form>

          {produtosVinculadosTiposLogisticos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhum vínculo encontrado.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {produtosVinculadosTiposLogisticos.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="text-sm">
                    {vinculo.produtoNome} • {vinculo.tipoLogisticoNome}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await acaoDesvincularProdutoTipoLogistico(vinculo.id);
                    }}
                  >
                    <Button type="submit" size="sm" variant="destructive">
                      Desvincular
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras por Tipo Logístico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={acaoCriarRegraTipoLogistico}
            className="grid gap-2 sm:grid-cols-6"
          >
            <select
              name="tipoLogisticoId"
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Tipo logístico</option>
              {tiposLogisticos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
            <select
              name="efeito"
              defaultValue="bloquear"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="bloquear">Bloquear</option>
              <option value="permitir">Permitir</option>
            </select>
            <select
              name="provedorFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem provedor</option>
              {provedores.map((provedor) => (
                <option key={provedor.id} value={provedor.id}>
                  {provedor.nome}
                </option>
              ))}
            </select>
            <select
              name="transportadoraFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem transportadora</option>
              {transportadoras.map((transportadora) => (
                <option key={transportadora.id} value={transportadora.id}>
                  {transportadora.nome}
                </option>
              ))}
            </select>
            <select
              name="servicoFreteId"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem serviço</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome}
                </option>
              ))}
            </select>
            <Button type="submit">Criar Regra</Button>
          </form>

          {regrasTiposLogisticos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Nenhuma regra de tipo logístico cadastrada.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {regrasTiposLogisticos.map((regra) => (
                <div key={regra.id} className="rounded-md border p-3">
                  <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <StatusAtivo ativo={regra.ativo} />
                    <span>{regra.tipoLogisticoNome}</span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await acaoEditarRegraTipoLogistico(regra.id, formData);
                    }}
                    className="grid gap-2 sm:grid-cols-6"
                  >
                    <select
                      name="tipoLogisticoId"
                      defaultValue={regra.tipoLogisticoId}
                      required
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      {tiposLogisticos.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="efeito"
                      defaultValue={regra.efeito}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="bloquear">Bloquear</option>
                      <option value="permitir">Permitir</option>
                    </select>
                    <select
                      name="provedorFreteId"
                      defaultValue={regra.provedorFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem provedor</option>
                      {provedores.map((provedor) => (
                        <option key={provedor.id} value={provedor.id}>
                          {provedor.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="transportadoraFreteId"
                      defaultValue={regra.transportadoraFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem transportadora</option>
                      {transportadoras.map((transportadora) => (
                        <option
                          key={transportadora.id}
                          value={transportadora.id}
                        >
                          {transportadora.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="servicoFreteId"
                      defaultValue={regra.servicoFreteId ?? ""}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Sem serviço</option>
                      {servicos.map((servico) => (
                        <option key={servico.id} value={servico.id}>
                          {servico.nome}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="outline">
                      Salvar
                    </Button>
                  </form>
                  <div className="mt-3 flex gap-2">
                    <LinhaAlternarAtivacao
                      ativo={regra.ativo}
                      aoAlternar={async () => {
                        "use server";
                        await acaoAlternarRegraTipoLogistico(
                          regra.id,
                          !regra.ativo,
                        );
                      }}
                    />
                    <form
                      action={async () => {
                        "use server";
                        await acaoRemoverRegraTipoLogistico(regra.id);
                      }}
                    >
                      <Button type="submit" size="sm" variant="destructive">
                        Remover
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
