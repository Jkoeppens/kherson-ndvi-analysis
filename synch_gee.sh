#!/bin/bash
#asuführen mit bash sync_gee.sh um die in gee_script_list.txt hinterlegten links automatisch herunterzuladen und in git zu committen

LOCAL_BASE="."  # direkt im Projektordner
LIST="gee_script_list.txt"

while read GEE_PATH; do
  RELATIVE_PATH="${GEE_PATH#users/jakobkoppermann/Ukraine_NDVIRep/}"
  LOCAL_PATH="$LOCAL_BASE/${RELATIVE_PATH}.js"
  LOCAL_DIR=$(dirname "$LOCAL_PATH")

  mkdir -p "$LOCAL_DIR"

  if [ -f "$LOCAL_PATH" ]; then
    cp "$LOCAL_PATH" "$LOCAL_PATH.bak"
    echo "🌀 Backup: $LOCAL_PATH → $LOCAL_PATH.bak"
  fi

  echo "⬇️  Exportiere $RELATIVE_PATH.js"
  earthengine get "$GEE_PATH" > "$LOCAL_PATH"

done < "$LIST"

echo "✅ Alle Skripte gespeichert unter $(pwd)"

git add .
git commit -m "Automatischer GEE-Export: $(date '+%Y-%m-%d %H:%M:%S')"

