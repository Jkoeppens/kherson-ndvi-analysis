/**
 * Exportiert alle NDVI-Jahreskarten für ausgewählte Regionen und Jahre.
 * Baut auf `exportNDVIToAsset(regionKey, year)` auf.
 */

// 🔧 Regionen definieren, für die exportiert werden soll
var exportRegions = ['kherson', 'vinnytsia'];  // kannst du beliebig erweitern

// 🔧 Zeiträume aus config.js
var allYears = config.baselineYears.concat(config.analysisYears);

// 🔁 Schleife über Regionen und Jahre
exportRegions.forEach(function(regionKey) {
  if (!isValidRegion(regionKey)) {
    print('⚠️ Ungültiger Regionsname übersprungen:', regionKey);
    return;
  }

  allYears.forEach(function(year) {
    exportNDVIToAsset(regionKey, year);
  });
});

print('✅ NDVI-Exporte initialisiert für:', exportRegions, 'Jahre:', allYears);
