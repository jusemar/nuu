import "server-only";

import { timingSafeEqual } from "node:crypto";

import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import {
  desafiosOtpTelefoneTable,
  emissoesOtpTelefoneTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type {
  RepositorioOtpTelefone,
  ResultadoConsumoOtp,
} from "../../types/otp-telefone.types";
import { POLITICA_OTP_TELEFONE } from "./politica-otp-telefone";

function hashesIguais(a: string, b: string) {
  const primeiro = Buffer.from(a, "hex");
  const segundo = Buffer.from(b, "hex");
  return (
    primeiro.length === segundo.length && timingSafeEqual(primeiro, segundo)
  );
}

export const repositorioOtpTelefoneDrizzle: RepositorioOtpTelefone = {
  async emitir(dados) {
    return dbTransacional.transaction(async (tx) => {
      // Serializa emissões do mesmo número mesmo quando ainda não há desafio.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${dados.telefoneHash}))`,
      );

      const umaHoraAtras = new Date(dados.agora.getTime() - 60 * 60 * 1_000);
      const umDiaAtras = new Date(dados.agora.getTime() - 24 * 60 * 60 * 1_000);
      const [ultima] = await tx
        .select({ criadoEm: emissoesOtpTelefoneTable.criadoEm })
        .from(emissoesOtpTelefoneTable)
        .where(eq(emissoesOtpTelefoneTable.telefoneHash, dados.telefoneHash))
        .orderBy(desc(emissoesOtpTelefoneTable.criadoEm))
        .limit(1);

      if (
        ultima &&
        dados.agora.getTime() - ultima.criadoEm.getTime() <
          POLITICA_OTP_TELEFONE.reenvioSegundos * 1_000
      ) {
        return { permitido: false, motivo: "REENVIO" } as const;
      }

      const [[porNumeroHora], [porNumeroDia], [porIpHora]] = await Promise.all([
        tx
          .select({ total: count() })
          .from(emissoesOtpTelefoneTable)
          .where(
            and(
              eq(emissoesOtpTelefoneTable.telefoneHash, dados.telefoneHash),
              gte(emissoesOtpTelefoneTable.criadoEm, umaHoraAtras),
            ),
          ),
        tx
          .select({ total: count() })
          .from(emissoesOtpTelefoneTable)
          .where(
            and(
              eq(emissoesOtpTelefoneTable.telefoneHash, dados.telefoneHash),
              gte(emissoesOtpTelefoneTable.criadoEm, umDiaAtras),
            ),
          ),
        tx
          .select({ total: count() })
          .from(emissoesOtpTelefoneTable)
          .where(
            and(
              eq(emissoesOtpTelefoneTable.ipHash, dados.ipHash),
              gte(emissoesOtpTelefoneTable.criadoEm, umaHoraAtras),
            ),
          ),
      ]);

      if ((porNumeroHora?.total ?? 0) >= POLITICA_OTP_TELEFONE.maximoHora)
        return { permitido: false, motivo: "LIMITE_HORA" } as const;
      if ((porNumeroDia?.total ?? 0) >= POLITICA_OTP_TELEFONE.maximoDia)
        return { permitido: false, motivo: "LIMITE_DIA" } as const;
      if ((porIpHora?.total ?? 0) >= POLITICA_OTP_TELEFONE.maximoHora)
        return { permitido: false, motivo: "LIMITE_IP" } as const;

      await tx
        .insert(desafiosOtpTelefoneTable)
        .values(dados)
        .onConflictDoUpdate({
          target: [
            desafiosOtpTelefoneTable.telefoneHash,
            desafiosOtpTelefoneTable.finalidade,
          ],
          set: {
            id: dados.id,
            ipHash: dados.ipHash,
            codigoHash: dados.codigoHash,
            tentativas: 0,
            expiraEm: dados.expiraEm,
            consumidoEm: null,
            atualizadoEm: dados.agora,
          },
        });
      await tx.insert(emissoesOtpTelefoneTable).values({
        id: dados.id,
        telefoneHash: dados.telefoneHash,
        ipHash: dados.ipHash,
        criadoEm: dados.agora,
      });

      return { permitido: true } as const;
    });
  },

  async consumir(entrada): Promise<ResultadoConsumoOtp> {
    return dbTransacional.transaction(async (tx) => {
      const [desafio] = await tx
        .select()
        .from(desafiosOtpTelefoneTable)
        .where(
          and(
            eq(desafiosOtpTelefoneTable.telefoneHash, entrada.telefoneHash),
            eq(desafiosOtpTelefoneTable.finalidade, entrada.finalidade),
          ),
        )
        .for("update")
        .limit(1);

      if (!desafio) return "INEXISTENTE";
      if (desafio.consumidoEm) return "CONSUMIDO";
      if (desafio.expiraEm <= entrada.agora) return "EXPIRADO";
      if (desafio.tentativas >= POLITICA_OTP_TELEFONE.maximoTentativas)
        return "BLOQUEADO";

      const valido =
        desafio.ipHash === entrada.ipHash &&
        hashesIguais(desafio.codigoHash, entrada.codigoHash);

      if (!valido) {
        const novasTentativas = desafio.tentativas + 1;
        await tx
          .update(desafiosOtpTelefoneTable)
          .set({ tentativas: novasTentativas, atualizadoEm: entrada.agora })
          .where(eq(desafiosOtpTelefoneTable.id, desafio.id));
        return novasTentativas >= POLITICA_OTP_TELEFONE.maximoTentativas
          ? "BLOQUEADO"
          : "INVALIDO";
      }

      await tx
        .update(desafiosOtpTelefoneTable)
        .set({ consumidoEm: entrada.agora, atualizadoEm: entrada.agora })
        .where(eq(desafiosOtpTelefoneTable.id, desafio.id));
      return "VALIDO";
    });
  },

  async invalidar(telefoneHash, finalidade) {
    await dbTransacional
      .update(desafiosOtpTelefoneTable)
      .set({ consumidoEm: new Date(), atualizadoEm: new Date() })
      .where(
        and(
          eq(desafiosOtpTelefoneTable.telefoneHash, telefoneHash),
          eq(desafiosOtpTelefoneTable.finalidade, finalidade),
        ),
      );
  },
};
