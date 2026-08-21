import { possuiConteudoHtmlEditorial } from "./sanitizar-html-editorial-categoria";

type FaqCategoriaIndexacao = { question: string; answer: string };

type SinaisIndexacaoCategoria = {
  description: string | null;
  descriptionBottom: string | null;
  faqs: FaqCategoriaIndexacao[];
  temProdutoPublico: boolean;
};

export function urlCategoriaPossuiParametros(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return Object.keys(searchParams).length > 0;
}

export function categoriaPossuiConteudoEditorialSubstancial({
  description,
  descriptionBottom,
  faqs,
}: Omit<SinaisIndexacaoCategoria, "temProdutoPublico">) {
  const possuiDescricao = [description, descriptionBottom].some(
    (conteudo) => conteudo && possuiConteudoHtmlEditorial(conteudo),
  );
  const possuiFaqUtil = faqs.some(
    (faq) => faq.question.trim().length > 0 && faq.answer.trim().length > 0,
  );

  return Boolean(possuiDescricao || possuiFaqUtil);
}

export function categoriaPodeSerIndexada({
  temProdutoPublico,
  ...conteudo
}: SinaisIndexacaoCategoria) {
  return (
    temProdutoPublico || categoriaPossuiConteudoEditorialSubstancial(conteudo)
  );
}
