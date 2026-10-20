CREATE SEQUENCE IF NOT EXISTS "public"."checkout_pedidos_numero_pedido_seq"
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1001
  CACHE 1
  NO CYCLE;
--> statement-breakpoint
DO $$
DECLARE
  maior_numero_pedido numeric;
  ultimo_valor_sequence bigint;
  sequence_ja_chamada boolean;
  proximo_valor bigint;
BEGIN
  SELECT max(substring("numero_pedido" FROM '^#([0-9]+)$')::numeric)
    INTO maior_numero_pedido
    FROM "public"."checkout_pedidos"
   WHERE "numero_pedido" ~ '^#[0-9]+$';

  IF maior_numero_pedido > 9223372036854775806 THEN
    RAISE EXCEPTION 'Número público de pedido excede a capacidade da sequence';
  END IF;

  SELECT last_value, is_called
    INTO ultimo_valor_sequence, sequence_ja_chamada
    FROM "public"."checkout_pedidos_numero_pedido_seq";

  proximo_valor := greatest(
    1001::bigint,
    coalesce(maior_numero_pedido, 0)::bigint + 1,
    CASE
      WHEN sequence_ja_chamada THEN ultimo_valor_sequence + 1
      ELSE ultimo_valor_sequence
    END
  );

  -- Com is_called=false, o próximo nextval retorna exatamente proximo_valor.
  PERFORM setval(
    'public.checkout_pedidos_numero_pedido_seq',
    proximo_valor,
    false
  );
END $$;
