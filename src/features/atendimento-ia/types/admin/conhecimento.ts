import type {
  ESTADOS_EDITORIAIS_ADMIN,
  TIPOS_CONHECIMENTO_ADMIN,
} from "../../constants/admin/estados";

export type TipoConhecimentoAdmin = (typeof TIPOS_CONHECIMENTO_ADMIN)[number];
export type EstadoEditorialAdmin = (typeof ESTADOS_EDITORIAIS_ADMIN)[number];

export type CondicaoPerguntaRespostaAdmin = {
  campo: "canal" | "categoria_produto" | "tipo_cliente" | "necessita_dado_real";
  operador: "igual" | "diferente" | "contem";
  valor: string | boolean;
};

export type PerguntaRespostaAdmin = {
  condicoes: CondicaoPerguntaRespostaAdmin[];
  consultasDadosReais: Array<
    "produto" | "preco" | "estoque" | "promocao" | "entrega" | "pedido"
  >;
  observacoesInternas?: string;
  perguntaPrincipal: string;
  respostaPrincipal: string;
  variacoes: string[];
};

export type ConhecimentoAdmin = {
  categoria: string;
  conteudo: string | PerguntaRespostaAdmin;
  estado: EstadoEditorialAdmin;
  origem: string;
  resumoAlteracao: string;
  titulo: string;
  tipo: TipoConhecimentoAdmin;
};
