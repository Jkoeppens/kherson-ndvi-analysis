#!/bin/bash

# Output file
OUTPUT="gee/main.js"
DEBUG=false

# Optional: --debug flag
if [[ "$1" == "--debug" ]]; then
  DEBUG=true
fi

logic_files=(
  gee/logic/config.js
  gee/logic/regions.js
  gee/logic/ndvi.js
  gee/logic/export.js
  gee/logic/zscore.js
  gee/logic/exportzdiff.js
  gee/logic/frontline.js
)

ui_file="gee/ui/app.js"

# Check all required files
for file in "${logic_files[@]}" "$ui_file"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

# Start clean
echo "// Auto-generated main.js for GEE" > $OUTPUT
echo "// Generated on $(date)" >> $OUTPUT
$DEBUG && echo "// DEBUG MODE ENABLED" >> $OUTPUT
echo "" >> $OUTPUT

# Append logic modules
for file in "${logic_files[@]}"; do
  echo "// --- $file ---" >> $OUTPUT
  cat "$file" >> $OUTPUT
  echo -e "\n" >> $OUTPUT
done

# Append UI last
echo "// --- $ui_file ---" >> $OUTPUT
cat "$ui_file" >> $OUTPUT

echo "✅ main.js built successfully from:"
for file in "${logic_files[@]}" "$ui_file"; do
  echo "   • $file"
done
$DEBUG && echo "📎 Debug mode active: logs/comments preserved."
