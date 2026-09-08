import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const raiz = process.cwd();
const fonteFooter = readFileSync(
  path.join(raiz, "src/components/common/footer.tsx"),
  "utf8",
);
const fonteContatoDesenvolvedor = readFileSync(
  path.join(raiz, "src/components/common/contato-desenvolvedor.tsx"),
  "utf8",
);

test("footer apresenta a identidade e os dados legais aprovados", () => {
  assert.match(fonteFooter, /Da compra à entrega/);
  assert.match(fonteFooter, /Uma experiência de compra/);
  assert.match(fonteFooter, /CNPJ: 48\.732\.308\/0001-58/);
  assert.match(fonteFooter, /Belo Horizonte\/MG/);
});

test("footer não contém selos ou newsletter removidos", () => {
  assert.doesNotMatch(
    fonteFooter,
    /Compra segura|Frete grátis|Garantia 12 meses|Receba novidades/,
  );
});

test("fallback do footer contém somente rotas públicas comprovadas", () => {
  assert.match(fonteFooter, /href: "\/contato"/);
  assert.match(fonteFooter, /href: "\/atendimento"/);
  assert.match(fonteFooter, /href: "\/minha-conta\/pedidos"/);
  assert.doesNotMatch(fonteFooter, /href: "\/formas-de-pagamento"/);
});

test("contato do desenvolvedor é identificado e reutiliza canais protegidos", () => {
  assert.match(fonteContatoDesenvolvedor, /Contato do desenvolvedor/);
  assert.match(fonteContatoDesenvolvedor, /Falar com Junior Rocha/);
  assert.match(fonteContatoDesenvolvedor, /BotaoCanalHumano/);
  assert.doesNotMatch(
    `${fonteFooter}\n${fonteContatoDesenvolvedor}`,
    /contato@nooo\.com\.br|5531988421694/,
  );
});
