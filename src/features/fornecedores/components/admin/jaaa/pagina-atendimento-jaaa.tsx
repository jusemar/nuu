import { obterContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { exigirRepresentanteJaaa } from "../../../queries/jaaa/exigir-acesso-jaaa";
import { exigirGestorRepresentantes } from "../../../queries/representantes/exigir-gestor-representantes";
import { MeuAcessoJaaa } from "./acesso-real-jaaa";
import { PainelGestaoJaaa } from "./painel-gestao-jaaa";
export async function PaginaAtendimentoJaaa() {
  const c = await obterContextoAdministrativo();
  if (c.situacao === "ativo" && c.administradorPrincipal) {
    await exigirGestorRepresentantes();
    return <PainelGestaoJaaa />;
  }
  await exigirRepresentanteJaaa();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Meu atendimento</h1>
      <MeuAcessoJaaa />
    </div>
  );
}
