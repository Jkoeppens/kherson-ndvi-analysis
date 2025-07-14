/**
 * Berechnet NDVI-Differenz (Delta) und zugehörige Baseline-StdDev.
 * Liefert NDVI-Median des Jahres, Baseline-Median, Baseline-StdDev, Delta und Delta-in-Relation zur Baseline-Streuung.
 * Kein Z-Score (kein normiertes Verhältnis), sondern absolute Differenz und deren Verhältnis zur Streuung.
 * @param {number} year Analysejahr
 * @param {ee.Geometry} region Region für Analyse
 * @param {function} [getNDVI] Optional: Funktion zur NDVI-Zeitreihe
 * @returns {ee.Dictionary} Ergebnisbilder
 */
function calculateDeltaImage(year, region, getNDVI) {
  getNDVI = getNDVI || exports.getNDVISeason;

  var ndviCol = getNDVI(year, region);
  var ndvi = ndviCol.median().rename('NDVI');

  var baselineCol = ee.ImageCollection(exports.config.baselineYears.map(function(y) {
    return getNDVI(y, region).median().rename('NDVI');
  }));

  var reduced = baselineCol.reduce(ee.Reducer.median().combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
  }));

  var baselineMedian = reduced.select('NDVI_median').rename('NDVI_baseline_median');
  var baselineStdDev = reduced.select('NDVI_stdDev').rename('NDVI_baseline_stdDev');

  var delta = ndvi.subtract(baselineMedian).rename('NDVI_delta');
  var deltaStdDevRatio = delta.divide(baselineStdDev).rename('NDVI_delta_ratio');

  return ee.Dictionary({
    ndvi: ndvi,
    baselineMedian: baselineMedian,
    baselineStdDev: baselineStdDev,
    delta: delta,
    deltaRatio: deltaStdDevRatio
  });
}

// Exportfunktion
exports.calculateDeltaImage = calculateDeltaImage;
