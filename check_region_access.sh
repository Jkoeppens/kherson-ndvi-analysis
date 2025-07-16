#!/bin/bash

echo "🔍 Scanning for regionDefs[...] usage:"
echo

grep -nR "regionDefs\[[^]]\+\]" gee/ | while read -r line; do
  echo "👉 $line"
done

echo
echo "✅ Überprüfe jede Zeile: Wenn ein ee.Geometry erwartet wird → .geometry ergänzen."
echo "Beispiel: regionDefs[regionKey] → regionDefs[regionKey].geometry"
