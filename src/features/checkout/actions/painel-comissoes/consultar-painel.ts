"use server";
import { detalharComissaoPainel } from "../../queries/painel-comissoes/detalhar-comissao";
import { listarComissoesPainel } from "../../queries/painel-comissoes/listar-comissoes";
import { buscarOpcoesFiltrosComissoes } from "../../queries/painel-comissoes/opcoes-filtros";
export async function consultarPainelComissoes(entrada: unknown) {
  return listarComissoesPainel(entrada);
}
export async function consultarDetalheComissao(entrada: unknown) {
  return detalharComissaoPainel(entrada);
}
export async function consultarOpcoesComissoes() {
  return buscarOpcoesFiltrosComissoes();
}
