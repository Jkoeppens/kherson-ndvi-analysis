/**
 * Visualisiert das korrigierte Z-Bild auf der Karte.
 * @param {ee.Image} zCorrectedImg 
 * @param {string} label 
 * @returns {ee.Image}
 */
function showZCorrectedLayer(zCorrectedImg, label) {
  var z_clipped = zCorrectedImg.clamp(config.zClampRange[0], config.zClampRange[1]);
  Map.addLayer(z_clipped, {
    min: config.zDisplayRange[0],
    max: config.zDisplayRange[1],
    palette: config.zPalette
  }, label);
  return z_clipped;
}

/**
 * Zeigt ein Histogramm der Z-Werte im gegebenen Bereich.
 * @param {ee.Image} zImage 
 * @param {ee.Geometry} region 
 * @param {number} year 
 */
/**
 * Zeigt ein Histogramm der Z-Werte im gegebenen Bereich.
 * Gibt spezifische Warnung aus, wenn kein Histogramm berechnet werden kann.
 * @param {ee.Image} zImage 
 * @param {ee.Geometry} region 
 * @param {number} year 
 */
function renderZHistogram(zImage, region, year) {
  print('🟡 Histogramm wird berechnet...');

  zImage.reduceRegion({
    reducer: ee.Reducer.histogram({ maxBuckets: 500 }),
    geometry: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).get('Z_Corrected').evaluate(function (hist) {
    if (!hist || !hist.bucketMeans || !hist.histogram) {
      print('⚠️ Kein Histogramm berechenbar – wahrscheinlich keine gültigen Pixel im gewählten Gebiet.');
      return;
    }

    var z_vals = hist.bucketMeans;
    var counts = hist.histogram;

    var chart = ui.Chart.array.values({ array: [counts], axis: 0 })
      .setChartType('ColumnChart')
      .setOptions({
        title: 'Z Corrected Histogram ' + year,
        hAxis: {
          title: 'Z-Wert (differenziert)',
          slantedText: true,
          slantedTextAngle: 90,
          ticks: z_vals
        },
        vAxis: { title: 'Pixel Count' },
        legend: { position: 'none' },
        bar: { groupWidth: '95%' }
      });

    print(chart);
  });
}

// Konzeptuelle Exporte
exports.renderZHistogram = renderZHistogram;
