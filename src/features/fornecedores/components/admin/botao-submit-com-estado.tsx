"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type BotaoSubmitComEstadoProps = Omit<
  ComponentProps<typeof Button>,
  "type" | "children"
> & {
  /** Conteúdo normal do botão, exibido enquanto nada está em andamento. */
  children: ReactNode;
  /** Texto exibido durante o processamento. Ex.: "Aplicando mapeamento…". */
  textoProcessando: string;
};

/**
 * Botão de envio que se desabilita sozinho enquanto a Server Action do formulário roda.
 *
 * Por que é um componente separado
 * --------------------------------
 * O `useFormStatus` só enxerga o formulário quando é chamado de dentro de um componente
 * **filho** do `<form>`. Se o mesmo componente que renderiza o `<form>` chamasse o hook,
 * `pending` ficaria eternamente `false` — o botão pareceria protegido sem estar.
 *
 * Isso resolve o duplo clique de forma estrutural: não há estado manual para esquecer de
 * limpar, nem janela entre o clique e a atualização do estado. O React marca `pending` no
 * mesmo instante em que a submissão começa e só libera quando a ação termina — inclusive
 * quando ela termina em `redirect()`, caso do "Continuar para vínculos": o botão continua
 * desabilitado durante toda a navegação para a etapa seguinte.
 */
export function BotaoSubmitComEstado({
  children,
  textoProcessando,
  disabled,
  ...props
}: BotaoSubmitComEstadoProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      // `aria-busy` avisa leitores de tela que há uma operação em curso; `aria-disabled`
      // mantém o botão anunciado como indisponível mesmo em navegadores que ignoram o
      // `disabled` nativo em elementos com conteúdo dinâmico.
      aria-busy={pending}
      aria-disabled={pending || disabled}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {textoProcessando}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
