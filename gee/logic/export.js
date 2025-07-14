/**
 * Kombiniert Einzel- und Massenexport von NDVI-Jahreskarten mit Asset-Existenzprüfung.
 * 🔧 Voraussetzung: regionDefs, config, getYearlyNDVI, isValidRegion müssen eingebunden sein.
 */

/**
 * Prüft, ob ein Asset bereits existiert (Client-seitig).
 * 
 * @param {string} assetId
 * @param {function(boolean)} callback – true, wenn vorhanden; sonst false
 */
function assetExists(assetId, callback) {
  ee.data.getAsset(assetId, function(asset) {
    callback(asset !== null);
  }, function(err) {
    // Fehler bedeutet meist: Asset existiert nicht
    callback(false);
  });
}

/**
 * Exportiert ein NDVI-Bild als Asset, wenn es noch nicht existiert.
 * 
 * @param {string} regionKey – z. B. 'kherson'
 * @param {number} year – z. B. 2020
 */
function exportNDVIToAssetIfNotExists(regionKey, year) {
  if (!isValidRegion(regionKey)) {
    print('❌ Ungültiger Regionsname:', regionKey);
    return;
  }

  var exportId = 'NDVI_' + regionKey + '_' + year;
  var assetPath = 'projects/ndvi-comparison-ukr/assets/ndvi_exports/' + exportId;

  assetExists(assetPath, function(exists) {
    if (exists) {
      print('⏭️  Bereits vorhanden, Export übersprungen:', assetPath);
    } else {
      var region = regionDefs[regionKey];
      var ndvi = getYearlyNDVI(year, region);

      Export.image.toAsset({
        image: ndvi,
        description: exportId,
        assetId: assetPath,
        region: region,
        scale: config.scale,
        maxPixels: config.maxPixels
      });

      print('📤 Export gestartet:', assetPath);
    }
  });
}

/**
 * Batch-Export für beliebige Regionen und Jahre.
 * Muss manuell mit gewünschtem Input aufgerufen werden.
 * 
 * @param {string[]} regionList – z. B. ['kherson', 'vinnytsia']
 * @param {number[]} yearList – z. B. [2020, 2023]
 */
function exportNDVIBatch(regionList, yearList) {
  regionList.forEach(function(regionKey) {
    if (!isValidRegion(regionKey)) {
      print('⚠️ Ungültiger Regionsname übersprungen:', regionKey);
      return;
    }

    yearList.forEach(function(year) {
      exportNDVIToAssetIfNotExists(regionKey, year);
    });
  });

  print('✅ NDVI-Exporte initialisiert für:', regionList, 'Jahre:', yearList);
}

// 🟡 Aufrufbeispiel (zum Debuggen oder aus UI):
// exportNDVIBatch(['kherson', 'vinnytsia'], [2020, 2021, 2022]);
