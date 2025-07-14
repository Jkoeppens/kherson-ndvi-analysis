// 🔧 Debug-Parameter
var debugRegionKey = 'kherson';
var debugYear = 2023;

// 📊 Statistik holen
var stats = getNDVIBaselineStats(debugRegionKey);
var mean = stats.mean;
var stdDev = stats.stdDev;

// 🛡️ Z-Score mit Maskierung nach Mindest-σ
var minStdDev = 0.01;
var validMask = stdDev.gte(minStdDev);
var z = loadNDVIAsset(debugRegionKey, debugYear)
        .subtract(mean)
        .divide(stdDev)
        .updateMask(validMask)
        .rename('NDVI_Z');

// 🗺️ Karte zentrieren
Map.centerObject(regionDefs[debugRegionKey], 8);

// 🎨 Z-Wert Layer (clamped visual)
var zClamped = z.clamp(config.zClampRange[0], config.zClampRange[1]);
Map.addLayer(zClamped, {
  min: config.zDisplayRange[0],
  max: config.zDisplayRange[1],
  palette: config.zPalette
}, 'Z-Score (clamped) – ' + debugRegionKey + ' ' + debugYear);

// 🚫 Maskierte Stellen (σ zu klein)
var lowStdMask = stdDev.lt(minStdDev).selfMask();
Map.addLayer(lowStdMask, {palette: ['black']}, '⚠️ σ < ' + minStdDev);

// 📈 Histogramm: Z-Verteilung
var zChart = ui.Chart.image.histogram(z, regionDefs[debugRegionKey], config.scale)
  .setOptions({
    title: 'Z-Wert-Verteilung – ' + debugRegionKey + ' (' + debugYear + ')',
    hAxis: {title: 'Z-Wert'},
    vAxis: {title: 'Pixelanzahl'}
  });
print(zChart);

// 📉 Histogramm: Standardabweichung (σ)
var stdChart = ui.Chart.image.histogram(stdDev, regionDefs[debugRegionKey], config.scale)
  .setOptions({
    title: 'Standardabweichung (σ) – Baseline ' + debugRegionKey,
    hAxis: {title: 'σ'},
    vAxis: {title: 'Pixelanzahl'}
  });
print(stdChart);

// 🧪 Stichprobe von Pixeln mit NDVI, μ, σ, Z
var ndvi = loadNDVIAsset(debugRegionKey, debugYear);
var composite = ndvi.addBands(mean).addBands(stdDev).addBands(z);
var sample = composite.sample({
  region: regionDefs[debugRegionKey],
  scale: config.scale,
  numPixels: 5,
  seed: 123,
  geometries: true
});
print('📊 Stichprobe NDVI, μ, σ, Z (' + debugRegionKey + ', ' + debugYear + '):', sample);
