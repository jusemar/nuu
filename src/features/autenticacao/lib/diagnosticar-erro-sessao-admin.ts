export type DiagnosticoErroSessaoAdmin = {
  tipo: string;
  mensagem: string;
  codigo?: string;
  status?: string;
  transitorio: boolean;
};

export type MotivoSessaoAdmin =
  | "ok"
  | "sessao_ausente"
  | "sessao_expirada"
  | "sem_permissao";

export function classificarSessaoAdmin({
  cookieSessaoPresente,
  usuarioPresente,
  autorizado,
}: {
  cookieSessaoPresente: boolean;
  usuarioPresente: boolean;
  autorizado: boolean;
}): MotivoSessaoAdmin {
  if (!cookieSessaoPresente) return "sessao_ausente";
  if (!usuarioPresente) return "sessao_expirada";
  return autorizado ? "ok" : "sem_permissao";
}

function objeto(valor: unknown): Record<string, unknown> | null {
  return typeof valor === "object" && valor !== null
    ? (valor as Record<string, unknown>)
    : null;
}

function texto(registro: Record<string, unknown> | null, campo: string) {
  const valor = registro?.[campo];
  return typeof valor === "string" || typeof valor === "number"
    ? String(valor)
    : undefined;
}

/** Extrai somente metadados técnicos seguros; nunca inclui cookie ou usuário. */
export function diagnosticarErroSessaoAdmin(
  erro: unknown,
): DiagnosticoErroSessaoAdmin {
  const registro = objeto(erro);
  const causa = objeto(registro?.cause);
  const corpo = objeto(registro?.body);
  const mensagem =
    texto(causa, "message") ??
    texto(corpo, "message") ??
    texto(registro, "message") ??
    "Falha interna ao consultar a sessão administrativa.";
  const codigo =
    texto(causa, "code") ?? texto(corpo, "code") ?? texto(registro, "code");
  const status = texto(registro, "status") ?? texto(registro, "statusCode");
  const assinatura =
    `${mensagem} ${codigo ?? ""} ${status ?? ""}`.toLowerCase();

  return {
    tipo:
      erro instanceof Error
        ? erro.constructor.name
        : (texto(registro, "name") ?? "ErroDesconhecido"),
    mensagem,
    codigo,
    status,
    transitorio: [
      "internal_server_error",
      "fetch failed",
      "error connecting to database",
      "econnreset",
      "etimedout",
      "timeout",
    ].some((sinal) => assinatura.includes(sinal)),
  };
}

export async function consultarSessaoComRepeticao<T>({
  consultar,
  aoFalhar,
  aguardar = (tempo) =>
    new Promise<void>((resolver) => setTimeout(resolver, tempo)),
}: {
  consultar: () => Promise<T>;
  aoFalhar?: (dados: {
    diagnostico: DiagnosticoErroSessaoAdmin;
    tentativa: number;
    repetira: boolean;
  }) => void;
  aguardar?: (tempo: number) => Promise<void>;
}) {
  const maximoTentativas = 3;
  for (let tentativa = 1; tentativa <= maximoTentativas; tentativa += 1) {
    try {
      return await consultar();
    } catch (erro) {
      const diagnostico = diagnosticarErroSessaoAdmin(erro);
      const repetira = diagnostico.transitorio && tentativa < maximoTentativas;
      aoFalhar?.({ diagnostico, tentativa, repetira });
      if (!repetira) throw erro;
      await aguardar(200 * tentativa);
    }
  }

  throw new Error("Consulta de sessão encerrada sem resultado.");
}
