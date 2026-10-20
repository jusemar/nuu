import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { criarDestinoPosAutenticacao } from "@/features/autenticacao/lib/destino-autenticacao-cliente";
import { buscarCadastroClientePorUsuarioId } from "@/features/autenticacao/queries/cadastro/buscar-cadastro-cliente";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { PaginaConfirmacaoRecompensa } from "@/features/programa-fidelidade/components/store/recompensa/pagina-confirmacao-recompensa";
import { buscarRecompensaPublicaPorSlug } from "@/features/programa-fidelidade/queries/catalogo/listar-recompensas-publicas";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Confirmar resgate | Nooo", description: "Confira a entrega e seus pontos antes de confirmar o resgate." };
}

export default async function ConfirmarRecompensaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recompensa = await buscarRecompensaPublicaPorSlug(slug);
  if (!recompensa) notFound();
  const destino = `/troque-seus-pontos/${encodeURIComponent(recompensa.slug)}`;
  const sessao = await buscarSessaoCliente();
  if (!sessao) redirect(`/authentication?destino=${encodeURIComponent(destino)}`);
  const cadastro = await buscarCadastroClientePorUsuarioId(sessao.usuario.id);
  if (!cadastro.completo) redirect(criarDestinoPosAutenticacao(destino));
  if (!cadastro.perfil || !cadastro.enderecoPrincipal) notFound();
  return <PaginaConfirmacaoRecompensa recompensa={recompensa} cliente={{
    nome: cadastro.perfil.nomeCompleto,
    email: sessao.usuario.email,
    telefone: cadastro.perfil.telefone,
    documento: cadastro.perfil.documento,
    endereco: {
      cep: cadastro.enderecoPrincipal.cep,
      rua: cadastro.enderecoPrincipal.rua,
      numero: cadastro.enderecoPrincipal.numero,
      complemento: cadastro.enderecoPrincipal.complemento ?? "",
      bairro: cadastro.enderecoPrincipal.bairro,
      cidade: cadastro.enderecoPrincipal.cidade,
      estado: cadastro.enderecoPrincipal.estado,
    },
  }} />;
}
