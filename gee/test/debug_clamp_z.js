// 🔧 Parameter
var region = exports.regionDefs.kherson.geometry;
var year = 2023;
var rawZ = calculateZImage(year, region);

// 📌 Statistiken für Original-Z-Bild
rawZ.reduceRegion({
  reducer: ee.Reducer.minMax()
            .combine(ee.Reducer.mean(), '', true)
            .combine(ee.Reducer.stdDev(), '', true),
  geometry: region,
  scale: config.scale,
  maxPixels: config.maxPixels
}).evaluate(function(stats) {
  var zMean = stats['Z_mean'];
  var zStd = stats['Z_stdDev'];
  var lower = zMean - 5 * zStd;
  var upper = zMean + 5 * zStd;

  print('📊 Z Mean:', zMean, 'Z StdDev:', zStd);
  print('🔧 Clipping-Bereich:', lower, 'bis', upper);

  // Clipping anwenden
  var clamped = rawZ.clamp(lower, upper).rename('Z_clamped');

  // Anzahl der geclampeden Pixel
  var numClamped = rawZ.neq(clamped).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  });

  numClamped.get('Z').evaluate(function(n) {
    print('⚠️ Geclampte Pixel (Z außerhalb ±5σ):', n);
  });

  // Karte zeigen
  Map.centerObject(region, 8);
  Map.addLayer(clamped, {min: -3, max: 3, palette: ['red', 'white', 'green']}, 'Z-geclamped ' + year);

  // Statistik des geclampeden Bilds
  clamped.reduceRegion({
    reducer: ee.Reducer.minMax()
              .combine(ee.Reducer.mean(), '', true)
              .combine(ee.Reducer.stdDev(), '', true),
    geometry: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).evaluate(function(statsClamped) {
    print('📊 Stats nach Clipping:', statsClamped);
  });
});
// 🔢 Gesamtzahl gültiger Pixel im Z-Bild
var totalValid = Z.unmask().reduceRegion({
  reducer: ee.Reducer.count(),
  geometry: region,
  scale: 30,
  maxPixels: 1e9
}).get('Z');

// 📊 Anteil der geclampeten Pixel
var clampedFraction = ee.Number(numClamped).divide(totalValid);

// 📤 Ausgabe
print('📈 Anteil geclampter Pixel (in %):', clampedFraction.multiply(100));
