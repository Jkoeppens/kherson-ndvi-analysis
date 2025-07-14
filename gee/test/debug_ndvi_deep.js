// ⚙️ Konfiguration & Zielparameter
var region = exports.regionDefs.kherson.geometry;
var year = 2023;
var months = exports.config.analysisMonths;
var scale = exports.config.scale;
var maxPixels = exports.config.maxPixels;

// 🧪 NDVI-Saison holen und maskFraction setzen
var ndviCol = exports.getNDVISeason(year, region, months).map(function(img) {
  return img.select('NDVI').set('maskFraction', img.select('NDVI').mask().reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: region,
    scale: scale,
    maxPixels: maxPixels
  }).get('NDVI'));
});

// 🧾 1. Bildanzahl prüfen
print('🗓 Jahr ' + year + ': Anzahl NDVI-Bilder =', ndviCol.size());

// 🧾 2. Statistik über Maskierung pro Bild
ndviCol.aggregate_stats('maskFraction').evaluate(function(stats) {
  print('🧼 NDVI-Maskierungsanteile in ' + year + ':', stats);
});

// 🗺 3. NDVI-Median visualisieren
var ndviMedian = ndviCol.median();
Map.centerObject(region, 9);
Map.addLayer(ndviMedian, {min: 0, max: 0.8, palette: ['white', 'green']}, 'NDVI Median ' + year);

// 🔍 4. Bandnamen prüfen
print('🔍 Bandnamen NDVI-Median:', ndviMedian.bandNames());

// 🔎 5. Histogramm für NDVI-Werte (optional)
ndviMedian.reduceRegion({
  reducer: ee.Reducer.histogram({maxBuckets: 100}),
  geometry: region,
  scale: scale,
  maxPixels: maxPixels
}).get('NDVI').evaluate(function(hist) {
  if (!hist) {
    print('⚠️ Kein Histogramm der NDVI-Werte berechnet.');
    return;
  }
  print('📈 Histogramm der NDVI-Werte:', hist);
});
