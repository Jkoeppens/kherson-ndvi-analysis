/**
 * Berechnet NDVI-Baseline (Median und StdDev) aus mehreren Jahren.
 * Optionaler Funktionsparameter für NDVI-Zugriff (testbar).
 * @param {number[]} years 
 * @param {ee.Geometry} region 
 * @param {ee.Image} croplandMask 
 * @param {function} getNDVI [optional]
 * @returns {{median: ee.Image, stdDev: ee.Image}}
 */
function calculateBaseline(years, region, croplandMask, getNDVI) {
  var getNDVISeason = getNDVI || exports.getNDVISeason;

  var baseline = ee.ImageCollection(years.map(function (y) {
    return getNDVISeason(y, region).median().updateMask(croplandMask);
  }));

  var reduced = baseline.reduce(ee.Reducer.median().combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
  }));

  return {
    median: reduced.select('NDVI_median'),
    stdDev: reduced.select('NDVI_stdDev')
  };
}

/**
 * Berechnet den Z-Wert aus NDVI, Median, StdDev.
 * @param {ee.Image} ndvi 
 * @param {ee.Image} median 
 * @param {ee.Image} stdDev 
 * @returns {ee.Image}
 */
function calculateZ(ndvi, median, stdDev) {
  return ndvi.subtract(median).divide(stdDev.add(0.0001)).rename('Z');
}

/**
 * Berechnet Z-Wert-Bild für eine Region und ein Jahr.
 * @param {number} year 
 * @param {ee.Geometry} region 
 * @param {ee.Image} croplandMask
 * @returns {ee.Image}
 */
function calculateZImage(year, region, croplandMask) {
  var baseline = calculateBaseline(config.baselineYears, region, croplandMask);
  var ndvi = getNDVISeason(year, region).median().updateMask(croplandMask);
  return calculateZ(ndvi, baseline.median, baseline.stdDev);
}

// Konzeptuelle Exporte
exports.calculateBaseline = calculateBaseline;
exports.calculateZ = calculateZ;
exports.calculateZImage = calculateZImage;
