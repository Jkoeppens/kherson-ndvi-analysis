// gee/logic/zscore.js

/**
 * Calculate NDVI baseline (median and stdDev) from a list of years.
 * Uses cropland mask to focus on relevant pixels.
 * @param {number[]} years 
 * @param {ee.Geometry} region 
 * @param {ee.Image} croplandMask 
 * @param {function} getNDVISeason 
 * @returns {{median: ee.Image, stdDev: ee.Image}}
 */
function calculateBaseline(years, region, croplandMask) {
  var baseline = ee.ImageCollection(years.map(function(y) {
    return getNDVISeason(y, region).median().updateMask(croplandMask);
  }));
  return {
    median: baseline.reduce(ee.Reducer.median()),
    stdDev: baseline.reduce(ee.Reducer.stdDev())
  };
}


/**
 * Compute corrected Z-score image for a given year.
 * Subtracts Vinnytsia reference Z from Kherson raw Z.
 * @param {ee.Image} ndviImg 
 * @param {ee.Image} baselineMedian 
 * @param {ee.Image} baselineStdDev 
 * @param {number} vinnytsiaZ 
 * @param {ee.Geometry} region 
 * @returns {ee.Image}
 */
function computeZCorrected(ndviImg, baselineMedian, baselineStdDev, vinnytsiaZ, region) {
  var z_kh = ndviImg.subtract(baselineMedian).divide(baselineStdDev.add(0.0001));
  var z_vinnytsia_img = ee.Image.constant(vinnytsiaZ).clip(region);
  return z_kh.subtract(z_vinnytsia_img).rename('Z_Corrected');
}

// Conceptual exports
exports.calculateBaseline = calculateBaseline;
exports.computeZCorrected = computeZCorrected;
