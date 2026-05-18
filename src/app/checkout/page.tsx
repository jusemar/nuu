import { buscarCadastroClientePorUsuarioId } from "@/features/autenticacao/queries/cadastro/buscar-cadastro-cliente";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { CheckoutVisitante } from "@/features/checkout";
import type { DadosCheckoutClienteInicial } from "@/features/checkout/components/store/checkout-visitante/checkout-visitante";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Confira seus dados, frete, cupom e total do pedido antes do pagamento.",
};

export default async function CheckoutPage() {
  const sessao = await buscarSessaoCliente();
  let dadosClienteInicial: DadosCheckoutClienteInicial | undefined;

  if (sessao) {
    const cadastro = await buscarCadastroClientePorUsuarioId(sessao.usuario.id);

    if (!cadastro.completo) {
      redirect("/completar-cadastro");
    }

    if (cadastro.perfil && cadastro.enderecoPrincipal) {
      dadosClienteInicial = {
        nome: cadastro.perfil.nomeCompleto,
        email: sessao.usuario.email,
        telefone: cadastro.perfil.telefone,
        documento: cadastro.perfil.documento,
        cep: cadastro.enderecoPrincipal.cep,
        rua: cadastro.enderecoPrincipal.rua,
        numero: cadastro.enderecoPrincipal.numero,
        complemento: cadastro.enderecoPrincipal.complemento ?? "",
        bairro: cadastro.enderecoPrincipal.bairro,
        cidade: cadastro.enderecoPrincipal.cidade,
        estado: cadastro.enderecoPrincipal.estado,
        observacaoCliente: cadastro.perfil.observacaoCliente ?? "",
        permitirEntregaVizinho:
          cadastro.enderecoPrincipal.autorizarEntregaVizinho,
        nomeVizinho: cadastro.enderecoPrincipal.nomeVizinho ?? "",
        observacaoVizinho: cadastro.enderecoPrincipal.observacaoVizinho ?? "",
      };
    }
  }

  return <CheckoutVisitante dadosClienteInicial={dadosClienteInicial} />;
}
