// Auto-generated main.js for GEE
// Generated on Mon Jul 14 19:20:03 CEST 2025

// --- gee/logic/config.js ---
var config = {
  baselineYears: [2019, 2020, 2021],
  analysisYears: [2022, 2023, 2024],
  analysisMonths: [5, 6], // Mai–Juni
  scale: 100,
  maxPixels: 1e9,
  minStdDev: 0.01, // Mindestwert für σ zur Maskierung instabiler Pixel
  zClampRange: [-5, 5],
  zDisplayRange: [-2, 2],
  zPalette: [
    '#a50026', '#f46d43', '#fdae61',
    '#ffffbf', '#d9ef8b', '#66bd63', '#1a9850'
  ],
  croplandSource: 'USGS/GFSAD1000_V1',
  useCroplandMask: false,
  
  frontlineAssets: {
    2022: 'projects/ndvi-comparison-ukr/assets/frontline_2022-06-30',
    2023: 'projects/ndvi-comparison-ukr/assets/frontline_2023-06-30',
    2024: 'projects/ndvi-comparison-ukr/assets/frontline_2024-06-30'
  }
};


// --- gee/logic/regions.js ---
/**
 * Geometrien und Metadaten für NDVI/Z-Analyse-Regionen.
 */
var regionDefs = {
  kherson: {
    geometry: ee.Geometry.Rectangle([28.1, 49.3, 29.1, 49.9]),
    hasFrontline: true
  },
  vinnytsia: {
    geometry: ee.Geometry.Rectangle([27.6, 47.9, 28.4, 48.6]),
    hasFrontline: false
  },
  kharkiv: {
    geometry: ee.Geometry.Rectangle([36.0, 49.5, 37.5, 50.5]),
    hasFrontline: true
  },
  donetsk: {
    geometry: ee.Geometry.Rectangle([37.0, 47.0, 38.5, 48.5]),
    hasFrontline: true
  },
  luhansk: {
    geometry: ee.Geometry.Rectangle([38.0, 48.0, 39.5, 49.5]),
    hasFrontline: true
  },
  zaporizhzhia: {
    geometry: ee.Geometry.Rectangle([35.0, 47.0, 36.5, 48.0]),
    hasFrontline: true
  },
  mariupol: {
    geometry: ee.Geometry.Rectangle([37.0, 47.0, 38.0, 47.5]),
    hasFrontline: true
  }
};

/**
 * Liste aller verfügbaren Regionenschlüssel.
 */
var regionKeys = Object.keys(regionDefs);

/**
 * Prüft, ob ein Regionsname definiert ist.
 * @param {string} name
 * @returns {boolean}
 */
function isValidRegion(name) {
  return regionDefs.hasOwnProperty(name);
}

// Exportkonzepte für Build (konzeptionell)
exports.regionDefs = regionDefs;
exports.regionKeys = regionKeys;
exports.isValidRegion = isValidRegion;


// --- gee/logic/ndvi.js ---
function maskSCL(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(6)).and(scl.neq(7)).and(scl.neq(8));
  return image.updateMask(mask);
}

function addNDVI(image) {
  return image.addBands(
    image.normalizedDifference(['B8', 'B4']).rename('NDVI')
  );
}

/**
 * Berechnet das jährliche NDVI-Medianbild für eine Region.
 * @param {number} year
 * @param {ee.Geometry} region
 * @returns {ee.Image}
 */
function getYearlyNDVI(year, region) {
  // 📆 Filtere Sentinel-2-Bilder nach Jahr und Region
  var start = ee.Date.fromYMD(year, config.analysisMonths.start, 1);
  var end = ee.Date.fromYMD(year, config.analysisMonths.end, 1).advance(1, 'month');
  var collection = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(region)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80));

  print('📂 Rohbilder (Anzahl):', collection.size());

  // 🧼 Maskiere Wolken mit SCL-Band
  var masked = collection.map(maskSCL);

  // 🌿 Berechne NDVI für jedes Bild
  var withNDVI = masked.map(addNDVI);

  // 📊 Median NDVI
  var ndviMedian = withNDVI.select('NDVI').median().rename('NDVI');

  // 🔢 Anzahl gültiger Beobachtungen pro Pixel
  var validObs = withNDVI.select('NDVI')
    .reduce(ee.Reducer.count())
    .rename('valid_obs');

  // 🌾 Cropland-Maske (optional)
  var cropland = ee.Image('USGS/GFSAD1000_V1').select('landcover');
  var croplandMask = cropland.eq(1);  // Nur bewässertes Farmland

  // 🧪 Maske anwenden (optional – hier: deaktiviert)
  var useCroplandMask = config.useCroplandMask;  // true oder false
  var finalNDVI = ee.Image(
    ee.Algorithms.If(useCroplandMask, ndviMedian.updateMask(croplandMask), ndviMedian)
  );

  // 📦 Ergebnis als NDVI-Bild (1 Band)
  return finalNDVI.set({
    'system:time_start': start.millis(),
    'region_name': region
  });
}


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


// --- gee/logic/export.js ---
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


// --- gee/logic/zscore.js ---
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


// --- gee/logic/exportzdiff.js ---
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


// --- gee/logic/frontline.js ---
/**
 * Frontline asset IDs by year (June snapshots).
 */
var frontlineAssets = config.frontlineAssets;

/**
 * Converts polygon features into boundary lines (safe version).
 * Handles invalid or empty geometries gracefully.
 * @param {ee.FeatureCollection} fc 
 * @returns {ee.FeatureCollection}
 */
function extractFrontlineLines(fc) {
  return fc.map(function (feature) {
    var geoms = ee.Geometry(feature.geometry()).geometries();
    var lines = ee.List(geoms).map(function (g) {
      var polygon = ee.Geometry(g);
      var isPolygon = polygon.type().equals('Polygon');
      var outer = ee.Algorithms.If(isPolygon, polygon.coordinates().get(0), null);
      var isValid = ee.Algorithms.If(outer, ee.List(outer).length().gte(2), false);
      return ee.Algorithms.If(
        isValid,
        ee.Feature(ee.Geometry.LineString(outer)).copyProperties(feature),
        null
      );
    });
    return ee.FeatureCollection(lines).filter(ee.Filter.notNull(['system:index']));
  }).flatten();
}

/**
 * Load and display frontline for a given year.
 * @param {number} year 
 * @returns {ee.FeatureCollection|null}
 */
function showFrontline(year) {
  var assetId = frontlineAssets[year];
  if (!assetId) {
    print('⚠️ Kein Frontline-Asset für Jahr:', year);
    return null;
  }
  var frontline = ee.FeatureCollection(assetId);
  var frontlineLines = extractFrontlineLines(frontline);
  Map.addLayer(frontlineLines, {
    color: '#1f78b4',
    width: 2
  }, 'Frontline ' + year + '-06-30');
  return frontlineLines;
}

// Konzeptuelle Exporte
exports.showFrontline = showFrontline;
exports.frontlineAssets = frontlineAssets;


// --- gee/ui/app.js ---
// UI controls
var regionSelect = ui.Select({
  items: regionKeys,
  placeholder: 'Select analysis region'
});

var compSelect = ui.Select({
  items: regionKeys,
  placeholder: 'Select comparison region'
});

var yearSelect = ui.Select({
  items: config.analysisYears.map(String),
  placeholder: 'Select year'
});

var runButton = ui.Button({
  label: 'Run Analysis',
  onClick: function () {
    var regionName = regionSelect.getValue();
    var compName = compSelect.getValue();
    var year = parseInt(yearSelect.getValue(), 10);

    if (!isValidRegion(regionName) || !isValidRegion(compName) || !year) {
      print('⚠️ Please select valid regions and year.');
      return;
    }

    var region = regionDefs[regionName].geometry;
    var compRegion = regionDefs[compName].geometry;
    Map.centerObject(region, 8);

    // 📊 Z-Score A (Hauptregion, pixelbasiert)
    var statsA = getNDVIBaselineStats(regionName);
    var zA = getSafeZScore(regionName, year, statsA);

    // 📉 Z-Mittelwert B (Vergleichsregion)
    var statsB = getNDVIBaselineStats(compName);
    var zB_Image = loadNDVIAsset(compName, year)
      .subtract(statsB.mean)
      .divide(statsB.stdDev)
      .updateMask(statsB.stdDev.gt(config.minStdDev))
      .rename('NDVI_Z');

    var zB_mean = zB_Image.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: regionDefs[compName],
      scale: config.scale,
      maxPixels: config.maxPixels
    }).get('NDVI_Z');

    // 🧮 Differenz berechnen
    var zDiff = zA.subtract(ee.Number(zB_mean)).rename('Z_Diff');

    // 🎨 Karte anzeigen
    var zClamped = zDiff.clamp(config.zClampRange[0], config.zClampRange[1]);
    Map.addLayer(zClamped, {
      min: config.zDisplayRange[0],
      max: config.zDisplayRange[1],
      palette: config.zPalette
    }, 'Z-Diff (' + regionName + ' vs. ' + compName + ', ' + year + ')');

    // 📉 Histogramm anzeigen
    var chart = ui.Chart.image.histogram(zDiff, region, config.scale)
      .setOptions({
        title: 'Z-Diff Histogramm (' + regionName + ' - mean(' + compName + '), ' + year + ')',
        hAxis: {title: 'Z-Diff'},
        vAxis: {title: 'Pixelanzahl'}
      });
    print(chart);

    // 🔹 Frontlinie anzeigen
    if (config.frontlineAssets[year]) {
      showFrontline(year);
    } else {
      print('ℹ️ No frontline data for year', year);
    }
  }
});

// Layout
var panel = ui.Panel({
  widgets: [
    ui.Label('NDVI Z-Diff Analysis'),
    ui.Label('Analysis Region:'), regionSelect,
    ui.Label('Comparison Region:'), compSelect,
    ui.Label('Year:'), yearSelect,
    runButton
  ],
  style: { width: '300px' }
});

ui.root.insert(0, panel);
