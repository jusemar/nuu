import { PaginaVisaoGeralLogistica } from "@/features/admin/logistica/components/operacao/paginas-logistica-operacional";
import {
  listarProvedoresFrete,
  listarServicosFrete,
} from "@/features/admin/logistica/queries/frete";
import { listarRegrasCategoriasFrete } from "@/features/admin/logistica/queries/regras-categorias";
import { listarRegrasProdutosFrete } from "@/features/admin/logistica/queries/regras-produtos";
import {
  listarProdutosVinculadosTiposLogisticos,
  listarRegrasTiposLogisticosFrete,
} from "@/features/admin/logistica/queries/tipos-logisticos";

export default async function VisaoGeralLogisticaPage() {
  const [provedores, servicos, regrasCategorias, regrasProdutos, regrasClassificacoes, vinculosClassificacoes] =
    await Promise.all([
      listarProvedoresFrete(),
      listarServicosFrete(),
      listarRegrasCategoriasFrete(),
      listarRegrasProdutosFrete(),
      listarRegrasTiposLogisticosFrete(),
      listarProdutosVinculadosTiposLogisticos(),
    ]);
  const regras = [...regrasCategorias, ...regrasProdutos, ...regrasClassificacoes];
  const regrasAtivas = regras.filter((regra) => regra.ativo);
  const frenet = provedores.find((provedor) => provedor.identificador.toLowerCase() === "frenet");
  const servicosSemConfiguracao = servicos.filter((servico) => !servico.ativo).length;
  const regrasBloqueandoServicos = regrasAtivas.filter(
    (regra) => regra.efeito === "bloquear",
  ).length;
  const frenetConectada = Boolean(
    frenet?.ativo &&
      process.env.FRENET_TOKEN?.trim() &&
      process.env.FRENET_CEP_ORIGEM?.replace(/\D/g, "").length === 8,
  );
  const alertasOperacionais =
    (frenetConectada ? 0 : 1) + servicosSemConfiguracao + regrasBloqueandoServicos;

  return (
    <PaginaVisaoGeralLogistica
      integracoesAtivas={provedores.filter((provedor) => provedor.ativo).length}
      servicosAtivos={servicos.filter((servico) => servico.ativo).length}
      regrasAtivas={regrasAtivas.length}
      produtosClassificados={new Set(vinculosClassificacoes.map((vinculo) => vinculo.produtoId)).size}
      alertasOperacionais={alertasOperacionais}
      frenetConectada={frenetConectada}
      servicosSemConfiguracao={servicosSemConfiguracao}
      produtosSemDimensoes={null}
      regrasBloqueandoServicos={regrasBloqueandoServicos}
    />
  );
}
