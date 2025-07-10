#!/bin/bash

# Base path
BASE_DIR="kherson-ndvi-analysis"

# Create folders
mkdir -p $BASE_DIR/gee/logic
mkdir -p $BASE_DIR/gee/ui
mkdir -p $BASE_DIR/archive
mkdir -p $BASE_DIR/docs
mkdir -p $BASE_DIR/screenshots

# Create main files
echo "// Entry point: calls logic and UI" > $BASE_DIR/gee/main.js
echo "// NDVI-related functions" > $BASE_DIR/gee/logic/ndvi.js
echo "// Z-score correction logic" > $BASE_DIR/gee/logic/zscore.js
echo "// Region geometries" > $BASE_DIR/gee/logic/regions.js
echo "// Frontline asset loading + conversion" > $BASE_DIR/gee/logic/frontline.js
echo "// UI for the Earth Engine App" > $BASE_DIR/gee/ui/app.js

# Archive placeholder
echo "// Old version of NDVI code (archived)" > $BASE_DIR/archive/ndvi_old_v1.js

# Docs
echo "# Method\nExplain Z-score correction, NDVI season choice, etc." > $BASE_DIR/docs/method.md
echo "# UI Plan\nIdeas for year selection, charts, interactivity." > $BASE_DIR/docs/ui-plan.md

# README
echo "# Kherson NDVI Analysis\nPublic demo of GEE-based Z-score NDVI analysis with modular code." > $BASE_DIR/README.md

echo "✅ Project structure created in $BASE_DIR"
