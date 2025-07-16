/**
 * Berechnet NDVI-Baseline (Median und StdDev) aus mehreren Jahren.
 * Cropland-Maske wird nicht angewendet.
 * @param {number[]} years 
 * @param {ee.Geometry} region 
 * @param {function} [getNDVI] Optional: Funktion für NDVI-Kollektion
 * @returns {{median: ee.Image, stdDev: ee.Image}}
 */
function calculateBaseline(years, region, getNDVI) {
  getNDVI = getNDVI || exports.getNDVISeason;

  var medianImages = ee.ImageCollection(years.map(function(y) {
    return getNDVI(y, region).median().select('NDVI');
  }));

  var commonMask = medianImages.map(function(img) {
    return img.mask();
  }).reduce(ee.Reducer.min());

  medianImages = medianImages.map(function(img) {
    return img.updateMask(commonMask);
  });

  var reduced = medianImages.reduce(ee.Reducer.median().combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
  }));

  return {
    median: reduced.select('NDVI_median'),
    stdDev: reduced.select('NDVI_stdDev')
  };
}

/**
 * Berechnet den Anteil der StdDev-Pixel, die geclippt würden (kleiner als minStdDev).
 * @param {ee.Image} stdDev 
 * @param {ee.Geometry} region
 * @param {number} minStdDev
 * @returns {ee.Number} Anteil [0..1]
 */
function calculateClippedStdDevRatio(stdDev, region, minStdDev) {
  var clippedMask = stdDev.lt(minStdDev);
  var clippedCount = clippedMask.updateMask(clippedMask).reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).get('NDVI_stdDev');

  var totalCount = stdDev.updateMask(stdDev.gte(0)).reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).get('NDVI_stdDev');

  return ee.Number(clippedCount).divide(ee.Number(totalCount));
}

/**
 * Berechnet den Z-Wert aus NDVI, Median, StdDev mit Mindest-StdDev (Clipping).
 * @param {ee.Image} ndvi 
 * @param {ee.Image} median 
 * @param {ee.Image} stdDev 
 * @param {number} minStdDev
 * @returns {ee.Image}
 */
function calculateZ(ndvi, median, stdDev, minStdDev) {
  minStdDev = minStdDev || 0.05;
  var safeStdDev = stdDev.where(stdDev.lt(minStdDev), minStdDev);
  return ndvi.subtract(median).divide(safeStdDev).rename('Z');
}

/**
 * Berechnet Z-Wert-Bild für eine Region und ein Jahr.
 * Cropland-Maske wird nicht angewendet.
 * @param {number} year 
 * @param {ee.Geometry} region 
 * @param {function} [getNDVI]
 * @param {number} [minStdDev]
 * @returns {{zImage: ee.Image, clippedRatio: ee.Number} | null}
 */
function calculateZImage(year, region, getNDVI, minStdDev) {
  getNDVI = getNDVI || exports.getNDVISeason;
  minStdDev = minStdDev || 0.05;

  var ndviCol = getNDVI(year, region);
  var colSize = ndviCol.size();

  var result = ee.Algorithms.If(
    colSize.gt(0),
    ee.Algorithms.If(
      ndviCol.first().bandNames().size().gt(0),
      (function() {
        var ndvi = ndviCol.median().select('NDVI');
        var baseline = calculateBaseline(config.baselineYears, region, getNDVI);
        var clippedRatio = calculateClippedStdDevRatio(baseline.stdDev, region, minStdDev);
        var zImage = calculateZ(ndvi, baseline.median, baseline.stdDev, minStdDev);
        return ee.Dictionary({
          zImage: zImage,
          clippedRatio: clippedRatio
        });
      })(),
      null
    ),
    null
  );

  return result;
}

// Export
exports.calculateBaseline = calculateBaseline;
exports.calculateZ = calculateZ;
exports.calculateZImage = calculateZImage;
exports.calculateClippedStdDevRatio = calculateClippedStdDevRatio;
