// gee/logic/ndvi.js

/**
 * Apply cloud mask based on Sentinel-2 SCL band.
 * Removes cloud shadows, clouds, and cirrus.
 * @param {ee.Image} img 
 * @returns {ee.Image}
 */
function maskSCL(img) {
  var scl = img.select('SCL');
  var mask = scl.neq(3).and(scl.neq(7)).and(scl.neq(8));
  return img.updateMask(mask);
}

/**
 * Adds NDVI band using Sentinel-2 bands.
 * @param {ee.Image} img 
 * @returns {ee.Image}
 */
function addNDVI(img) {
  return img.normalizedDifference(['B8', 'B4']).rename('NDVI');
}

/**
 * Get NDVI image collection for a specific region and year.
 * Filters for May–June and applies SCL masking.
 * @param {number} year 
 * @param {ee.Geometry} region 
 * @returns {ee.ImageCollection}
 */
function getNDVISeason(year, region) {
  var start = ee.Date.fromYMD(year, 5, 1);
  var end = ee.Date.fromYMD(year, 7, 1);

  return ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(region)
    .filterDate(start, end)
    .map(maskSCL)
    .map(addNDVI)
    .select('NDVI');
}

// Conceptual export for version control
exports.getNDVISeason = getNDVISeason;
