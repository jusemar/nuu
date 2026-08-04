import { conhecimentosControladosAdmin } from "./conhecimentos";

export const resumoTreinamentoControladoAdmin = {
  alertasCriticos: 2,
  aguardandoRevisao: conhecimentosControladosAdmin.filter(
    (item) => item.estado === "em_revisao",
  ).length,
  conhecimentosRascunho: conhecimentosControladosAdmin.filter(
    (item) => item.estado === "rascunho",
  ).length,
  propostasAbertas: 4,
  respostasAguardandoAvaliacao: 12,
  testesReprovados: 3,
} as const;
