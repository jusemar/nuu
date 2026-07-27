# Design System oficial

Este documento registra a fundação visual única da plataforma. A fonte
executável dos tokens é `src/app/globals.css` e os componentes oficiais vivem em
`src/components/ui`.

## Auditoria inicial

A auditoria encontrou uma base shadcn/ui madura, com componentes para botões,
campos, seleção, cards, badges, tabelas, dialog, drawer/sheet, skeleton,
tooltip, tabs, accordion, carousel e toast. Radix UI garante os comportamentos
acessíveis dos componentes interativos e Lucide é a biblioteca principal de
ícones.

As inconsistências encontradas foram:

- cores hexadecimais e estados de toast definidos localmente;
- ausência de tokens semânticos oficiais para `warning` e `info`;
- dois níveis de sombra sem nomes de escala;
- container e ritmo vertical repetidos nas páginas;
- durações e easing sem uma escala documentada;
- Home com cor inline, botão cru e superfícies próprias;
- estilos históricos, páginas de teste e templates de e-mail com paletas
  independentes.

Templates de e-mail e conteúdo rico editável são exceções técnicas: clientes de
e-mail exigem CSS inline e cores escolhidas pelo editor representam conteúdo do
usuário. Eles não devem ser substituídos mecanicamente por variáveis CSS.

## Tokens oficiais

### Cores

- `primary`: identidade e ações principais;
- `secondary`: superfícies e ações secundárias;
- `accent-brand`: destaque comercial âmbar;
- `success`, `warning`, `destructive` e `info`: estados semânticos;
- `background`, `card`, `popover`, `muted`, `border` e `input`: escala neutra.

Cada token possui contraste próprio ou superfície clara quando necessário. A
paleta também possui equivalentes para modo escuro.

### Tipografia

Geist Sans é a fonte de interface e Geist Mono atende código, métricas e
identificadores. A escala deve usar os tamanhos nativos do Tailwind, mantendo
hierarquia semântica de um `h1` por página e `h2`/`h3` nas seções.

### Espaçamento, grid e responsividade

Use a escala nativa do Tailwind. Valores arbitrários só são aceitos quando
representam uma limitação técnica documentada. O componente `Container`
centraliza largura máxima de `7xl` e gutters `4 / 6 / 8`. O componente `Secao`
centraliza o ritmo `5 / 6`.

Breakpoints oficiais seguem Tailwind:

- base: mobile;
- `sm`: mobile amplo;
- `md`: tablet;
- `lg`: notebook;
- `xl`: desktop;
- `2xl`: ultrawide.

Layouts são mobile-first e grids devem evoluir progressivamente nesses
breakpoints.

### Radius, bordas e sombras

O radius raiz é `0.75rem`, derivando a escala `sm` a `3xl`. Use `border-border`
e os níveis `shadow-elevation-1`, `shadow-elevation-2` e
`shadow-elevation-3`. Os aliases legados `shadow-elevation` e
`shadow-elevation-lg` continuam disponíveis durante a migração.

### Movimento e estados

As durações oficiais são 150 ms (rápida), 200 ms (normal) e 300 ms (lenta), com
easing padrão e enfatizado. Hover não pode ser a única indicação de ação.
Focus deve usar `focus-visible` e `ring`; disabled deve bloquear interação e
reduzir opacidade; loading deve preservar dimensões. A preferência
`prefers-reduced-motion` é respeitada globalmente.

## Componentes

Antes de criar UI nova, consulte `src/components/ui`. Componentes de domínio
devem compor esses elementos, sem alterá-los diretamente. Novas variantes
visuais recorrentes pertencem ao componente base via CVA.

Modal usa `Dialog`, drawer responsivo usa `Sheet` ou `Drawer`, notificações usam
Sonner, e estados de carregamento usam `Skeleton`. Não implemente overlays,
foco, teclado ou portais manualmente.

## Migração

A Home é a primeira superfície migrada. O restante da plataforma pode ser
convertido por domínio, preservando regras de negócio e comportamento. Em cada
migração:

1. substituir cores fixas por tokens semânticos;
2. trocar elementos base por componentes de `ui`;
3. adotar `Container` e `Secao`;
4. validar light/dark, teclado, mobile e desktop;
5. remover o estilo legado somente quando não houver consumidores.
