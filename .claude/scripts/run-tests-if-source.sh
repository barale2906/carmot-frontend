#!/bin/bash
# Ejecuta los tests unitarios cuando se modifica un archivo fuente en src/.
# Recibe JSON en stdin con la forma { "tool_input": { "file_path": "..." } }.
# Retorna 0 si los tests pasan o no aplica, 2 si fallan (para asyncRewake).

FILE=$(python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Sin ruta → salir silenciosamente
[ -z "$FILE" ] && exit 0

# Solo actuar sobre .js y .vue dentro de src/
echo "$FILE" | grep -qE '/carmot-frontend/src/.*\.(js|vue)$' || exit 0

# Si el contenedor no está activo → salir silenciosamente (no bloquear)
cd /mnt/trabajo/repos/Front/carmot-frontend
docker compose exec -T vue true 2>/dev/null || exit 0

# Ejecutar tests y capturar salida
OUTPUT=$(docker compose exec -T vue npm run test:run 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    # Salida 2 → asyncRewake notifica a Claude con el output
    echo "$OUTPUT"
    exit 2
fi

exit 0
