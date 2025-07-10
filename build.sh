#!/bin/bash

# Output file
OUTPUT="gee/main.js"
DEBUG=false

# Optional: --debug flag
if [[ "$1" == "--debug" ]]; then
  DEBUG=true
fi

# Check required files
required_files=(
  gee/logic/regions.js
  gee/logic/config.js
  gee/logic/ndvi.js
  gee/logic/zscore.js
  gee/logic/zscore_visual.js
  gee/logic/frontline.js
  gee/ui/app.js
)

for file in "${required_files[@]}"; do
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

# Append modules in order
cat gee/logic/regions.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/config.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/ndvi.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/zscore.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/zscore_visual.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/frontline.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

# UI orchestration last
cat gee/ui/app.js >> $OUTPUT

echo "✅ main.js built successfully from modules."
$DEBUG && echo "📎 Debug mode active: comments/logs may be preserved."
