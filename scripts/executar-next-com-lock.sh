#!/usr/bin/env bash

set -u

modo="${1:-}"
if [[ "$modo" != "dev" && "$modo" != "build" && "$modo" != "start" ]]; then
  echo "Uso: bash scripts/executar-next-com-lock.sh <dev|build|start>" >&2
  exit 1
fi
shift

# O lock é mantido pelo kernel e fica fora de `.next`. Ele é liberado
# automaticamente quando o processo termina, inclusive após Ctrl+C.
identificador="$(printf '%s' "$PWD" | sha256sum | cut -c1-12)"
arquivo_lock="${TMPDIR:-/tmp}/nuu-next-${identificador}.lock"
exec 9>"$arquivo_lock"

if ! flock --exclusive --nonblock 9; then
  echo "[next-lock] Operação bloqueada: já existe dev, build ou start ativo neste projeto." >&2
  echo "[next-lock] Encerre a instância existente antes de continuar." >&2
  exit 1
fi

exec node node_modules/next/dist/bin/next "$modo" "$@"
