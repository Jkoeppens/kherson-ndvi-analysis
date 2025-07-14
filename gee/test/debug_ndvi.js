// 🌍 Region definieren
var regionDefs = {
  kherson: ee.FeatureCollection("FAO/GAUL/2015/level1")
    .filter(ee.Filter.eq('ADM1_NAME', 'Kherson'))
    .geometry(),
  vinnytsia: ee.FeatureCollection("FAO/GAUL/2015/level1")
    .filter(ee.Filter.eq('ADM1_NAME', 'Vinnytska'))
    .geometry()
};

// 🔧 Parameter
var regionKey = 'kherson';
var year = 2023;
var region = regionDefs[regionKey];

// 📥 NDVI berechnen
var ndvi = getYearlyNDVI(year, region);

// 📊 Histogramm (funktioniert immer, selbst wenn alles maskiert ist)
var chart = ui.Chart.image.histogram(ndvi, region, config.scale).setOptions({
  title: 'NDVI Histogramm – ' + regionKey + ' (' + year + ')',
  hAxis: {title: 'NDVI'},
  vAxis: {title: 'Pixelanzahl'}
});
print(chart);

// 📏 Min/Max & Pixelanzahl anzeigen
var stats = ndvi.reduceRegion({
  reducer: ee.Reducer.minMax().combine({
    reducer2: ee.Reducer.count(),
    sharedInputs: true
  }),
  geometry: region,
  scale: config.scale,
  maxPixels: config.maxPixels
});
print('📏 NDVI-Wertebereich:', stats);

// 🧠 Visualisierung nur bei gültigen Pixeln
stats.get('NDVI_count').evaluate(function(count) {
  if (count > 0) {
    Map.centerObject(region, 8);
    Map.addLayer(ndvi, {
      min: 0.1,
      max: 0.5,
      palette: ['white', 'green']
    }, '🌾 NDVI (' + regionKey + ' ' + year + ')');
  } else {
    print('⚠️ Kein NDVI visualisierbar – vollständig maskiert.');
  }
});
