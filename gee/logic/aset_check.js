// --- logic/asset_check.js ---

var exportNDVIToAsset = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/export').exportNDVIToAsset;

/**
 * Prüft NDVI Assets und exportiert fehlende automatisch.
 * Führt Callback nur aus, wenn alle Assets vorhanden.
 * 
 * @param {string} regionKey - Schlüssel der Region (z.B. "vinnytsia")
 * @param {Array<number>} years - Liste der Jahre, die geprüft werden sollen
 * @param {function} onComplete - Callback, wenn alle Assets vorhanden sind
 */
function checkAndExportNDVIAssets(regionKey, years, onComplete) {
  var missingYears = [];
  var i = 0;

  function checkNext() {
    if (i >= years.length) {
      if (missingYears.length > 0) {
        print('⚠️ Fehlende NDVI-Jahre für', regionKey + ':', missingYears);
        missingYears.forEach(function(year) {
          print('⏳ Starte Export für', regionKey, year);
          exportNDVIToAsset(regionKey, year);
        });
        print('🚧 Exporte angestoßen. Bitte Analyse später erneut starten.');
      } else {
        print('✅ Alle NDVI Assets vorhanden für', regionKey);
        onComplete();
      }
      return;
    }

    var year = years[i];
    var assetId = 'projects/ndvi-comparison-ukr/assets/ndvi_exports/NDVI_' + regionKey + '_' + year;

    ee.data.getAsset(assetId, function(asset, error) {
      if (error) {
        missingYears.push(year);
      }
      i++;
      checkNext();
    });
  }

  checkNext();
}

exports.checkAndExportNDVIAssets = checkAndExportNDVIAssets;
