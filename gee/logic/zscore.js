/**
 * Berechnet Z-Scores (standardisierte Abweichungen) für exportierte NDVI-Bilder.
 * Z = (NDVI_t - μ_baseline) / σ_baseline
 * 
 * Voraussetzung: Alle NDVI-Bilder existieren als Assets.
 */

// 📁 Pfad zum NDVI-Ordner
var assetBase = 'projects/ndvi-comparison-ukr/assets/ndvi_exports/';

/**
 * Lädt ein NDVI-Asset.
 * @param {string} regionKey
 * @param {number} year
 * @returns {ee.Image}
 */
function loadNDVIAsset(regionKey, year) {
  var assetId = assetBase + 'NDVI_' + regionKey + '_' + year;
  return ee.Image(assetId).rename('NDVI');
}

/**
 * Berechnet μ und σ aus der Baseline für eine Region.
 * @param {string} regionKey
 * @returns {{mean: ee.Image, stdDev: ee.Image}}
 */
function getNDVIBaselineStats(regionKey) {
  var imgs = config.baselineYears.map(function(year) {
    return loadNDVIAsset(regionKey, year);
  });

  var collection = ee.ImageCollection(imgs);
  var mean = collection.mean().rename('NDVI_mean');
  var stdDev = collection.reduce(ee.Reducer.stdDev()).rename('NDVI_std');

  return {mean: mean, stdDev: stdDev};
}

/**
 * Gibt ein Z-Score-Bild für ein bestimmtes Jahr zurück.
 * @param {string} regionKey
 * @param {number} year
 * @returns {ee.Image}
 */
function getNDVIZScore(regionKey, year) {
  var ndvi = loadNDVIAsset(regionKey, year);
  var stats = getNDVIBaselineStats(regionKey);

  var z = ndvi.subtract(stats.mean)
              .divide(stats.stdDev)
              .rename('NDVI_Z');

  return z;
}
/**
 * Gibt ein Z-Score-Bild für ein bestimmtes Jahr zurück,
 * maskiert aber alle Pixel mit instabiler Standardabweichung.
 * @param {string} regionKey
 * @param {number} year
 * @param {{mean: ee.Image, stdDev: ee.Image}} [statsDict]
 * @returns {ee.Image}
 */
function getSafeZScore(regionKey, year, statsDict) {
  var ndvi = loadNDVIAsset(regionKey, year);
  var stats = statsDict || getNDVIBaselineStats(regionKey);

  var minStdDev = 0.01;  // 🔧 Schwellenwert für gültige σ-Werte
  var valid = stats.stdDev.gte(minStdDev);  // Maske

  return ndvi.subtract(stats.mean)
             .divide(stats.stdDev)
             .updateMask(valid)
             .rename('NDVI_Z');
}
