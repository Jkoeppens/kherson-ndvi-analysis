// Module laden
var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;
var zscore = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/zscore');
var ndvi = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/ndvi');
var frontline = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/frontline');
var charts = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/charts');

/**
 * Führt die NDVI-Z-Analyse für zwei Regionen durch.
 * 
 * @param {string} regionName - Name der Zielregion
 * @param {string} compName - Name der Vergleichsregion
 * @param {number} year - Analysejahr
 * @param {boolean} useLiveNDVI - true = On-the-fly-Berechnung, false = Asset-Modus
 * @param {Object} regionDefs - Regionen-Definitionen aus regions.js
 * @param {ui.Map} map - Referenz zur Karteninstanz
 * @param {ui.Label} statusLabel - Statusanzeige
 * @param {ui.Panel} rightPanel - Panel für Charts
 */
function runAnalysis(regionName, compName, year, useLiveNDVI, regionDefs, map, statusLabel, rightPanel) {
  statusLabel.setValue('🚀 Analyse läuft…');
  frontline.showFrontline(year);
  print('🧪 Analyse startet mit useLiveNDVI =', useLiveNDVI);


  var region = regionDefs[regionName];
  var compRegion = regionDefs[compName];

  print('📍 Region:', regionName, region);
  print('📍 Vergleichsregion:', compName, compRegion);
  print('📅 Jahr:', year);
  print('⚙️ Modus:', useLiveNDVI ? 'Live' : 'Asset');

  map.centerObject(region, 8);

  var statsA = useLiveNDVI
    ? zscore.getNDVIBaselineStatsLive(regionName)
    : zscore.getNDVIBaselineStats(regionName);

  print('📊 Stats A:', statsA);

  var ndviA = useLiveNDVI
    ? ndvi.getYearlyNDVI(year, region)
    : zscore.loadNDVIAsset(regionName, year);

  print('🟢 NDVI-A geladen:', ndviA);

  var zA = ndviA.subtract(statsA.mean)
    .divide(statsA.stdDev)
    .updateMask(statsA.stdDev.gte(config.minStdDev))
    .rename('NDVI_Z');

  print('🧮 Z-A:', zA);

  var statsB = useLiveNDVI
    ? zscore.getNDVIBaselineStatsLive(compName)
    : zscore.getNDVIBaselineStats(compName);

  print('📊 Stats B:', statsB);

  var ndviB = useLiveNDVI
    ? ndvi.getYearlyNDVI(year, compRegion)
    : zscore.loadNDVIAsset(compName, year);

  print('🟢 NDVI-B geladen:', ndviB);

  var zB = ndviB.subtract(statsB.mean)
    .divide(statsB.stdDev)
    .updateMask(statsB.stdDev.gte(config.minStdDev))
    .rename('NDVI_Z');

  print('🧮 Z-B:', zB);

  var compGeom = (typeof compRegion.geometry === 'function') ? compRegion.geometry() : compRegion;

  print('📐 Vergleichsregion Geometrie:', compGeom);

  zB.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: compGeom,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).evaluate(function (result) {
    print('📉 reduceRegion Ergebnis:', result);

    var zMeanB = result && result['NDVI_Z'];
    if (typeof zMeanB !== 'number') {
      statusLabel.setValue('❌ Fehler: Vergleichs-Z ungültig.');
      return;
    }

    var zDiff = zA.subtract(ee.Number(zMeanB)).rename('Z_Diff');
    map.addLayer(zDiff, {
      min: config.zDisplayRange[0],
      max: config.zDisplayRange[1],
      palette: config.zPalette
    }, 'Z_Diff: ' + regionName + ' minus ' + compName);

    statusLabel.setValue('✅ Analyse abgeschlossen.');
    charts.showAllStats(region, compGeom, statsA, statsB, zA, zB, zDiff);
    rightPanel.clear();
    if (charts.panel instanceof ui.Panel) {
      rightPanel.add(charts.panel);
    } else {
      rightPanel.add(ui.Label('⚠️ Fehler: Kein gültiges Chart-Panel gefunden.'));
      print('❌ charts.panel ist kein ui.Panel:', charts.panel);
    }
  });
}


exports.runAnalysis = runAnalysis;
