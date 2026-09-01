#!/usr/bin/env bash
# Cambia la dirección pública del sitio en todos los archivos que la traen
# escrita: la etiqueta canónica, las de Open Graph, los datos estructurados,
# el sitemap y el robots.txt.
#
#   ./scripts/cambiar-dominio.sh https://rodtech.com.mx
#
# La dirección actual se lee del propio sitemap.xml, así que el script se
# puede correr las veces que haga falta (subdominio de Vercel primero,
# dominio propio después) sin tocar nada a mano.
set -euo pipefail

NUEVO="${1:-}"
if [[ -z "$NUEVO" ]]; then
  echo "Uso: $0 https://tu-dominio.com" >&2
  exit 1
fi
NUEVO="${NUEVO%/}"                       # sin diagonal final
if [[ ! "$NUEVO" =~ ^https?://[A-Za-z0-9.-]+$ ]]; then
  echo "Eso no parece una dirección válida: $NUEVO" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

ACTUAL="$(sed -n 's#.*<loc>\(https\?://[^/<]*\).*#\1#p' sitemap.xml | head -1)"
if [[ -z "$ACTUAL" ]]; then
  echo "No pude leer la dirección actual de sitemap.xml" >&2
  exit 1
fi

if [[ "$ACTUAL" == "$NUEVO" ]]; then
  echo "El sitio ya apunta a $NUEVO — no hay nada que cambiar."
  exit 0
fi

ARCHIVOS=(index.html aviso-privacidad.html sitemap.xml robots.txt README.md)
for f in "${ARCHIVOS[@]}"; do
  [[ -f "$f" ]] || continue
  # El separador es | porque la dirección trae diagonales
  sed -i.bak "s|${ACTUAL}|${NUEVO}|g" "$f" && rm -f "$f.bak"
done

# La fecha del sitemap se actualiza sola: si cambia la dirección, cambió el sitio
sed -i.bak "s|<lastmod>[0-9-]*</lastmod>|<lastmod>$(date +%F)</lastmod>|" sitemap.xml && rm -f sitemap.xml.bak

echo "Listo: $ACTUAL  →  $NUEVO"
grep -rn --include='*.html' --include='*.xml' --include='*.txt' "$NUEVO" . | grep -v '^./.git' | wc -l | xargs echo "Referencias actualizadas:"
