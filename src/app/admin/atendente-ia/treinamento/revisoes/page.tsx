import { PaginaRevisoes } from "@/features/atendimento-ia/components/admin/revisoes/pagina-revisoes";
import { exigirCapacidadeAtendimentoIa } from "@/features/atendimento-ia/queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { buscarConversaSanitizadaAdmin } from "@/features/atendimento-ia/queries/admin/revisoes/buscar-conversa-sanitizada";
import { listarConversasRevisaoAdmin } from "@/features/atendimento-ia/queries/admin/revisoes/listar-conversas-revisao";
import { listarPropostasAdmin } from "@/features/atendimento-ia/queries/admin/revisoes/listar-propostas";
import { listarRevisoesFormaisAdmin } from "@/features/atendimento-ia/queries/admin/revisoes/listar-revisoes-formais";

export default async function RevisoesAtendenteIaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const acesso = await exigirCapacidadeAtendimentoIa(
    "conversas_sanitizadas_leitura",
  );
  const parametros = await searchParams;
  const resultado = await listarConversasRevisaoAdmin({
    limite: 20,
    pagina: typeof parametros.pagina === "string" ? parametros.pagina : 1,
  });
  const conversaId =
    typeof parametros.conversa === "string" ? parametros.conversa : undefined;
  const [detalhe, propostas, revisoes] = await Promise.all([
    conversaId ? buscarConversaSanitizadaAdmin(conversaId) : null,
    listarPropostasAdmin({ limite: 20, pagina: 1 }),
    listarRevisoesFormaisAdmin({ limite: 20, pagina: 1 }),
  ]);
  return (
    <PaginaRevisoes
      conversas={resultado.itens}
      detalhe={detalhe}
      podeDecidir={acesso.capacidades.includes("revisoes_decisao")}
      podeEscrever={acesso.capacidades.includes("avaliacoes_escrita")}
      propostas={propostas.itens}
      revisoes={revisoes.itens}
    />
  );
}
