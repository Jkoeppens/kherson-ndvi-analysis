var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;
var zscore = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/zscore');
var ndvi = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/ndvi');
var regions = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/regions');

function exportZDiff(regionA, regionB, year, useLiveNDVI) {
  if (!regions.isValidRegion(regionA) || !regions.isValidRegion(regionB)) {
    print('❌ Ungültige Regionen:', regionA, regionB);
    return;
  }

  var exportId = 'ZDIFF_' + regionA + '_minusMean_' + regionB + '_' + year;
  var assetPath = 'projects/ndvi-comparison-ukr/assets/' + exportId;

  ee.data.getAsset(assetPath, function(asset) {
    if (asset) {
      print('⏭️ Bereits vorhanden, Export übersprungen:', assetPath);
      return;
    }

    var regionAGeom = regions.regionDefs[regionA];
    var regionBGeom = regions.regionDefs[regionB];

    var statsA = zscore.getNDVIBaselineStats(regionA);
    var zA = zscore.getSafeZScore(regionA, year, statsA, useLiveNDVI);

    var statsB = zscore.getNDVIBaselineStats(regionB);
    var ndviB = useLiveNDVI
      ? ndvi.getYearlyNDVI(year, regionBGeom)
      : zscore.loadNDVIAsset(regionB, year);

    var zB = ndviB.subtract(statsB.mean)
                  .divide(statsB.stdDev)
                  .updateMask(statsB.stdDev.gte(config.minStdDev))
                  .rename('NDVI_Z');

    var zMeanB = zB.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: regionBGeom,
      scale: config.scale,
      maxPixels: config.maxPixels
    }).get('NDVI_Z');

    var zDiff = zA.subtract(ee.Number(zMeanB)).rename('Z_Diff');
    var maskedDiff = zDiff.updateMask(zDiff.gte(-10).and(zDiff.lte(10)));

    Export.image.toAsset({
      image: maskedDiff,
      description: exportId,
      assetId: assetPath,
      region: regionAGeom,
      scale: config.scale,
      maxPixels: config.maxPixels
    });

    print('📤 Export gestartet (Z_Diff):', exportId);
  });
}

function batchExportZDiff(regionA, regionB, years, useLiveNDVI) {
  if (!regions.isValidRegion(regionA) || !regions.isValidRegion(regionB)) {
    print('❌ Ungültige Regionen:', regionA, regionB);
    return;
  }

  years.forEach(function(year) {
    exportZDiff(regionA, regionB, year, useLiveNDVI);
  });

  print('📦 Batch-Z-Diff-Exporte gestartet für:', regionA, 'gegen', regionB, 'Jahre:', years, '| Modus:', useLiveNDVI ? 'Live' : 'Asset');
}

exports.exportZDiff = exportZDiff;
exports.batchExportZDiff = batchExportZDiff;
