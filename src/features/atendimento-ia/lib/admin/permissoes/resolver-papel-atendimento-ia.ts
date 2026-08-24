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

export function projetarAtribuicaoPapelAtendimentoIa(registro: {
  ativo: boolean;
  capacidadesAdicionais: CapacidadeAtendimentoIaAdmin[];
  id: string;
  origem: string;
  papel: PapelAtendimentoIaAdmin;
  usuarioId: string;
}): AtribuicaoPapelAtendimentoIa {
  return {
    ...registro,
    origem:
      registro.origem === "bootstrap_admin_emails"
        ? "bootstrap_admin_emails"
        : "atribuicao_explicita",
  };
}

/** Resolve somente dados confiáveis produzidos pelo servidor e pelo banco. */
export function resolverPapelAtendimentoIa({
  atribuicao,
  acessoGlobalAutorizado,
}: {
  atribuicao: AtribuicaoPapelAtendimentoIa | null;
  acessoGlobalAutorizado: boolean;
}): AcessoAtendimentoIaAdmin | null {
  if (!acessoGlobalAutorizado || !atribuicao?.ativo) return null;
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
