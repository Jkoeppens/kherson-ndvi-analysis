// 🛠 Region wählen (z. B. Kherson)
var region = exports.regionDefs.kherson.geometry;
var baselineYears = exports.config.baselineYears;
var scale = exports.config.scale;
var maxPixels = exports.config.maxPixels;

// 🧪 1. Bildanzahl und NDVI-Maskierung pro Jahr analysieren
baselineYears.forEach(function(year) {
  var ndviCol = exports.getNDVISeason(year, region).map(function(img) {
    return img.select('NDVI').set('maskFraction', img.select('NDVI').mask().reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: region,
      scale: scale,
      maxPixels: maxPixels
    }).get('NDVI'));
  });

  print('🗓 Jahr ' + year + ': Anzahl Bilder =', ndviCol.size());

  ndviCol.aggregate_stats('maskFraction').evaluate(function(stats) {
    print('🧼 NDVI-Maskierungsanteile in ' + year + ':', stats);
  });
});

// 🧪 2. Baseline-Medianbilder pro Jahr anzeigen
var baselineCol = ee.ImageCollection(baselineYears.map(function(y) {
  return exports.getNDVISeason(y, region).median().select('NDVI').rename('NDVI_' + y);
}));

Map.centerObject(region, 9);
Map.addLayer(baselineCol.median(), {min: 0, max: 0.8, palette: ['white', 'green']}, 'Baseline Median NDVI');

// 🧪 3. Baseline berechnen und StdDev visualisieren
var baseline = exports.calculateBaseline(baselineYears, region, exports.getNDVISeason);
var stdDev = baseline.stdDev;
Map.addLayer(stdDev, {min: 0, max: 0.2, palette: ['white', 'blue']}, 'NDVI StdDev');

// 🧪 4. Histogramm analysieren
stdDev.reduceRegion({
  reducer: ee.Reducer.histogram({maxBuckets: 100}),
  geometry: region,
  scale: scale,
  maxPixels: maxPixels
}).get('NDVI_stdDev').evaluate(function(hist) {
  if (!hist || !hist.bucketCounts || !hist.bucketWidth) {
    print('⚠️ Kein gültiges Histogramm der NDVI-StdDev verfügbar.');
    return;
  }

  print('📊 Histogramm der NDVI-StdDev:', hist);

  var counts = hist.bucketCounts;
  var width = hist.bucketWidth;
  var min = hist.min;

  var total = counts.reduce(function(a, b) { return a + b; }, 0);
  var clippedCount = 0;

  for (var i = 0; i < counts.length; i++) {
    var bucketCenter = min + width * (i + 0.5);
    if (bucketCenter < 0.05) {
      clippedCount += counts[i];
    }
  }

  var ratio = clippedCount / total;
  print('📉 Anteil der StdDev-Werte < 0.05:', ratio);
});
