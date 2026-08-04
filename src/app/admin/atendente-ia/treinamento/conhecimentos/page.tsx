import { PaginaConhecimentos } from "@/features/atendimento-ia/components/admin/conhecimentos/pagina-conhecimentos";
import { listarComportamentosAdmin } from "@/features/atendimento-ia/queries/admin/comportamento/listar-comportamentos";
import { listarConhecimentosAdmin } from "@/features/atendimento-ia/queries/admin/conhecimentos/listar-conhecimentos";
import { listarVersoesConhecimentoAdmin } from "@/features/atendimento-ia/queries/admin/conhecimentos/listar-versoes";
import { exigirCapacidadeAtendimentoIa } from "@/features/atendimento-ia/queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { buscarElegibilidadePublicacaoAdmin } from "@/features/atendimento-ia/queries/admin/publicacao/buscar-elegibilidade-publicacao";

export default async function ConhecimentosAtendenteIaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const acesso = await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const parametros = await searchParams;
  const resultado = await listarConhecimentosAdmin({
    busca: typeof parametros.busca === "string" ? parametros.busca : undefined,
    limite: 20,
    pagina: typeof parametros.pagina === "string" ? parametros.pagina : 1,
  });
  const comportamentos = await listarComportamentosAdmin();
  const historicos = Object.fromEntries(
    await Promise.all(
      resultado.itens.map(async (item) => [
        item.id,
        await listarVersoesConhecimentoAdmin(item.id),
      ]),
    ),
  );
  const candidatos = [
    ...resultado.itens.flatMap((item) =>
      item.versaoAtualId
        ? [
            {
              id: item.versaoAtualId,
              tipo:
                item.tipoConhecimento === "pergunta_resposta"
                  ? ("pergunta_resposta" as const)
                  : ("conhecimento" as const),
            },
          ]
        : [],
    ),
    ...comportamentos.flatMap((item) =>
      item.versao
        ? [{ id: item.versao.id, tipo: "comportamento" as const }]
        : [],
    ),
  ];
  const elegibilidades = Object.fromEntries(
    await Promise.all(
      candidatos.map(async (candidato) => {
        try {
          const valor = await buscarElegibilidadePublicacaoAdmin({
            candidatoId: candidato.id,
            tipo: candidato.tipo,
          });
          return [
            candidato.id,
            {
              status: valor.status,
              hashAvaliado: valor.hashAvaliado,
              bloqueios: valor.bloqueios,
              alertas: valor.alertas,
              revisao: valor.revisaoConsiderada.estado,
              execucoes: valor.execucoesConsideradas.length,
              casosObrigatorios: valor.casosObrigatorios.length,
            },
          ];
        } catch {
          return [candidato.id, null];
        }
      }),
    ),
  );
  return (
    <PaginaConhecimentos
      conhecimentos={resultado.itens}
      comportamentos={comportamentos}
      historicos={historicos}
      podeEscrever={acesso.capacidades.includes("rascunhos_escrita")}
      podePublicar={acesso.papel === "gestor_principal"}
      podeRestaurar={acesso.capacidades.includes("restauracoes_escrita")}
      elegibilidades={elegibilidades}
    />
  );
}
