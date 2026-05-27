export type EventoFrenet = {
  tipo: "erro-api" | "timeout" | "resposta-invalida";
  cotacaoId: string;
  mensagem: string;
};

export function registrarEventoFrenet(evento: EventoFrenet) {
  console.warn("[logistica:frenet]", {
    tipo: evento.tipo,
    cotacaoId: evento.cotacaoId,
    mensagem: evento.mensagem,
  });
}
