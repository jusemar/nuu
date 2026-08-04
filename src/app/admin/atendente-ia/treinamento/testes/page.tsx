import { PaginaTestes } from "@/features/atendimento-ia/components/admin/testes/pagina-testes";
import { PainelLaboratorio } from "@/features/atendimento-ia/components/admin/testes/painel-laboratorio";
import { listarComportamentosAdmin } from "@/features/atendimento-ia/queries/admin/comportamento/listar-comportamentos";
import { listarConhecimentosAdmin } from "@/features/atendimento-ia/queries/admin/conhecimentos/listar-conhecimentos";
import { exigirCapacidadeAtendimentoIa } from "@/features/atendimento-ia/queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { buscarElegibilidadePublicacaoAdmin } from "@/features/atendimento-ia/queries/admin/publicacao/buscar-elegibilidade-publicacao";
import { listarCasosTesteAdmin } from "@/features/atendimento-ia/queries/admin/testes/listar-casos-teste";
import { listarConjuntosTesteAdmin } from "@/features/atendimento-ia/queries/admin/testes/listar-conjuntos-teste";
import { listarExecucoesLaboratorioAdmin } from "@/features/atendimento-ia/queries/admin/testes/listar-execucoes-laboratorio";
import { listarResultadosLaboratorioAdmin } from "@/features/atendimento-ia/queries/admin/testes/listar-resultados-laboratorio";
import { listarVersoesCasoTesteAdmin } from "@/features/atendimento-ia/queries/admin/testes/listar-versoes-caso-teste";

export default async function TestesAtendenteIaPage() {
  const acesso = await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [casos, conjuntos, conhecimentos, comportamentos, execucoes] =
    await Promise.all([
      listarCasosTesteAdmin(),
      listarConjuntosTesteAdmin(),
      listarConhecimentosAdmin({ pagina: 1, limite: 100 }),
      listarComportamentosAdmin(),
      listarExecucoesLaboratorioAdmin(),
    ]);
  const casosComHistorico = await Promise.all(
    casos.map(async (caso) => ({
      ...caso,
      historico: (await listarVersoesCasoTesteAdmin(caso.id)).map((versao) => ({
        id: versao.id,
        numeroVersao: versao.numeroVersao,
        estado: versao.estado,
        hash: versao.hash,
      })),
    })),
  );
  const resultados = (
    await Promise.all(
      execucoes.map((execucao) =>
        listarResultadosLaboratorioAdmin(execucao.id),
      ),
    )
  ).flat();
  const elegibilidadesExecucoes = Object.fromEntries(
    await Promise.all(
      execucoes.map(async (execucao) => {
        const alvo =
          execucao.tipoComparacao === "combinado" ||
          execucao.tipoComparacao === "lote"
            ? { candidatoId: execucao.id, tipo: "lote" as const }
            : execucao.tipoComparacao === "comportamento" &&
                execucao.versaoCandidataComportamentoId
              ? {
                  candidatoId: execucao.versaoCandidataComportamentoId,
                  tipo: "comportamento" as const,
                }
              : execucao.versaoCandidataConhecimentoId
                ? {
                    candidatoId: execucao.versaoCandidataConhecimentoId,
                    tipo: "conhecimento" as const,
                  }
                : null;
        if (!alvo) return [execucao.id, null];
        try {
          const valor = await buscarElegibilidadePublicacaoAdmin(alvo);
          return [
            execucao.id,
            {
              status: valor.status,
              bloqueios: valor.bloqueios,
              alertas: valor.alertas,
              hash: valor.hashAvaliado,
            },
          ];
        } catch {
          return [execucao.id, null];
        }
      }),
    ),
  );
  const serializarResultado = (resultado: (typeof resultados)[number]) => ({
    ...resultado,
    criadoEm: resultado.criadoEm.toISOString(),
    atualizadoEm: resultado.atualizadoEm.toISOString(),
  });
  return (
    <PaginaTestes
      casos={casosComHistorico}
      conjuntos={conjuntos}
      podeEditar={acesso.capacidades.includes("rascunhos_escrita")}
      laboratorio={
        <PainelLaboratorio
          casos={casos
            .filter((c) => c.versao?.estado === "aprovado")
            .map((c) => ({ id: c.versao!.id, nome: c.nome }))}
          conjuntos={conjuntos.map((c) => ({ id: c.id, nome: c.nome }))}
          conhecimentos={conhecimentos.itens
            .filter((c) => c.versaoAtualId && c.estado !== "publicado")
            .map((c) => ({ id: c.versaoAtualId!, nome: c.titulo }))}
          comportamentos={comportamentos
            .filter((c) => c.versao)
            .map((c) => ({ id: c.versao!.id, nome: c.nome }))}
          execucoes={execucoes.map((x) => ({
            id: x.id,
            status: x.status,
            modoExecucao: x.modoExecucao,
            tipoComparacao: x.tipoComparacao,
            criadoEm: x.criadoEm.toISOString(),
            erroSanitizado: x.erroSanitizado,
          }))}
          resultados={resultados.map(serializarResultado)}
          podeExecutar={acesso.capacidades.includes("testes_execucao")}
          podeAvaliar={acesso.capacidades.includes("avaliacoes_escrita")}
          podePublicar={acesso.papel === "gestor_principal"}
          elegibilidades={elegibilidadesExecucoes}
        />
      }
    />
  );
}
