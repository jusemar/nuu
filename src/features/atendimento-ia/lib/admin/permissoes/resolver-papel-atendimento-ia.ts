import { CAPACIDADES_BASE_POR_PAPEL_ADMIN } from "../../../constants/admin/capacidades";
import type {
  AcessoAtendimentoIaAdmin,
  CapacidadeAtendimentoIaAdmin,
  PapelAtendimentoIaAdmin,
} from "../../../types/admin/permissoes";

export type AtribuicaoPapelAtendimentoIa = {
  ativo: boolean;
  capacidadesAdicionais: CapacidadeAtendimentoIaAdmin[];
  id: string;
  origem: "atribuicao_explicita" | "bootstrap_admin_emails";
  papel: PapelAtendimentoIaAdmin;
  usuarioId: string;
};

/** Resolve somente dados confiáveis produzidos pelo servidor e pelo banco. */
export function resolverPapelAtendimentoIa({
  atribuicao,
  emailAutorizado,
}: {
  atribuicao: AtribuicaoPapelAtendimentoIa | null;
  emailAutorizado: boolean;
}): AcessoAtendimentoIaAdmin | null {
  if (!emailAutorizado || !atribuicao?.ativo) return null;
  const base = CAPACIDADES_BASE_POR_PAPEL_ADMIN[atribuicao.papel];
  const adicionaisPermitidas =
    atribuicao.papel === "visualizador"
      ? atribuicao.capacidadesAdicionais.filter(
          (item) => item === "conversas_sanitizadas_leitura",
        )
      : [];
  return {
    ativo: true,
    capacidades: [
      ...new Set<CapacidadeAtendimentoIaAdmin>([
        ...base,
        ...adicionaisPermitidas,
      ]),
    ],
    capacidadesAdicionais: adicionaisPermitidas,
    origem: atribuicao.origem,
    papel: atribuicao.papel,
    papelAtribuicaoId: atribuicao.id,
    usuarioId: atribuicao.usuarioId,
  };
}
