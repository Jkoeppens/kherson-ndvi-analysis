/**
 * charts.js – Zeigt NDVI-Verteilungen und Z-Scores
 */
var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;

// 📊 Leeres Panel definieren, das später befüllt wird
var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: { stretch: 'horizontal' }
});

/**
 * Erzeugt Histogramm eines Bildes im gegebenen Gebiet.
 */
function makeHistogram(image, geometry, label, min, max, bins) {
  var hist = image.reduceRegion({
    reducer: ee.Reducer.histogram({ maxBuckets: bins }),
    geometry: geometry,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).get(image.bandNames().get(0));

  return ee.Dictionary(hist).evaluate(function (histDict) {
    if (!histDict) return;
    var chart = ui.Chart.array.values(histDict['histogram'], 0, histDict['bucketMeans'])
      .setChartType('ColumnChart')
      .setOptions({
        title: label,
        hAxis: { title: 'Wert' },
        vAxis: { title: 'Pixelanzahl' },
        legend: { position: 'none' },
        width: 300,
        height: 200
      });
    panel.add(chart);
  });
}

/**
 * Zeigt alle Histogramme
 */
function showAllStats(region, compRegion, statsA, statsB, zA, zB, zDiff) {
  panel.clear();
  makeHistogram(zA, region, 'Z-Verteilung (Analyse)', -5, 5, 100);
  makeHistogram(zB, compRegion, 'Z-Verteilung (Vergleich)', -5, 5, 100);
  makeHistogram(zDiff, region, 'Z-Diff Verteilung', -5, 5, 100);
}

exports.showAllStats = showAllStats;
exports.panel = panel;
