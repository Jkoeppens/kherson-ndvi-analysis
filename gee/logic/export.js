var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;
var regions = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/regions');
var ndvi = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/ndvi');

function exportNDVIToAsset(regionKey, year) {
  if (!regions.isValidRegion(regionKey)) {
    print('❌ Ungültiger Regionsname:', regionKey);
    return;
  }

  var exportId = 'NDVI_' + regionKey + '_' + year;
  var assetPath = 'projects/ndvi-comparison-ukr/assets/ndvi_exports/' + exportId;

  var region = regions.regionDefs[regionKey];
  if (typeof region.geometry === 'function') {
    region = region.geometry();
  }

  var image = ndvi.getYearlyNDVI(year, region);
  image = image.clip(region);  // Wichtig

  Export.image.toAsset({
    image: image,
    description: 'NDVI_export_' + regionKey + '_' + year,
    assetId: assetPath,
    region: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  });

  print('📤 Export gestartet:', assetPath);
}


exports.exportNDVIToAsset = exportNDVIToAsset;
