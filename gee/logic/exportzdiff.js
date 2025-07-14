function exportZDiff(regionA, regionB, year) {
  if (!isValidRegion(regionA) || !isValidRegion(regionB)) {
    print('❌ Ungültige Regionen:', regionA, regionB);
    return;
  }

  var exportId = 'ZDIFF_' + regionA + '_minusMean_' + regionB + '_' + year;
  var assetPath = 'projects/ndvi-comparison-ukr/assets/' + exportId;

  ee.data.getAsset(assetPath, function(asset) {
    if (asset) {
      print('⏭️  Bereits vorhanden, Export übersprungen:', assetPath);
      return;
    }

    // 📈 Z-Score von Region A (z. B. Kherson)
    var statsA = getNDVIBaselineStats(regionA);
    var zA = getSafeZScore(regionA, year, statsA);

    // 📈 Z-Score-Mittelwert von Region B (z. B. Vinnytsia)
    var statsB = getNDVIBaselineStats(regionB);
    var ndviB = loadNDVIAsset(regionB, year);

    var zB = ndviB.subtract(statsB.mean)
                  .divide(statsB.stdDev)
                  .updateMask(statsB.stdDev.gt(config.minStdDev))
                  .rename('NDVI_Z');

    var zMeanB = zB.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: regionDefs[regionB],
      scale: config.scale,
      maxPixels: config.maxPixels
    }).get('NDVI_Z');

    // 📊 Z-Differenz
    var zDiff = zA.subtract(ee.Number(zMeanB)).rename('Z_Diff');

    // ⚠️ Extremwerte maskieren
    var maskedDiff = zDiff.updateMask(zDiff.gte(-10).and(zDiff.lte(10)));

    // 📤 Export
    Export.image.toAsset({
      image: maskedDiff,
      description: exportId,
      assetId: assetPath,
      region: regionDefs[regionA],
      scale: config.scale,
      maxPixels: config.maxPixels
    });

    print('📤 Export gestartet (Z_Diff):', exportId);
  });
}
/**
 * Führt Z-Differenz-Exporte für mehrere Jahre aus.
 * Region A wird pixelbasiert exportiert, Region B fließt als Mittelwert ein.
 * 
 * @param {string} regionA – z. B. 'kherson'
 * @param {string} regionB – z. B. 'vinnytsia'
 * @param {number[]} years – Liste von Jahren, z. B. [2022, 2023, 2024]
 */
function batchExportZDiff(regionA, regionB, years) {
  if (!isValidRegion(regionA) || !isValidRegion(regionB)) {
    print('❌ Ungültige Regionen:', regionA, regionB);
    return;
  }

  years.forEach(function(year) {
    exportZDiff(regionA, regionB, year);
  });

  print('📦 Batch-Z-Diff-Exporte gestartet für:', regionA, 'gegen', regionB, 'Jahre:', years);
}
