export type ModeloRetirada = {
  id: string;
  nome: string;
  prazoTexto: string;
  mensagem: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CriarModeloRetirada = Omit<ModeloRetirada, "id" | "createdAt" | "updatedAt">;
export type AtualizarModeloRetirada = Partial<CriarModeloRetirada>;
