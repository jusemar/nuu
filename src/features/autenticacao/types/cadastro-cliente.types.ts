export type TipoPessoaCliente = "fisica" | "juridica";

export type PerfilClienteCompleto = {
  id: string;
  usuarioId: string;
  tipoPessoa: TipoPessoaCliente;
  nomeCompleto: string;
  documento: string;
  telefone: string;
  dataNascimento: Date | null;
  observacaoCliente: string | null;
  perfilCompleto: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type EnderecoClientePrincipal = {
  id: string;
  usuarioId: string;
  perfilClienteId: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  autorizarEntregaVizinho: boolean;
  nomeVizinho: string | null;
  observacaoVizinho: string | null;
  principal: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type CadastroClienteCompleto = {
  perfil: PerfilClienteCompleto | null;
  enderecoPrincipal: EnderecoClientePrincipal | null;
  completo: boolean;
};
