import type { CadastroClienteCompleto } from "../types/cadastro-cliente.types";

export function verificarCadastroClienteCompleto(
  cadastro: CadastroClienteCompleto | null,
) {
  return Boolean(
    cadastro?.perfil?.perfilCompleto &&
      cadastro.enderecoPrincipal?.cep &&
      cadastro.enderecoPrincipal.rua &&
      cadastro.enderecoPrincipal.numero &&
      cadastro.enderecoPrincipal.bairro &&
      cadastro.enderecoPrincipal.cidade &&
      cadastro.enderecoPrincipal.estado,
  );
}
