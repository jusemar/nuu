// Lib: regra de negócio pura para cálculo de prazo de retirada
// Sem React, sem acesso a banco — recebe tudo por parâmetro
// Testável unitariamente

import type { ConfigHorario, ModalidadeRetirada, Feriado } from "@/features/admin/logistica/types/logistica.types";

// ============================================
// TIPOS AUXILIARES
// ============================================

type PrazoRetirada = {
  podeRetirarHoje: boolean;
  dataRetirada: Date;
  dataRetiradaFormatada: string;
  horarioLimite: string | null;
  mensagem: string;
};

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * Calcula o prazo de retirada com base na modalidade, horário atual e config da loja
 * 
 * @param modalidade - Modalidade selecionada (imediato, rápido, sob encomenda)
 * @param config - Configuração de horário da loja
 * @param feriados - Lista de feriados para desconsiderar nos cálculos
 * @param dataPedido - Data/hora do pedido (default: agora)
 * @returns PrazoRetirada com todas as informações formatadas
 */
export function calcularPrazoRetirada(
  modalidade: ModalidadeRetirada,
  config: ConfigHorario,
  feriados: Feriado[],
  dataPedido: Date = new Date()
): PrazoRetirada {
  const horaAtual = formatarHora(dataPedido);
  const diaSemanaAtual = obterDiaSemana(dataPedido);

  // Verifica se loja está aberta hoje
  if (!config.diasFuncionamento.includes(diaSemanaAtual)) {
    return {
      podeRetirarHoje: false,
      dataRetirada: proximoDiaUtil(dataPedido, config, feriados),
      dataRetiradaFormatada: "próximo dia útil",
      horarioLimite: null,
      mensagem: "Loja fechada hoje. Retirada disponível no próximo dia de funcionamento.",
    };
  }

  // Verifica se está dentro do horário de funcionamento
  const dentroHorario = estaDentroHorario(horaAtual, config);

  switch (modalidade.slug) {
    case "imediato":
      return calcularImediato(dentroHorario, config, dataPedido, feriados);

    case "rapido":
      return calcularRapido(modalidade, horaAtual, config, dataPedido, feriados);

    case "sob-encomenda":
      return calcularSobEncomenda(modalidade, config, dataPedido, feriados);

    default:
      return {
        podeRetirarHoje: false,
        dataRetirada: dataPedido,
        dataRetiradaFormatada: "indisponível",
        horarioLimite: null,
        mensagem: "Modalidade não reconhecida",
      };
  }
}

// ============================================
// FUNÇÕES AUXILIARES (privadas)
// ============================================

/**
 * Verifica se horário atual está dentro do expediente da loja
 */
export function estaDentroHorario(
  horaAtual: string,
  config: ConfigHorario
): boolean {
  const [horaAtualNum] = horaAtual.split(":").map(Number);
  const [aberturaNum] = config.horaAbertura.split(":").map(Number);
  const [fechamentoNum] = config.horaFechamento.split(":").map(Number);

  // Antes da abertura
  if (horaAtualNum < aberturaNum) return false;

  // Depois do fechamento
  if (horaAtualNum >= fechamentoNum) return false;

  // Durante intervalo de almoço
  if (config.usaIntervaloAlmoco && config.horaAlmocoInicio && config.horaAlmocoFim) {
    const [almocoInicioNum] = config.horaAlmocoInicio.split(":").map(Number);
    const [almocoFimNum] = config.horaAlmocoFim.split(":").map(Number);

    if (horaAtualNum >= almocoInicioNum && horaAtualNum < almocoFimNum) {
      return false;
    }
  }

  return true;
}

/**
 * Adiciona dias úteis a uma data, desconsiderando fins de semana e feriados
 */
export function adicionarDiasUteis(
  data: Date,
  dias: number,
  config: ConfigHorario,
  feriados: Feriado[]
): Date {
  let dataResultado = new Date(data);
  let diasAdicionados = 0;

  while (diasAdicionados < dias) {
    dataResultado.setDate(dataResultado.getDate() + 1);

    const diaSemana = obterDiaSemana(dataResultado);
    const dataStr = formatarDataISO(dataResultado);

    // Pula fim de semana
    if (!config.diasFuncionamento.includes(diaSemana)) continue;

    // Pula feriado
    const ehFeriado = feriados.some((f) => f.data === dataStr);
    if (ehFeriado) continue;

    diasAdicionados++;
  }

  return dataResultado;
}

/**
 * Adiciona dias corridos a uma data
 */
export function adicionarDiasCorridos(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

// ============================================
// CÁLCULOS POR MODALIDADE
// ============================================

function calcularImediato(
  dentroHorario: boolean,
  config: ConfigHorario,
  dataPedido: Date,
  feriados: Feriado[]
): PrazoRetirada {
  if (dentroHorario) {
    return {
      podeRetirarHoje: true,
      dataRetirada: dataPedido,
      dataRetiradaFormatada: "hoje",
      horarioLimite: config.horaFechamento,
      mensagem: `Retira hoje · até ${config.horaFechamento}`,
    };
  }

  // Fora do horário → amanhã (ou próximo dia útil)
  const amanha = adicionarDiasUteis(dataPedido, 1, config, feriados);

  return {
    podeRetirarHoje: false,
    dataRetirada: amanha,
    dataRetiradaFormatada: "amanhã",
    horarioLimite: config.horaFechamento,
    mensagem: `Retira amanhã · ${config.horaAbertura} às ${config.horaFechamento}`,
  };
}

function calcularRapido(
  modalidade: ModalidadeRetirada,
  horaAtual: string,
  config: ConfigHorario,
  dataPedido: Date,
  feriados: Feriado[]
): PrazoRetirada {
  const horarioCorte = modalidade.config.horarioCorte;
  if (!horarioCorte) {
    return {
      podeRetirarHoje: false,
      dataRetirada: dataPedido,
      dataRetiradaFormatada: "indisponível",
      horarioLimite: null,
      mensagem: "Horário de corte não configurado",
    };
  }

  const [horaAtualNum] = horaAtual.split(":").map(Number);
  const [corteNum] = horarioCorte.split(":").map(Number);

  if (horaAtualNum < corteNum) {
    // Antes do corte → retira hoje à tarde
    return {
      podeRetirarHoje: true,
      dataRetirada: dataPedido,
      dataRetiradaFormatada: "hoje",
      horarioLimite: config.horaFechamento,
      mensagem: `Retira hoje (após ${horarioCorte}) · até ${config.horaFechamento}`,
    };
  }

  // Após o corte → amanhã
  const amanha = adicionarDiasUteis(dataPedido, 1, config, feriados);

  return {
    podeRetirarHoje: false,
    dataRetirada: amanha,
    dataRetiradaFormatada: "amanhã",
    horarioLimite: config.horaFechamento,
    mensagem: `Retira amanhã · ${config.horaAbertura} às ${config.horaFechamento}`,
  };
}

function calcularSobEncomenda(
  modalidade: ModalidadeRetirada,
  config: ConfigHorario,
  dataPedido: Date,
  feriados: Feriado[]
): PrazoRetirada {
  const prazoDias = modalidade.config.prazoDias ?? 0;
  const tipoContagem = modalidade.config.tipoContagem ?? "uteis";

  let dataRetirada: Date;
  let textoPrazo: string;

  if (tipoContagem === "uteis") {
    dataRetirada = adicionarDiasUteis(dataPedido, prazoDias, config, feriados);
    textoPrazo = prazoDias === 1 ? "1 dia útil" : `${prazoDias} dias úteis`;
  } else {
    dataRetirada = adicionarDiasCorridos(dataPedido, prazoDias);
    textoPrazo = prazoDias === 1 ? "1 dia corrido" : `${prazoDias} dias corridos`;
  }

  return {
    podeRetirarHoje: false,
    dataRetirada,
    dataRetiradaFormatada: `em ${textoPrazo}`,
    horarioLimite: null,
    mensagem: `Retira em ${textoPrazo} · ${config.diasFuncionamento.join("–")}, ${config.horaAbertura} às ${config.horaFechamento}`,
  };
}

// ============================================
// HELPERS DE FORMATAÇÃO
// ============================================

function formatarHora(data: Date): string {
  return data.toTimeString().slice(0, 5); // "HH:MM"
}

function formatarDataISO(data: Date): string {
  return data.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function obterDiaSemana(data: Date): string {
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return dias[data.getDay()];
}

function proximoDiaUtil(
  data: Date,
  config: ConfigHorario,
  feriados: Feriado[]
): Date {
  return adicionarDiasUteis(data, 1, config, feriados);
}