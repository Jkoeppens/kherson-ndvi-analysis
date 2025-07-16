#!/bin/bash

# GEE-Export direkt in /Users/jakob/kherson-ndvi-analysis/
GEE_ROOT="users/jakobkoppermann/Ukraine_NDVIRep"
LOCAL_BASE="."  # direkt im aktuellen Verzeichnis

echo "📦 Starte Export aus GEE-Pfad: $GEE_ROOT"
mkdir -p "$LOCAL_BASE"

earthengine ls "$GEE_ROOT" --recursive | while read GEE_PATH; do
  if [[ "$GEE_PATH" != */ ]]; then
    # z. B. logic/main → ./logic/main.js
    RELATIVE_PATH="${GEE_PATH#${GEE_ROOT}/}"
    LOCAL_PATH="$LOCAL_BASE/${RELATIVE_PATH}.js"
    LOCAL_DIR=$(dirname "$LOCAL_PATH")

    mkdir -p "$LOCAL_DIR"

    if [ -f "$LOCAL_PATH" ]; then
      cp "$LOCAL_PATH" "$LOCAL_PATH.bak"
      echo "🌀 Backup: $LOCAL_PATH → $LOCAL_PATH.bak"
    fi

    echo "⬇️  Exportiere $RELATIVE_PATH.js"
    earthengine get "$GEE_PATH" > "$LOCAL_PATH"
  fi
done

echo "✅ Alle Skripte exportiert in: $(pwd)"

