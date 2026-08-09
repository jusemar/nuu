/**
 * Estado do portão entre a Conciliação e a Publicação.
 *
 * Existe por causa de um bug real: a barra da Conciliação decidia tudo por
 * "falta algum dado obrigatório?". Com os dados completos ela anunciava
 * "Todos os produtos estão prontos para publicação" e liberava o botão — mesmo
 * com todos os itens ainda em `pendente_conciliacao`. A Publicação, que só
 * lista `pronto_para_publicar`, abria vazia. O gestor percorria o fluxo inteiro
 * e o produto real nunca era atualizado, sem nenhuma mensagem explicando.
 *
 * Aqui a conta é feita sobre o que a Publicação REALMENTE vai encontrar.
 */

export type ItemPortaoPublicacaoFornecedor = {
  id: string;
  /** Dados obrigatórios que ainda faltam. Vazio = nada bloqueia. */
  pendenciasObrigatorias?: string[];
  /** Estado do rascunho no banco. É ele que a Publicação filtra. */
  statusRascunho?: string | null;
  /** Item marcado para ficar de fora não conta para o portão. */
  ignorado?: boolean;
};

export type EstadoPortaoPublicacaoFornecedor =
  /** Falta dado obrigatório: nada avança. */
  | "bloqueada"
  /** Tudo conciliado, mas ninguém aprovou ainda. */
  | "aguardando_aprovacao"
  /** Há item aprovado: a Publicação vai encontrar trabalho. */
  | "liberada"
  /** Sem pendências, sem aprovados e sem nada a aprovar. */
  | "vazia";

export type PortaoPublicacaoFornecedor = {
  estado: EstadoPortaoPublicacaoFornecedor;
  totalPendencias: number;
  /** Ids que uma aprovação em massa tornaria publicáveis. */
  idsAguardandoAprovacao: string[];
  /** Quantos itens a Publicação vai listar agora. */
  totalAprovados: number;
};

export function avaliarPortaoPublicacaoFornecedor(
  itens: ItemPortaoPublicacaoFornecedor[],
): PortaoPublicacaoFornecedor {
  const totalPendencias = itens.filter(
    (item) => (item.pendenciasObrigatorias?.length ?? 0) > 0,
  ).length;

  const totalAprovados = itens.filter(
    (item) => item.statusRascunho === "pronto_para_publicar",
  ).length;

  const idsAguardandoAprovacao = itens
    .filter(
      (item) =>
        item.statusRascunho === "pendente_conciliacao" &&
        (item.pendenciasObrigatorias?.length ?? 0) === 0 &&
        !item.ignorado,
    )
    .map((item) => item.id);

  const estado: EstadoPortaoPublicacaoFornecedor =
    totalPendencias > 0
      ? "bloqueada"
      : idsAguardandoAprovacao.length > 0
        ? "aguardando_aprovacao"
        : totalAprovados > 0
          ? "liberada"
          : "vazia";

  return { estado, totalPendencias, idsAguardandoAprovacao, totalAprovados };
}
