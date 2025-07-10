#!/bin/bash

# Output file
OUTPUT="gee/main.js"

# Start clean
echo "// Auto-generated main.js for GEE" > $OUTPUT
echo "// Generated on $(date)" >> $OUTPUT
echo "" >> $OUTPUT

# Append modules in order
cat gee/logic/regions.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/ndvi.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/zscore.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/zscore_visual.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

cat gee/logic/frontline.js >> $OUTPUT
echo -e "\n" >> $OUTPUT

# Optionally append UI or orchestration block
cat gee/ui/app.js >> $OUTPUT

echo "✅ main.js built successfully from modules."
