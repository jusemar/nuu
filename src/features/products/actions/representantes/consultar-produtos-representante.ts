"use server";
import {
  buscarOpcoesFormularioRepresentante,
  buscarProdutoEdicaoRepresentante,
} from "../../queries/representantes/buscar-formulario-representante";
import { buscarPerfilProdutosAdmin } from "../../queries/representantes/buscar-perfil-produtos-admin";
import { listarProdutosRepresentante } from "../../queries/representantes/listar-produtos-representante";

// Adaptadores de transporte; autorização e leitura ficam nas queries server-only.
export async function consultarPerfilProdutosAdmin() {
  return buscarPerfilProdutosAdmin();
}
export async function consultarProdutosRepresentante(entrada: unknown) {
  return listarProdutosRepresentante(entrada);
}
export async function consultarOpcoesFormularioRepresentante() {
  return buscarOpcoesFormularioRepresentante();
}
export async function consultarProdutoEdicaoRepresentante(entrada: unknown) {
  return buscarProdutoEdicaoRepresentante(entrada);
}
