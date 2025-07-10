// gee/logic/zscore_visual.js

/**
 * Clamp and display the corrected Z-score image on the map.
 * @param {ee.Image} zCorrectedImg 
 * @param {string} label 
 */
function showZCorrectedLayer(zCorrectedImg, label) {
  var z_clipped = zCorrectedImg.clamp(-5, 5);
  Map.addLayer(z_clipped, {
    min: -2,
    max: 2,
    palette: [
      '#a50026', '#f46d43', '#fdae61',
      '#ffffbf', '#d9ef8b', '#66bd63', '#1a9850'
    ]
  }, label);
  return z_clipped;
}

/**
 * Generate histogram chart of Z-corrected NDVI values.
 * Requires Vinnytsia NDVI mean and std for label annotation.
 * @param {ee.Image} zImage 
 * @param {ee.Geometry} region 
 * @param {number} year 
 * @param {{mean: number, std: number}} vinnytsiaStats 
 */
function renderZHistogram(zImage, region, year, vinnytsiaStats) {
  zImage.reduceRegion({
    reducer: ee.Reducer.histogram({maxBuckets: 500}),
    geometry: region,
    scale: 100,
    maxPixels: 1e9
  }).get('Z_Corrected').evaluate(function(hist) {
    if (!hist) return;

    var z_vals = hist.bucketMeans;
    var counts = hist.histogram;
    var mean = vinnytsiaStats.mean;
    var std = vinnytsiaStats.std;

    var labels = z_vals.map(function(z) {
      var ndvi = z * std + mean;
      return z.toFixed(2) + ' (' + ndvi.toFixed(3) + ')';
    });

    var chart = ui.Chart.array.values({array: [counts], axis: 0})
      .setChartType('ColumnChart')
      .setOptions({
        title: 'Z Corrected Histogram ' + year,
        hAxis: {
          title: 'Z-Wert (NDVI aus Z)',
          slantedText: true,
          slantedTextAngle: 90,
          ticks: z_vals.map(function(z, i) {
            return {v: z, f: labels[i]};
          })
        },
        vAxis: {title: 'Pixel Count'},
        legend: {position: 'none'},
        bar: {groupWidth: '95%'}
      });

    print(chart);
  });
}

// Conceptual exports
exports.showZCorrectedLayer = showZCorrectedLayer;
exports.renderZHistogram = renderZHistogram;
