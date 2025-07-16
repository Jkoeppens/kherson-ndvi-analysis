// ndvi.js

// Importiere config, damit config.analysisMonths etc. funktioniert
var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;

// 🌥 Wolkenmaskierung basierend auf SCL
function maskSCL(image) {
  var scl = image.select('SCL');
  var mask = scl.eq(4).or(scl.eq(5)).or(scl.eq(6)).or(scl.eq(7));
  return image.updateMask(mask);
}

// 🌿 NDVI hinzufügen
function addNDVI(image) {
  return image.addBands(
    image.normalizedDifference(['B8', 'B4']).rename('NDVI')
  );
}

// 📊 Jährliches NDVI-Bild berechnen
/**
 * Berechnet den jährlichen NDVI-Median für eine Region direkt aus Sentinel-2 Rohdaten.
 * @param {number} year - Jahr, z.B. 2023
 * @param {ee.Geometry} region - Region als ee.Geometry-Objekt
 * @returns {ee.Image} - NDVI Medianbild des Jahres, geclippt auf Region
 */
function getYearlyNDVI(year, region) {
  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = ee.Date.fromYMD(year + 1, 1, 1);

  var collection = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(region)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskSCL)
    .map(addNDVI);

  var ndviMedian = collection.select('NDVI').median().clip(region);

  if (config.maskNegativeNDVI) {
    ndviMedian = ndviMedian.updateMask(ndviMedian.gte(0));
  }

  if (config.useCroplandMask) {
    var cropland = ee.Image('ESA/WorldCover/v100/2020')
      .select('Map')
      .eq(40)
      .clip(region);
    ndviMedian = ndviMedian.updateMask(cropland);
  }

  return ndviMedian;
}

// 📈 Zähle gültige NDVI-Observationen
function countValidNDVIObservations(year, region, months) {
  var m = months || config.analysisMonths;
  var start = ee.Date.fromYMD(year, m[0], 1);
  var end = ee.Date.fromYMD(year, m[1] + 1, 1);

  var collection = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(region)
    .filterDate(start, end)
    .map(maskSCL)
    .map(addNDVI)
    .select('NDVI');

  return collection.map(function(img) {
      return img.mask().rename('valid').uint8();
    })
    .sum()
    .rename('valid_obs');
}

// ✅ Exportiere relevante Funktionen
exports.getYearlyNDVI = getYearlyNDVI;
exports.countValidNDVIObservations = countValidNDVIObservations;
exports.addNDVI = addNDVI;
exports.maskSCL = maskSCL;
