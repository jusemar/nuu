/**
 * Fonte canônica das permissões globais do painel.
 *
 * As chaves são estáveis para uso no código; nome, descrição e módulo podem
 * evoluir no catálogo persistido sem trocar a identidade da permissão.
 */
export const CATALOGO_PERMISSOES_ADMIN = [
  {
    chave: "painel.visualizar",
    nome: "Visualizar painel",
    descricao: "Acessar o painel e seus indicadores gerais.",
    modulo: "painel",
  },
  {
    chave: "produtos.visualizar",
    nome: "Visualizar produtos",
    descricao: "Consultar listagens e detalhes do catálogo.",
    modulo: "produtos",
  },
  {
    chave: "produtos.administrar",
    nome: "Administrar produtos",
    descricao: "Criar e editar produtos, variantes, imagens e relacionamentos.",
    modulo: "produtos",
  },
  {
    chave: "produtos.publicar",
    nome: "Publicar produtos",
    descricao: "Publicar, despublicar e executar alterações em massa.",
    modulo: "produtos",
  },
  {
    chave: "categorias.visualizar",
    nome: "Visualizar categorias",
    descricao: "Consultar a árvore de categorias e seus conteúdos.",
    modulo: "categorias",
  },
  {
    chave: "categorias.administrar",
    nome: "Administrar categorias",
    descricao: "Criar, editar, ordenar, ativar e restaurar categorias.",
    modulo: "categorias",
  },
  {
    chave: "categorias.excluir",
    nome: "Excluir categorias",
    descricao: "Excluir categorias permanentemente.",
    modulo: "categorias",
  },
  {
    chave: "marcas.administrar",
    nome: "Administrar marcas",
    descricao: "Criar, editar e remover marcas do catálogo.",
    modulo: "marcas",
  },
  {
    chave: "precificacao.administrar",
    nome: "Administrar precificação",
    descricao: "Alterar configurações comerciais de preço e pagamento.",
    modulo: "precificacao",
  },
  {
    chave: "logistica.visualizar",
    nome: "Visualizar logística",
    descricao: "Consultar configurações, serviços e regras logísticas.",
    modulo: "logistica",
  },
  {
    chave: "logistica.administrar",
    nome: "Administrar logística",
    descricao:
      "Alterar provedores, serviços, regras, retirada e entrega própria.",
    modulo: "logistica",
  },
  {
    chave: "logistica.sincronizar",
    nome: "Sincronizar logística",
    descricao: "Executar sincronizações com provedores logísticos externos.",
    modulo: "logistica",
  },
  {
    chave: "pedidos.visualizar",
    nome: "Visualizar pedidos",
    descricao:
      "Consultar pedidos, detalhes e dados necessários ao atendimento.",
    modulo: "pedidos",
  },
  {
    chave: "pedidos.administrar",
    nome: "Administrar pedidos",
    descricao: "Alterar status, envio, entrega e logística dos pedidos.",
    modulo: "pedidos",
  },
  {
    chave: "pagamentos_entrega.administrar",
    nome: "Administrar pagamento na entrega",
    descricao:
      "Configurar, confirmar, registrar falha e estornar recebimentos.",
    modulo: "pagamentos_entrega",
  },
  {
    chave: "fornecedores.visualizar",
    nome: "Visualizar fornecedores",
    descricao: "Consultar fornecedores, importações e conciliações.",
    modulo: "fornecedores",
  },
  {
    chave: "fornecedores.administrar",
    nome: "Administrar fornecedores",
    descricao: "Alterar cadastros, configurações, vínculos e ajustes.",
    modulo: "fornecedores",
  },
  {
    chave: "fornecedores.importar",
    nome: "Importar de fornecedores",
    descricao: "Processar planilhas, APIs, staging e sincronizações.",
    modulo: "fornecedores",
  },
  {
    chave: "fornecedores.publicar",
    nome: "Publicar produtos de fornecedores",
    descricao: "Publicar no catálogo produtos preparados por importações.",
    modulo: "fornecedores",
  },
  {
    chave: "marketing.administrar",
    nome: "Administrar marketing",
    descricao: "Criar e editar promoções e cupons.",
    modulo: "marketing",
  },
  {
    chave: "marketing.publicar",
    nome: "Publicar campanhas",
    descricao: "Ativar e desativar promoções, cupons e regras comerciais.",
    modulo: "marketing",
  },
  {
    chave: "marketing.auditoria",
    nome: "Acessar auditoria de marketing",
    descricao: "Consultar e exportar auditorias de promoções e cupons.",
    modulo: "marketing",
  },
  {
    chave: "fidelidade.administrar",
    nome: "Administrar fidelidade",
    descricao: "Alterar configurações e regras do programa de fidelidade.",
    modulo: "fidelidade",
  },
  {
    chave: "loja_configuracoes.administrar",
    nome: "Administrar configurações da loja",
    descricao: "Alterar os dados e configurações gerais da loja.",
    modulo: "loja_configuracoes",
  },
  {
    chave: "banners.administrar",
    nome: "Administrar banners",
    descricao: "Criar, editar, publicar, ordenar e remover banners.",
    modulo: "banners",
  },
  {
    chave: "paginas.administrar",
    nome: "Administrar páginas",
    descricao: "Criar, editar, ordenar e publicar páginas da loja.",
    modulo: "paginas",
  },
  {
    chave: "atendente_ia.acessar",
    nome: "Acessar Atendente IA",
    descricao:
      "Entrar no módulo; as capacidades internas continuam no RBAC local da IA.",
    modulo: "atendente_ia",
  },
  {
    chave: "administradores.visualizar",
    nome: "Visualizar administradores",
    descricao: "Consultar usuários, funções e permissões administrativas.",
    modulo: "administradores",
  },
  {
    chave: "administradores.administrar",
    nome: "Administrar acessos",
    descricao: "Gerenciar convites, funções e permissões delegáveis.",
    modulo: "administradores",
  },
] as const;

export type PermissaoAdministrativaChave =
  (typeof CATALOGO_PERMISSOES_ADMIN)[number]["chave"];

export const PERMISSOES_ADMIN = Object.freeze({
  PAINEL: { VISUALIZAR: "painel.visualizar" },
  PRODUTOS: {
    VISUALIZAR: "produtos.visualizar",
    ADMINISTRAR: "produtos.administrar",
    PUBLICAR: "produtos.publicar",
  },
  CATEGORIAS: {
    VISUALIZAR: "categorias.visualizar",
    ADMINISTRAR: "categorias.administrar",
    EXCLUIR: "categorias.excluir",
  },
  MARCAS: { ADMINISTRAR: "marcas.administrar" },
  PRECIFICACAO: { ADMINISTRAR: "precificacao.administrar" },
  LOGISTICA: {
    VISUALIZAR: "logistica.visualizar",
    ADMINISTRAR: "logistica.administrar",
    SINCRONIZAR: "logistica.sincronizar",
  },
  PEDIDOS: {
    VISUALIZAR: "pedidos.visualizar",
    ADMINISTRAR: "pedidos.administrar",
  },
  PAGAMENTOS_ENTREGA: { ADMINISTRAR: "pagamentos_entrega.administrar" },
  FORNECEDORES: {
    VISUALIZAR: "fornecedores.visualizar",
    ADMINISTRAR: "fornecedores.administrar",
    IMPORTAR: "fornecedores.importar",
    PUBLICAR: "fornecedores.publicar",
  },
  MARKETING: {
    ADMINISTRAR: "marketing.administrar",
    PUBLICAR: "marketing.publicar",
    AUDITORIA: "marketing.auditoria",
  },
  FIDELIDADE: { ADMINISTRAR: "fidelidade.administrar" },
  LOJA_CONFIGURACOES: { ADMINISTRAR: "loja_configuracoes.administrar" },
  BANNERS: { ADMINISTRAR: "banners.administrar" },
  PAGINAS: { ADMINISTRAR: "paginas.administrar" },
  ATENDENTE_IA: { ACESSAR: "atendente_ia.acessar" },
  ADMINISTRADORES: {
    VISUALIZAR: "administradores.visualizar",
    ADMINISTRAR: "administradores.administrar",
  },
} as const);

const chavesConhecidas = new Set<string>(
  CATALOGO_PERMISSOES_ADMIN.map(({ chave }) => chave),
);

/** Validação runtime mantém o fail-closed mesmo diante de JavaScript sem tipos. */
export function ehPermissaoAdministrativaChave(
  valor: unknown,
): valor is PermissaoAdministrativaChave {
  return typeof valor === "string" && chavesConhecidas.has(valor);
}
