// 🔧 Parameter
var region = exports.regionDefs.kherson.geometry;
var year = 2023;

// 📊 Z-Score-Bild berechnen (ohne Maske)
var zImage = calculateZImage(year, region);

// 🗺 Karte anzeigen
Map.centerObject(region, 8);
Map.addLayer(zImage, {min: -3, max: 3, palette: ['red', 'white', 'green']}, 'Z-Score ' + year);

// 📈 Histogramm der Z-Werte berechnen
zImage.reduceRegion({
  reducer: ee.Reducer.histogram({maxBuckets: 100}),
  geometry: region,
  scale: config.scale,
  maxPixels: config.maxPixels
}).get('Z').evaluate(function(hist) {
  if (!hist) {
    print('⚠️ Kein Histogramm verfügbar.');
    return;
  }
  print('📈 Histogramm der Z-Werte:', hist);
});

// 📊 Basisstatistiken berechnen
zImage.reduceRegion({
  reducer: ee.Reducer.minMax()
            .combine(ee.Reducer.mean(), '', true)
            .combine(ee.Reducer.stdDev(), '', true),
  geometry: region,
  scale: config.scale,
  maxPixels: config.maxPixels
}).evaluate(function(stats) {
  print('📊 Basisstatistiken Z:', stats);

  // 🧹 Extremwerte zählen
  var zMin = stats['Z_min'];
  var zMax = stats['Z_max'];
  var zStdDev = stats['Z_stdDev'];
  var zMean = stats['Z_mean'];

  var upperBound = zMean + 5 * zStdDev;
  var lowerBound = zMean - 5 * zStdDev;

  var outliers = zImage
    .gt(upperBound).or(zImage.lt(lowerBound))
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: region,
      scale: config.scale,
      maxPixels: config.maxPixels
    });

  outliers.get('Z').evaluate(function(o) {
    print('⚠️ Pixel außerhalb ±5σ:', o);
  });
});
