var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;
var regions = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/regions');
var ndvi = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/ndvi');

var regionDefs = regions.regionDefs;
var assetBase = 'projects/ndvi-comparison-ukr/assets/ndvi_exports/';

function loadNDVIAsset(regionKey, year) {
  var assetId = assetBase + 'NDVI_' + regionKey + '_' + year;
  return ee.Image(assetId).select('NDVI');
}

function getNDVIBaselineStats(regionKey) {
  var imgs = [];

  config.baselineYears.forEach(function(year) {
    var assetId = assetBase + 'NDVI_' + regionKey + '_' + year;
    try {
      var img = ee.Image(assetId).select('NDVI');
      imgs.push(img);
    } catch (e) {
      print('⚠️ Asset fehlt, Jahr übersprungen:', year, assetId);
    }
  });

  if (imgs.length === 0) {
    print('❌ Keine Baseline-Assets gefunden für Region:', regionKey);
    return null;
  }

  var collection = ee.ImageCollection(imgs);
  var mean = collection.mean().rename('NDVI_mean');
  var stdDev = collection.reduce(ee.Reducer.stdDev()).rename('NDVI_std');

  return { mean: mean, stdDev: stdDev };
}

function getNDVIBaselineStatsLive(regionKey) {
  var region = regionDefs[regionKey];
  var ndviImages = config.baselineYears.map(function(year) {
    return ndvi.getYearlyNDVI(year, region).rename('NDVI_' + year);
  });

  var collection = ee.ImageCollection(ndviImages).map(function(img) {
    return img.select([0]).rename('NDVI');  // Vereinheitlichen auf Bandname
  });

  var mean = collection.mean().rename('NDVI_mean');
  var stdDev = collection.reduce(ee.Reducer.stdDev()).rename('NDVI_std');

  return { mean: mean, stdDev: stdDev };
}


function getSafeZScore(regionKey, year, statsDict, useLiveNDVI) {
  var region = regionDefs[regionKey];  // ✅ fix hier: hole echte Geometrie

var stats = statsDict || (
  useLiveNDVI
    ? getNDVIBaselineStatsLive(regionKey)
    : getNDVIBaselineStats(regionKey)
);

  var ndviImage = useLiveNDVI
    ? ndvi.getYearlyNDVI(year, region)
    : loadNDVIAsset(regionKey, year);

  var valid = stats.stdDev.gte(config.minStdDev);

  return ndviImage
    .subtract(stats.mean.select('NDVI_mean'))
    .divide(stats.stdDev.select('NDVI_std'))
    .updateMask(valid)
    .rename('NDVI_Z');
}

function computeMeanZScore(regionKey, year, useLiveNDVI) {
  var region = regionDefs[regionKey];
  var zScoreImage = getSafeZScore(regionKey, year, null, useLiveNDVI);

  return zScoreImage.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  });
}

exports.loadNDVIAsset = loadNDVIAsset;
exports.getNDVIBaselineStats = getNDVIBaselineStats;
exports.getSafeZScore = getSafeZScore;
exports.computeMeanZScore = computeMeanZScore;
exports.getNDVIBaselineStatsLive = getNDVIBaselineStatsLive;

