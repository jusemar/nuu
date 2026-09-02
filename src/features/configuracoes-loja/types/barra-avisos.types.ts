export type MensagemBarraAvisos = {
  id: string;
  texto: string;
  icone: string | null;
  ativo: boolean;
  ordem: number;
};

export type ConfiguracaoBarraAvisos = {
  ativo: boolean;
  corFundo: string;
  corTexto: string;
  velocidadeSegundos: number;
  pausarHover: boolean;
  mensagens: MensagemBarraAvisos[];
};
