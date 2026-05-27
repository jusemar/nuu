type VinculoClassificacaoLogistica = {
  tipoLogisticoId: string;
  tipoLogistico: {
    ativo: boolean;
    identificador: string;
  };
};

export function selecionarClassificacoesLogisticasAplicaveis({
  vinculosProduto,
  vinculosVariante,
}: {
  vinculosProduto: VinculoClassificacaoLogistica[];
  vinculosVariante: VinculoClassificacaoLogistica[];
}) {
  const vinculosAplicaveis =
    vinculosVariante.length > 0 ? vinculosVariante : vinculosProduto;

  return vinculosAplicaveis
    .filter((vinculo) => vinculo.tipoLogistico.ativo)
    .map((vinculo) => vinculo.tipoLogistico.identificador);
}
