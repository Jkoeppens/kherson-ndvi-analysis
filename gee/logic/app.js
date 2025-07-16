var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;
var regions = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/regions');
var zscore = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/zscore');
var ndvi = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/ndvi');
var exportNDVI = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/export').exportNDVIToAsset;
var assetCheck = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/asset_check');
var frontline = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/frontline');
var charts = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/charts');

var regionDefs = regions.regionDefs;
var regionKeys = Object.keys(regionDefs);
var isValidRegion = regions.isValidRegion;

var useLiveNDVI = true;
var liveModeCheckbox = ui.Checkbox({
  label: 'Live-Berechnung (kein Asset nötig)',
  value: useLiveNDVI,
  onChange: function(checked) {
    useLiveNDVI = checked;
    print('🔁 NDVI-Modus:', checked ? 'Live' : 'Asset-basiert');
  }
});

var regionSelect = ui.Select({
  items: regionKeys,
  value: regionKeys[0],
  placeholder: 'Select analysis region'
});

var compSelect = ui.Select({
  items: regionKeys,
  value: regionKeys[1],
  placeholder: 'Select comparison region'
});

var yearSelect = ui.Select({
  items: config.analysisYears.map(String),
  value: String(config.analysisYears[0]),
  placeholder: 'Select year'
});

var statusLabel = ui.Label('Status: bereit');

var runButton = ui.Button({
  label: 'Run Analysis',
  style: { stretch: 'horizontal' },
  onClick: function () {
    var regionName = regionSelect.getValue();
    var compName = compSelect.getValue();
    var yearStr = yearSelect.getValue();
    var year = parseInt(yearStr, 10);

    statusLabel.setValue('Status: Prüfe Auswahl...');
    print('🧪 Auswahl – Region:', regionName, '| Vergleich:', compName, '| Jahr:', year, '| Modus:', useLiveNDVI ? 'Live' : 'Export');

    if (!regionName || !compName || isNaN(year)) {
      statusLabel.setValue('❌ Ungültige Auswahl.');
      return;
    }

    if (!isValidRegion(regionName) || !isValidRegion(compName)) {
      statusLabel.setValue('❌ Ungültige Regionen ausgewählt.');
      return;
    }

    if (useLiveNDVI) {
      runAnalysis(regionName, compName, year);
    } else {
      var yearsToCheck = config.baselineYears.concat([year]);
      assetCheck.checkAndExportNDVIAssets(regionName, yearsToCheck, function() {
        assetCheck.checkAndExportNDVIAssets(compName, yearsToCheck, function() {
          statusLabel.setValue('✅ Alle Assets vorhanden, berechne Z-Scores...');
          runAnalysis(regionName, compName, year);
        });
      });
    }
  }
});

function runAnalysis(regionName, compName, year) {
  var region = regionDefs[regionName];
  var compRegion = regionDefs[compName];
  Map.clear();

  Map.centerObject(region, 8);
  frontline.showFrontline(year);

  var statsA = useLiveNDVI
    ? zscore.getNDVIBaselineStatsLive(regionName)
    : zscore.getNDVIBaselineStats(regionName);

  var ndviA = useLiveNDVI
    ? ndvi.getYearlyNDVI(year, region)
    : zscore.loadNDVIAsset(regionName, year);

  var zA = ndviA
    .subtract(statsA.mean)
    .divide(statsA.stdDev)
    .updateMask(statsA.stdDev.gte(config.minStdDev))
    .rename('NDVI_Z');

  var statsB = useLiveNDVI
    ? zscore.getNDVIBaselineStatsLive(compName)
    : zscore.getNDVIBaselineStats(compName);

  var ndviB = useLiveNDVI
    ? ndvi.getYearlyNDVI(year, compRegion)
    : zscore.loadNDVIAsset(compName, year);

  var zB = ndviB
    .subtract(statsB.mean)
    .divide(statsB.stdDev)
    .updateMask(statsB.stdDev.gte(config.minStdDev))
    .rename('NDVI_Z');

  var compRegionGeometry = (typeof compRegion.geometry === 'function')
    ? compRegion.geometry()
    : compRegion;

  zB.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: compRegionGeometry,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).evaluate(function (result) {
    var zMeanB = result && result['NDVI_Z'];

    if (zMeanB === null || zMeanB === undefined || isNaN(zMeanB) || typeof zMeanB !== 'number') {
      print('❌ Z-Mittelwert Vergleichsregion ungültig:', zMeanB);
      statusLabel.setValue('❌ Fehler: Vergleichswert ungültig.');
      return;
    }

    print('✅ Z-Mittelwert von ' + compName + ':', zMeanB);

    var zDiff = zA.subtract(ee.Number(zMeanB)).rename('Z_Diff');

    Map.addLayer(zDiff, {
      min: config.zDisplayRange[0],
      max: config.zDisplayRange[1],
      palette: config.zPalette
    }, 'Z_Diff: ' + regionName + ' minus mean of ' + compName);

    statusLabel.setValue('✅ Analyse fertig.');

    charts.showAllStats(region, compRegionGeometry, statsA, statsB, zA, zB, zDiff);

    var rightPanel = ui.Panel({
      widgets: [charts.panel],
      layout: ui.Panel.Layout.flow('vertical'),
      style: { width: '350px', padding: '8px' }
    });

    ui.root.widgets().set(1, rightPanel);
  });
}

var leftPanel = ui.Panel({
  widgets: [
    ui.Label('NDVI Z-Score Comparison', { fontWeight: 'bold', fontSize: '20px' }),
    ui.Label('Select Analysis Region:'),
    regionSelect,
    ui.Label('Select Comparison Region:'),
    compSelect,
    ui.Label('Select Year:'),
    yearSelect,
    ui.Label('Analysemodus:'),
    liveModeCheckbox,
    runButton,
    statusLabel
  ],
  style: { width: '300px', padding: '10px' }
});

ui.root.clear();
ui.root.add(leftPanel);
ui.root.add(ui.Panel());
