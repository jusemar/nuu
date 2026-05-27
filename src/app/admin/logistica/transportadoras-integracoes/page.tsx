import {
  alternarProvedorFrete,
  alternarServicoFrete,
  alternarTransportadoraFrete,
  criarProvedorFrete,
  criarServicoFrete,
  criarTransportadoraFrete,
  editarProvedorFrete,
  editarServicoFrete,
  editarTransportadoraFrete,
  sincronizarCatalogoFrenet,
} from "@/features/admin/logistica/actions/frete";
import {
  alternarRegraCategoriaFrete,
  criarRegraCategoriaFrete,
  editarRegraCategoriaFrete,
  removerRegraCategoriaFrete,
} from "@/features/admin/logistica/actions/regras-categorias";
import {
  alternarRegraProdutoFrete,
  criarRegraProdutoFrete,
  editarRegraProdutoFrete,
  removerRegraProdutoFrete,
} from "@/features/admin/logistica/actions/regras-produtos";
import { PaginaFreteAdminSimples } from "@/features/admin/logistica/components/frete/pagina-frete-admin-simples";
import {
  listarProvedoresFrete,
  listarServicosFrete,
  listarTransportadorasFrete,
} from "@/features/admin/logistica/queries/frete";
import {
  listarCategoriasFrete,
  listarRegrasCategoriasFrete,
} from "@/features/admin/logistica/queries/regras-categorias";
import {
  listarProdutosFrete,
  listarRegrasProdutosFrete,
} from "@/features/admin/logistica/queries/regras-produtos";
import {
  alternarRegraTipoLogisticoFrete,
  alternarTipoLogistico,
  criarRegraTipoLogisticoFrete,
  criarTipoLogistico,
  desvincularProdutoTipoLogistico,
  editarRegraTipoLogisticoFrete,
  editarTipoLogistico,
  removerRegraTipoLogisticoFrete,
  removerTipoLogistico,
  vincularProdutoTipoLogistico,
} from "@/features/admin/logistica/actions/tipos-logisticos";
import {
  listarProdutosVinculadosTiposLogisticos,
  listarRegrasTiposLogisticosFrete,
  listarTiposLogisticos,
} from "@/features/admin/logistica/queries/tipos-logisticos";
import { redirect } from "next/navigation";

type ParametrosPagina = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valorTexto(parametro: string | string[] | undefined, padrao = "") {
  if (Array.isArray(parametro)) return parametro[0] ?? padrao;
  return parametro ?? padrao;
}

function valorNumero(parametro: string | string[] | undefined, padrao = 1) {
  const valor = Number(valorTexto(parametro));
  if (!Number.isFinite(valor) || valor < 1) return padrao;
  return Math.floor(valor);
}

export default async function TransportadorasIntegracoesPage({
  searchParams,
}: ParametrosPagina) {
  const filtrosAtual = (await searchParams) ?? {};
  const ativo = valorTexto(filtrosAtual.ativo, "todos");
  const provedorFreteId = valorTexto(filtrosAtual.provedorFreteId);
  const transportadoraFreteId = valorTexto(filtrosAtual.transportadoraFreteId);
  const paginaProvedores = valorNumero(filtrosAtual.paginaProvedores, 1);
  const paginaTransportadoras = valorNumero(
    filtrosAtual.paginaTransportadoras,
    1,
  );
  const paginaServicos = valorNumero(filtrosAtual.paginaServicos, 1);
  const tipoMensagem = valorTexto(filtrosAtual.tipoMensagem);
  const textoMensagem = valorTexto(filtrosAtual.textoMensagem);

  const [
    provedores,
    transportadoras,
    servicos,
    categorias,
    regrasCategorias,
    produtos,
    regrasProdutos,
    tiposLogisticos,
    produtosVinculadosTiposLogisticos,
    regrasTiposLogisticos,
  ] = await Promise.all([
    listarProvedoresFrete(),
    listarTransportadorasFrete(),
    listarServicosFrete(),
    listarCategoriasFrete(),
    listarRegrasCategoriasFrete(),
    listarProdutosFrete(),
    listarRegrasProdutosFrete(),
    listarTiposLogisticos(),
    listarProdutosVinculadosTiposLogisticos(),
    listarRegrasTiposLogisticosFrete(),
  ]);
  const provedorFrenet = provedores.find(
    (provedor) => provedor.identificador.toLowerCase() === "frenet",
  );
  const cepOrigemFrenet =
    process.env.FRENET_CEP_ORIGEM?.replace(/\D/g, "") ?? "";

  async function redirecionarComResultado(
    resposta: { sucesso: boolean; erro?: string },
    textoSucesso = "Operação concluída.",
    ancora = "",
  ) {
    "use server";
    const sufixo = resposta.sucesso
      ? `tipoMensagem=sucesso&textoMensagem=${encodeURIComponent(textoSucesso)}`
      : `tipoMensagem=erro&textoMensagem=${encodeURIComponent(
          resposta.erro ?? "Falha na operação.",
        )}`;

    redirect(
      `/admin/logistica/transportadoras-integracoes?ativo=${ativo}&provedorFreteId=${provedorFreteId}&transportadoraFreteId=${transportadoraFreteId}&paginaProvedores=${paginaProvedores}&paginaTransportadoras=${paginaTransportadoras}&paginaServicos=${paginaServicos}&${sufixo}${ancora}`,
    );
  }

  return (
    <PaginaFreteAdminSimples
      provedores={provedores}
      transportadoras={transportadoras}
      servicos={servicos}
      categorias={categorias}
      regrasCategorias={regrasCategorias}
      produtos={produtos}
      regrasProdutos={regrasProdutos}
      tiposLogisticos={tiposLogisticos}
      produtosVinculadosTiposLogisticos={produtosVinculadosTiposLogisticos}
      regrasTiposLogisticos={regrasTiposLogisticos}
      filtros={{
        ativo: ativo === "ativos" || ativo === "inativos" ? ativo : "todos",
        provedorFreteId,
        transportadoraFreteId,
      }}
      paginacao={{
        paginaProvedores,
        paginaTransportadoras,
        paginaServicos,
        tamanhoPagina: 5,
      }}
      mensagem={
        tipoMensagem === "sucesso" || tipoMensagem === "erro"
          ? { tipo: tipoMensagem, texto: textoMensagem }
          : null
      }
      statusIntegracaoFrenet={{
        ativo: provedorFrenet?.ativo ?? false,
        tokenConfigurado: Boolean(process.env.FRENET_TOKEN?.trim()),
        cepOrigem: cepOrigemFrenet.length === 8 ? cepOrigemFrenet : null,
        ultimaCotacaoTeste: null,
      }}
      alternarProvedor={async (id, ativoAtualizado) => {
        "use server";
        const resposta = await alternarProvedorFrete(id, {
          ativo: ativoAtualizado,
        });
        await redirecionarComResultado(resposta);
      }}
      alternarTransportadora={async (id, ativoAtualizado) => {
        "use server";
        const resposta = await alternarTransportadoraFrete(id, {
          ativo: ativoAtualizado,
        });
        await redirecionarComResultado(resposta);
      }}
      alternarServico={async (id, ativoAtualizado) => {
        "use server";
        const resposta = await alternarServicoFrete(id, {
          ativo: ativoAtualizado,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoSincronizarCatalogoFrenet={async (formData) => {
        "use server";
        const resposta = await sincronizarCatalogoFrenet({
          cepDestino: String(formData.get("cepDestino") ?? ""),
          pesoEmKg: String(formData.get("pesoEmKg") ?? ""),
          alturaEmCm: String(formData.get("alturaEmCm") ?? ""),
          larguraEmCm: String(formData.get("larguraEmCm") ?? ""),
          comprimentoEmCm: String(formData.get("comprimentoEmCm") ?? ""),
        });

        await redirecionarComResultado(
          resposta,
          resposta.sucesso
            ? `Catálogo sincronizado: ${resposta.dados.transportadoras} transportadora(s) e ${resposta.dados.servicos} serviço(s) retornado(s) pela Frenet.`
            : "",
          "#configuracao-frenet",
        );
      }}
      acaoCriarProvedor={async (formData) => {
        "use server";
        const resposta = await criarProvedorFrete({
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
          ativo: true,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoEditarProvedor={async (id, formData) => {
        "use server";
        const resposta = await editarProvedorFrete(id, {
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
        });
        await redirecionarComResultado(resposta);
      }}
      acaoCriarTransportadora={async (formData) => {
        "use server";
        const resposta = await criarTransportadoraFrete({
          provedorFreteId: String(formData.get("provedorFreteId") ?? ""),
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
          ativo: true,
          pesoMaximoEmGramas: null,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoEditarTransportadora={async (id, formData) => {
        "use server";
        const resposta = await editarTransportadoraFrete(id, {
          provedorFreteId: String(formData.get("provedorFreteId") ?? ""),
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
          pesoMaximoEmGramas:
            Number(formData.get("pesoMaximoEmGramas") ?? 0) || null,
          alturaMaximaEmCm:
            Number(formData.get("alturaMaximaEmCm") ?? 0) || null,
          larguraMaximaEmCm:
            Number(formData.get("larguraMaximaEmCm") ?? 0) || null,
          comprimentoMaximoEmCm:
            Number(formData.get("comprimentoMaximoEmCm") ?? 0) || null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoCriarServico={async (formData) => {
        "use server";
        const transportadora = String(
          formData.get("transportadoraFreteId") ?? "",
        ).trim();
        const resposta = await criarServicoFrete({
          provedorFreteId: String(formData.get("provedorFreteId") ?? ""),
          transportadoraFreteId:
            transportadora.length > 0 ? transportadora : null,
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
          ativo: true,
          pesoMaximoEmGramas: null,
          alturaMaximaEmCm: null,
          larguraMaximaEmCm: null,
          comprimentoMaximoEmCm: null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoEditarServico={async (id, formData) => {
        "use server";
        const transportadora = String(
          formData.get("transportadoraFreteId") ?? "",
        ).trim();
        const resposta = await editarServicoFrete(id, {
          provedorFreteId: String(formData.get("provedorFreteId") ?? ""),
          transportadoraFreteId:
            transportadora.length > 0 ? transportadora : null,
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
          pesoMaximoEmGramas:
            Number(formData.get("pesoMaximoEmGramas") ?? 0) || null,
          alturaMaximaEmCm:
            Number(formData.get("alturaMaximaEmCm") ?? 0) || null,
          larguraMaximaEmCm:
            Number(formData.get("larguraMaximaEmCm") ?? 0) || null,
          comprimentoMaximoEmCm:
            Number(formData.get("comprimentoMaximoEmCm") ?? 0) || null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoCriarRegraCategoria={async (formData) => {
        "use server";
        const resposta = await criarRegraCategoriaFrete({
          categoriaId: String(formData.get("categoriaId") ?? ""),
          efeito: String(formData.get("efeito") ?? "bloquear"),
          provedorFreteId:
            String(formData.get("provedorFreteId") ?? "").trim() || null,
          transportadoraFreteId:
            String(formData.get("transportadoraFreteId") ?? "").trim() || null,
          servicoFreteId:
            String(formData.get("servicoFreteId") ?? "").trim() || null,
          ativo: true,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoEditarRegraCategoria={async (id, formData) => {
        "use server";
        const resposta = await editarRegraCategoriaFrete(id, {
          categoriaId: String(formData.get("categoriaId") ?? ""),
          efeito: String(formData.get("efeito") ?? "bloquear"),
          provedorFreteId:
            String(formData.get("provedorFreteId") ?? "").trim() || null,
          transportadoraFreteId:
            String(formData.get("transportadoraFreteId") ?? "").trim() || null,
          servicoFreteId:
            String(formData.get("servicoFreteId") ?? "").trim() || null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoAlternarRegraCategoria={async (id, ativoAtualizado) => {
        "use server";
        const resposta = await alternarRegraCategoriaFrete(id, ativoAtualizado);
        await redirecionarComResultado(resposta);
      }}
      acaoRemoverRegraCategoria={async (id) => {
        "use server";
        const resposta = await removerRegraCategoriaFrete(id);
        await redirecionarComResultado(resposta);
      }}
      acaoCriarRegraProduto={async (formData) => {
        "use server";
        const resposta = await criarRegraProdutoFrete({
          produtoId: String(formData.get("produtoId") ?? ""),
          efeito: String(formData.get("efeito") ?? "bloquear"),
          provedorFreteId:
            String(formData.get("provedorFreteId") ?? "").trim() || null,
          transportadoraFreteId:
            String(formData.get("transportadoraFreteId") ?? "").trim() || null,
          servicoFreteId:
            String(formData.get("servicoFreteId") ?? "").trim() || null,
          ativo: true,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoEditarRegraProduto={async (id, formData) => {
        "use server";
        const resposta = await editarRegraProdutoFrete(id, {
          produtoId: String(formData.get("produtoId") ?? ""),
          efeito: String(formData.get("efeito") ?? "bloquear"),
          provedorFreteId:
            String(formData.get("provedorFreteId") ?? "").trim() || null,
          transportadoraFreteId:
            String(formData.get("transportadoraFreteId") ?? "").trim() || null,
          servicoFreteId:
            String(formData.get("servicoFreteId") ?? "").trim() || null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoAlternarRegraProduto={async (id, ativoAtualizado) => {
        "use server";
        const resposta = await alternarRegraProdutoFrete(id, ativoAtualizado);
        await redirecionarComResultado(resposta);
      }}
      acaoRemoverRegraProduto={async (id) => {
        "use server";
        const resposta = await removerRegraProdutoFrete(id);
        await redirecionarComResultado(resposta);
      }}
      acaoCriarTipoLogistico={async (formData) => {
        "use server";
        const resposta = await criarTipoLogistico({
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
          descricao: String(formData.get("descricao") ?? "").trim() || null,
          ativo: true,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoEditarTipoLogistico={async (id, formData) => {
        "use server";
        const resposta = await editarTipoLogistico(id, {
          identificador: String(formData.get("identificador") ?? ""),
          nome: String(formData.get("nome") ?? ""),
          descricao: String(formData.get("descricao") ?? "").trim() || null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoAlternarTipoLogistico={async (id, ativoAtualizado) => {
        "use server";
        const resposta = await alternarTipoLogistico(id, ativoAtualizado);
        await redirecionarComResultado(resposta);
      }}
      acaoRemoverTipoLogistico={async (id) => {
        "use server";
        const resposta = await removerTipoLogistico(id);
        await redirecionarComResultado(resposta);
      }}
      acaoVincularProdutoTipoLogistico={async (formData) => {
        "use server";
        const resposta = await vincularProdutoTipoLogistico({
          produtoId: String(formData.get("produtoId") ?? ""),
          tipoLogisticoId: String(formData.get("tipoLogisticoId") ?? ""),
        });
        await redirecionarComResultado(resposta);
      }}
      acaoDesvincularProdutoTipoLogistico={async (id) => {
        "use server";
        const resposta = await desvincularProdutoTipoLogistico(id);
        await redirecionarComResultado(resposta);
      }}
      acaoCriarRegraTipoLogistico={async (formData) => {
        "use server";
        const resposta = await criarRegraTipoLogisticoFrete({
          tipoLogisticoId: String(formData.get("tipoLogisticoId") ?? ""),
          efeito: String(formData.get("efeito") ?? "bloquear"),
          provedorFreteId:
            String(formData.get("provedorFreteId") ?? "").trim() || null,
          transportadoraFreteId:
            String(formData.get("transportadoraFreteId") ?? "").trim() || null,
          servicoFreteId:
            String(formData.get("servicoFreteId") ?? "").trim() || null,
          ativo: true,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoEditarRegraTipoLogistico={async (id, formData) => {
        "use server";
        const resposta = await editarRegraTipoLogisticoFrete(id, {
          tipoLogisticoId: String(formData.get("tipoLogisticoId") ?? ""),
          efeito: String(formData.get("efeito") ?? "bloquear"),
          provedorFreteId:
            String(formData.get("provedorFreteId") ?? "").trim() || null,
          transportadoraFreteId:
            String(formData.get("transportadoraFreteId") ?? "").trim() || null,
          servicoFreteId:
            String(formData.get("servicoFreteId") ?? "").trim() || null,
        });
        await redirecionarComResultado(resposta);
      }}
      acaoAlternarRegraTipoLogistico={async (id, ativoAtualizado) => {
        "use server";
        const resposta = await alternarRegraTipoLogisticoFrete(
          id,
          ativoAtualizado,
        );
        await redirecionarComResultado(resposta);
      }}
      acaoRemoverRegraTipoLogistico={async (id) => {
        "use server";
        const resposta = await removerRegraTipoLogisticoFrete(id);
        await redirecionarComResultado(resposta);
      }}
    />
  );
}
