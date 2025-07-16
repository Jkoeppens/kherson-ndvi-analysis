/**
 * Testskript: Baseline-Berechnung prüfen
 * Module: config.js, regions.js, ndvi.js, zscore.js
 */

// Zielregion & Maske
var region = regionDefs.kherson.geometry;
var cropland = ee.Image(config.croplandSource);
var croplandMask = cropland.gt(0).clip(region);

// Baseline berechnen
var result = calculateBaseline(config.baselineYears, region, croplandMask);

// Ausgabe
Map.centerObject(region, 8);
Map.addLayer(result.median, {min: 0, max: 1, palette: config.zPalette}, 'Baseline Median');
Map.addLayer(result.stdDev, {min: 0, max: 0.2, palette: ['white', 'red']}, 'Baseline StdDev');

print('✅ Baseline Median:', result.median);
print('✅ Baseline StdDev:', result.stdDev);
