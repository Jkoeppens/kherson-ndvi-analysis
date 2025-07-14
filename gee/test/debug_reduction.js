/**
 * Test: Reduktion NDVI-Zeitreihe ohne Maskierung
 * Ziel: Prüfen, ob das Reduktionsproblem an der Maske liegt
 */

var region = regionDefs.kherson.geometry;
Map.centerObject(region, 8);

var collection = ee.ImageCollection(config.baselineYears.map(function (y) {
  return getNDVISeason(y, region).median();
}));

print('🧪 Collection ohne Maske:', collection);

var reduced = collection.reduce(ee.Reducer.median().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
}));

print('🧪 Reduziert (ohne Maske):', reduced);
print('📛 Bandnamen:', reduced.bandNames());

Map.addLayer(reduced.select(0), {min: 0, max: 1}, '🧪 Median NDVI');
Map.addLayer(reduced.select(1), {min: 0.01, max: 0.1}, '🧪 StdDev NDVI');
