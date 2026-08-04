export type ClasseFalhaObservabilidade =
  | "seguranca"
  | "privacidade"
  | "ferramenta"
  | "rag"
  | "limite"
  | "modelo"
  | "interna";

export function classificarFalha(codigo: string): ClasseFalhaObservabilidade {
  if (/privacidade|dados_pessoais|exposicao/i.test(codigo))
    return "privacidade";
  if (/seguranca|autorizacao|protegida/i.test(codigo)) return "seguranca";
  if (/ferramenta/i.test(codigo)) return "ferramenta";
  if (/rag|fonte|conflito|conhecimento/i.test(codigo)) return "rag";
  if (/limite/i.test(codigo)) return "limite";
  if (/modelo|openai/i.test(codigo)) return "modelo";
  return "interna";
}
