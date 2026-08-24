import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizarValoresEnumPostgres,
  validarEstruturaPaginasDinamicas,
} from "./validar-estrutura-paginas-dinamicas";

const estruturaValida = {
  tabelas: ["grupo_paginas", "grupos_navegacao", "paginas_dinamicas"],
  enums: [
    { nome: "grupo_navegacao_local", valores: "{rodape}" },
    {
      nome: "pagina_dinamica_status",
      valores: "{rascunho,publicada,arquivada}",
    },
  ],
  indices: [
    "grupo_paginas_grupo_ordem_idx",
    "grupo_paginas_grupo_pagina_unique",
    "grupo_paginas_pagina_idx",
    "grupos_navegacao_ativo_idx",
    "grupos_navegacao_identificador_unique",
    "grupos_navegacao_local_ordem_idx",
    "paginas_dinamicas_slug_unique",
    "paginas_dinamicas_status_idx",
    "paginas_dinamicas_updated_at_idx",
  ],
  restricoes: [
    "grupo_paginas_grupo_id_grupos_navegacao_id_fk",
    "grupo_paginas_pagina_id_paginas_dinamicas_id_fk",
    "grupo_paginas_pkey",
    "grupos_navegacao_pkey",
    "paginas_dinamicas_pkey",
  ],
};

test("normaliza o literal PostgreSQL que causava o falso negativo", () => {
  assert.deepEqual(normalizarValoresEnumPostgres("{rodape}"), ["rodape"]);
  assert.deepEqual(normalizarValoresEnumPostgres(["rascunho", "publicada"]), [
    "rascunho",
    "publicada",
  ]);
  assert.doesNotThrow(() => validarEstruturaPaginasDinamicas(estruturaValida));
});

test("continua rejeitando enum ou estrutura divergente", () => {
  assert.throws(() =>
    validarEstruturaPaginasDinamicas({
      ...estruturaValida,
      enums: [{ nome: "grupo_navegacao_local", valores: "{cabecalho}" }],
    }),
  );
});
