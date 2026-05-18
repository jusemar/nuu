UPDATE "checkout_pedidos"
SET "status" = 'processing', "updated_at" = now()
WHERE "status" = 'paid'
  AND "pagamento_status" = 'paid';
