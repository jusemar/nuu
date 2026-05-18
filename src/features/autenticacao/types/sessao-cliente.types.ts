export type UsuarioClienteAutenticado = {
  id: string;
  nome: string;
  email: string;
  imagem: string | null;
  criadoEm: Date;
};

export type SessaoClienteAutenticado = {
  usuario: UsuarioClienteAutenticado;
  expiraEm: Date;
};
