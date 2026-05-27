import type {
  DisponibilidadeFreteProduto,
  EfeitoRegraDisponibilidadeFrete,
  RegraDisponibilidadeFrete,
} from "../../types/disponibilidade-frete";

type RegistroProvedorFrete = {
  identificador: string;
  ativo: boolean;
};

type RegistroTransportadoraFrete = {
  identificador: string;
  nome: string;
  ativo: boolean;
  pesoMaximoEmGramas: number | null;
  alturaMaximaEmCm: number | null;
  larguraMaximaEmCm: number | null;
  comprimentoMaximoEmCm: number | null;
  provedor: {
    identificador: string;
  };
};

type RegistroServicoFrete = {
  identificador: string;
  ativo: boolean;
  pesoMaximoEmGramas: number | null;
  alturaMaximaEmCm: number | null;
  larguraMaximaEmCm: number | null;
  comprimentoMaximoEmCm: number | null;
  provedor: {
    identificador: string;
  };
  transportadora?: {
    identificador: string;
  } | null;
};

type RelacoesRegraFrete = {
  efeito: EfeitoRegraDisponibilidadeFrete;
  ativo: boolean;
  provedor?: {
    identificador: string;
  } | null;
  transportadora?: {
    identificador: string;
    provedor: {
      identificador: string;
    };
  } | null;
  servico?: {
    identificador: string;
    provedor: {
      identificador: string;
    };
    transportadora?: {
      identificador: string;
    } | null;
  } | null;
};

type RegistroRegraCategoriaFrete = RelacoesRegraFrete & {
  categoriaId: string;
};

type RegistroRegraProdutoFrete = RelacoesRegraFrete & {
  produtoId: string;
};

type RegistroRegraTipoLogisticoFrete = RelacoesRegraFrete & {
  tipoLogistico: {
    identificador: string;
  };
};

export type RegistrosDisponibilidadeFreteProduto = {
  produtoId: string;
  varianteId?: string | null;
  categoriaId?: string | null;
  tiposLogisticosIdentificadores: string[];
  provedores: RegistroProvedorFrete[];
  transportadoras: RegistroTransportadoraFrete[];
  servicos: RegistroServicoFrete[];
  regrasCategorias: RegistroRegraCategoriaFrete[];
  regrasProdutos: RegistroRegraProdutoFrete[];
  regrasTiposLogisticos: RegistroRegraTipoLogisticoFrete[];
};

function mapearRegra(regra: RelacoesRegraFrete): RegraDisponibilidadeFrete {
  return {
    efeito: regra.efeito,
    ativo: regra.ativo,
    provedorIdentificador:
      regra.provedor?.identificador ??
      regra.servico?.provedor.identificador ??
      regra.transportadora?.provedor.identificador ??
      null,
    transportadoraIdentificador:
      regra.transportadora?.identificador ??
      regra.servico?.transportadora?.identificador ??
      null,
    servicoIdentificador: regra.servico?.identificador ?? null,
  };
}

export function mapearDisponibilidadeFreteProduto({
  produtoId,
  varianteId,
  categoriaId,
  tiposLogisticosIdentificadores,
  provedores,
  transportadoras,
  servicos,
  regrasCategorias,
  regrasProdutos,
  regrasTiposLogisticos,
}: RegistrosDisponibilidadeFreteProduto): DisponibilidadeFreteProduto {
  return {
    contextoProduto: {
      produtoId,
      varianteId: varianteId ?? null,
      categoriaId: categoriaId ?? null,
      tiposLogisticosIdentificadores,
    },
    configuracao: {
      provedores: provedores.map((provedor) => ({
        identificador: provedor.identificador,
        ativo: provedor.ativo,
      })),
      transportadoras: transportadoras.map((transportadora) => ({
        identificador: transportadora.identificador,
        nome: transportadora.nome,
        ativo: transportadora.ativo,
        provedorIdentificador: transportadora.provedor.identificador,
        pesoMaximoEmGramas: transportadora.pesoMaximoEmGramas,
        alturaMaximaEmCm: transportadora.alturaMaximaEmCm,
        larguraMaximaEmCm: transportadora.larguraMaximaEmCm,
        comprimentoMaximoEmCm: transportadora.comprimentoMaximoEmCm,
      })),
      servicos: servicos.map((servico) => ({
        identificador: servico.identificador,
        ativo: servico.ativo,
        provedorIdentificador: servico.provedor.identificador,
        transportadoraIdentificador:
          servico.transportadora?.identificador ?? null,
        pesoMaximoEmGramas: servico.pesoMaximoEmGramas,
        alturaMaximaEmCm: servico.alturaMaximaEmCm,
        larguraMaximaEmCm: servico.larguraMaximaEmCm,
        comprimentoMaximoEmCm: servico.comprimentoMaximoEmCm,
      })),
      regrasCategorias: regrasCategorias.map((regra) => ({
        categoriaId: regra.categoriaId,
        ...mapearRegra(regra),
      })),
      regrasProdutos: regrasProdutos.map((regra) => ({
        produtoId: regra.produtoId,
        ...mapearRegra(regra),
      })),
      regrasTiposLogisticos: regrasTiposLogisticos.map((regra) => ({
        tipoLogisticoIdentificador: regra.tipoLogistico.identificador,
        ...mapearRegra(regra),
      })),
    },
  };
}
