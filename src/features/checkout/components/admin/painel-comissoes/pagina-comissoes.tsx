import { obterAcessoPainelComissoes } from "../../../queries/painel-comissoes/acesso-painel";
import { PainelComissoes } from "./painel-comissoes";
export async function PaginaComissoesRepresentantes() {
  const acesso = await obterAcessoPainelComissoes();
  return <PainelComissoes gestor={acesso.gestor} />;
}
