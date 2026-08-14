import {
  listarCategoriasFidelidade,
  PaginaProgramaFidelidadeAdmin,
} from "@/features/programa-fidelidade";
import { CATEGORIAS_DEMONSTRACAO } from "@/features/programa-fidelidade/constants/dados-demonstracao";

export default async function ProgramaFidelidadePage() {
  const categoriasExistentes = await listarCategoriasFidelidade();
  const categorias = categoriasExistentes.length
    ? categoriasExistentes
    : CATEGORIAS_DEMONSTRACAO;

  return <PaginaProgramaFidelidadeAdmin categorias={categorias} />;
}
