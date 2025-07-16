/**
 * Debugging-Skript für NDVI-Differenz (Delta zum Median der Baseline).
 */

var region = ee.Geometry.Rectangle([32.0, 46.0, 33.0, 47.0]);
var year = 2023;

// 1. Aktuelles NDVI-Median-Bild berechnen
var ndviCol = exports.getNDVISeason(year, region);
print('\u{1F4E6} NDVI-Kollektion Gr\u00f6\u00dfe:', ndviCol.size());

var ndviMedian = ndviCol.median();
print('\u{1F9EA} NDVI Median B\u00e4nder:', ndviMedian.bandNames());
Map.addLayer(ndviMedian, {min: 0, max: 0.8, palette: ['white', 'green']}, 'NDVI Median ' + year);

// 2. NDVI-Baseline-Median aus Vorjahren berechnen
var baselineMedian = exports.calculateBaselineMedian(config.baselineYears, region, exports.getNDVISeason);
print('\u{1F4E6} Baseline Median B\u00e4nder:', baselineMedian.bandNames());
Map.addLayer(baselineMedian, {min: 0, max: 0.8, palette: ['white', 'blue']}, 'NDVI Baseline Median');

// 3. NDVI-Differenz berechnen und visualisieren
var deltaImage = ndviMedian.subtract(baselineMedian).rename('NDVI_Delta');
print('\u{1F4CA} Delta B\u00e4nder:', deltaImage.bandNames());
Map.addLayer(deltaImage, {min: -0.3, max: 0.3, palette: ['red', 'white', 'green']}, 'NDVI Delta ' + year);

// 4. Histogramm der Delta-Werte berechnen
var hist = deltaImage.reduceRegion({
  reducer: ee.Reducer.histogram({maxBuckets: 100}),
  geometry: region,
  scale: config.scale,
  maxPixels: config.maxPixels
});

hist.get('NDVI_Delta').evaluate(function(h) {
  if (!h) {
    print('\u26A0\uFE0F Kein Histogramm verf\u00fcgbar.');
    return;
  }
  print('\u{1F4C8} Histogramm der NDVI-Differenz:', h);
});
