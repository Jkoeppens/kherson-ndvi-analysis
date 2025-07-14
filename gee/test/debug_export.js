// --- Debugging-Skript für NDVI-Export ---
// Dieses Skript sollte *nach* config, region, ndvi, export geladen werden.

// ✅ Zielregion definieren
var regionKey = 'kherson';
var year = 2020;

// ✅ Prüfen, ob Region existiert
if (!isValidRegion(regionKey)) {
  throw new Error('❌ Ungültiger Regionsname: ' + regionKey);
}

// 🧪 Region anzeigen
var region = regionDefs[regionKey];
Map.centerObject(region, 8);
Map.addLayer(region, {color: 'red'}, '📍 Region: ' + regionKey);

// 🧪 NDVI-Bild anzeigen
var ndvi = getYearlyNDVI(year, region);
Map.addLayer(ndvi, {min: 0, max: 1, palette: ['white', 'green']}, '🖼️ NDVI ' + year);

// 🧪 Export starten (erscheint unter "Tasks")
exportNDVIToAsset(regionKey, year);
