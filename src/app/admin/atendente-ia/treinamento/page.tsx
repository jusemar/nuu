import { PaginaInicioTreinamento } from "@/features/atendimento-ia/components/admin/inicio/pagina-inicio-treinamento";
import { buscarResumoTreinamento } from "@/features/atendimento-ia/queries/admin/inicio/buscar-resumo-treinamento";
import { exigirCapacidadeAtendimentoIa } from "@/features/atendimento-ia/queries/admin/permissoes/buscar-acesso-atendimento-ia";

export default async function TreinamentoAtendenteIaPage() {
  await exigirCapacidadeAtendimentoIa("modulo_visualizar");
  const resumo = await buscarResumoTreinamento();
  return <PaginaInicioTreinamento resumo={resumo} />;
}
