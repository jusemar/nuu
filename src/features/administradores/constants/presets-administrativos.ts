import type { PermissaoAdministrativaChave } from "@/features/autenticacao/constants/permissoes-administrativas";

export type PresetAdministrativoInicial = {
  chave: string;
  descricao: string;
  nome: string;
  permissoes: readonly PermissaoAdministrativaChave[];
};

/** Presets mínimos, úteis e sem capacidade de autoelevação administrativa. */
export const PRESETS_ADMINISTRATIVOS_INICIAIS: readonly PresetAdministrativoInicial[] =
  [
    {
      chave: "cadastro_produtos",
      nome: "Cadastro de produtos",
      descricao: "Consulta e manutenção do catálogo, sem publicar produtos.",
      permissoes: [
        "painel.visualizar",
        "produtos.visualizar",
        "produtos.administrar",
      ],
    },
    {
      chave: "operador_pedidos",
      nome: "Operador de pedidos",
      descricao: "Consulta e atualização operacional de pedidos.",
      permissoes: [
        "painel.visualizar",
        "pedidos.visualizar",
        "pedidos.administrar",
      ],
    },
    {
      chave: "marketing",
      nome: "Marketing",
      descricao: "Campanhas, auditoria de marketing e banners da loja.",
      permissoes: [
        "painel.visualizar",
        "marketing.administrar",
        "marketing.publicar",
        "marketing.auditoria",
        "banners.administrar",
      ],
    },
    {
      chave: "logistica",
      nome: "Logística",
      descricao:
        "Consulta, configuração e sincronização da operação logística.",
      permissoes: [
        "painel.visualizar",
        "logistica.visualizar",
        "logistica.administrar",
        "logistica.sincronizar",
        "pedidos.visualizar",
      ],
    },
    {
      chave: "fornecedores",
      nome: "Fornecedores",
      descricao: "Gestão, importação e publicação do catálogo de fornecedores.",
      permissoes: [
        "painel.visualizar",
        "fornecedores.visualizar",
        "fornecedores.administrar",
        "fornecedores.importar",
        "fornecedores.publicar",
        "produtos.visualizar",
      ],
    },
    {
      chave: "administracao_loja",
      nome: "Administração da loja",
      descricao: "Configurações institucionais, páginas, banners e fidelidade.",
      permissoes: [
        "painel.visualizar",
        "loja_configuracoes.administrar",
        "banners.administrar",
        "paginas.administrar",
        "fidelidade.administrar",
        "precificacao.administrar",
      ],
    },
  ];
