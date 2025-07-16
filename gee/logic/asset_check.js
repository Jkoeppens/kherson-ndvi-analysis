// Importiere Exportfunktion für NDVI
var exportNDVIToAsset = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/export').exportNDVIToAsset;

/**
 * Generiert Asset-ID für NDVI-Bilder pro Region & Jahr
 * @param {string} regionKey 
 * @param {number} year 
 * @returns {string} Asset-ID
 */
function getNDVIAssetId(regionKey, year) {
  return 'projects/ndvi-comparison-ukr/assets/ndvi_exports/NDVI_' + regionKey + '_' + year;
}

/**
 * Prüft fehlende NDVI-Assets in einer Region für eine Liste von Jahren.
 * Gibt Liste fehlender {region, year, assetId} Objekte zurück.
 * @param {string} regionKey 
 * @param {Array<number>} years 
 * @param {function(Array<Object>)} callback – wird mit fehlenden Assets aufgerufen
 */
function checkMissingNDVIAssets(regionKey, years, callback) {
  var missing = [];
  var i = 0;

  function checkNext() {
    if (i >= years.length) {
      callback(missing);
      return;
    }

    var year = years[i];
    var assetId = 'projects/ndvi-comparison-ukr/assets/ndvi_exports/NDVI_' + regionKey + '_' + year;


    ee.data.getAsset(assetId, function(asset, error) {
  if (error) {
    print('🟥 Asset fehlt:', assetId);
    missing.push({ regionKey: regionKey, year: year, assetId: assetId });
  } else {
    print('🟩 Asset vorhanden:', assetId);
  }
  i++;
  checkNext();
});

  }

  checkNext();
}

/**
 * Startet Exporte für eine Liste fehlender NDVI-Assets
 * @param {Array<Object>} missingList – Liste aus {region, year, assetId}
 */
function exportMissingNDVIAssets(missingList) {
  missingList.forEach(function (item) {
    // keine Prüfung auf .type – einfach exportieren
    print('📤 Exportiere NDVI für', item.regionKey, item.year);
    exportNDVIToAsset(item.regionKey, item.year);
  });
}


// Exportiere Funktionen
exports.getNDVIAssetId = getNDVIAssetId;
exports.checkMissingNDVIAssets = checkMissingNDVIAssets;
exports.exportMissingNDVIAssets = exportMissingNDVIAssets;
