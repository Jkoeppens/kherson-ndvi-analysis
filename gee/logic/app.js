// Module
var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;
var regions = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/regions');
var zscore = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/zscore');
var ndvi = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/ndvi');
var assetCheck = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/asset_check');
var monitorExportStatus = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/export_monitor').monitorExportStatus;
var runAnalysis = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/run_analysis').runAnalysis;
var useLiveNDVI = true;  // ⬅️ ganz oben in der App setzen



function show(widget) {
  widget.style().set('shown', true);
}

function hide(widget) {
  widget.style().set('shown', false);
}


// App-Zustand
var missingNDVIAssets = [];
var waitingForNDVIExports = false;

// Region & Auswahl
var regionDefs = regions.regionDefs;
var regionKeys = Object.keys(regionDefs);
var isValidRegion = regions.isValidRegion;

// Karte
var map = ui.Map();
map.setCenter(33.0, 47.0, 7);

// UI-Elemente
var useLiveNDVI = false;
var liveModeCheckbox = ui.Checkbox({
  label: 'Live-Berechnung (kein Asset nötig)',
  value: true,  // <--- Das ist wichtig: true = angehakt beim Start
  onChange: function(checked) {
    useLiveNDVI = checked;
  }
});


var regionSelect = ui.Select({ items: regionKeys, value: regionKeys[0] });
var compSelect = ui.Select({ items: regionKeys, value: regionKeys[1] });
var yearSelect = ui.Select({
  items: config.analysisYears.map(String),
  value: String(config.analysisYears[0])
});
var statusLabel = ui.Label('Status: bereit');

var missingAssetsPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical') });
hide(missingAssetsPanel);

var exportStatusPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical') });
hide(exportStatusPanel);

// Export-Button + Wrapper
var exportAssetsButton = ui.Button({
  label: 'Fehlende Assets erzeugen',
  style: { stretch: 'horizontal' },
  onClick: function () {
    assetCheck.exportMissingNDVIAssets(missingNDVIAssets);
    monitorExportStatus(missingNDVIAssets, exportStatusPanel, statusLabel);
    waitingForNDVIExports = true;
    statusLabel.setValue('📤 Exporte gestartet. Bitte Analyse später erneut starten.');
    hide(exportButtonWrapper);
  }
});
var exportButtonWrapper = ui.Panel({ widgets: [exportAssetsButton] });
hide(exportButtonWrapper);

// Analyse starten
var runButton = ui.Button({
  label: 'Analyse starten',
  style: { stretch: 'horizontal' },
  onClick: function () {
    // Eingabewerte holen
    var regionName = regionSelect.getValue();
    var compName = compSelect.getValue();
    var year = parseInt(yearSelect.getValue(), 10);
    var requiredYears = config.baselineYears.concat([year]);

    // UI zurücksetzen
    missingNDVIAssets = [];
    missingAssetsPanel.clear();
    hide(missingAssetsPanel);
    hide(exportButtonWrapper);
    hide(exportStatusPanel);
    map.clear();

    // Validierung
    if (!regionName || !compName || isNaN(year)) {
      statusLabel.setValue('❌ Ungültige Auswahl.');
      return;
    }

    if (!isValidRegion(regionName) || !isValidRegion(compName)) {
      statusLabel.setValue('❌ Ungültige Regionen.');
      return;
    }

    // Modus: Live
    if (useLiveNDVI) {
      print('🧪 Live-Modus aktiv – starte Analyse');
      runAnalysis(regionName, compName, year, useLiveNDVI, regionDefs, map, statusLabel, rightPanel);
      return;
    }

    // Modus: Asset → prüfen ob vorhanden
    statusLabel.setValue('🔍 Prüfe benötigte NDVI-Assets…');

    var checksDone = 0;

    function handleResult(list) {
      missingNDVIAssets = missingNDVIAssets.concat(list);
      checksDone++;

      if (checksDone === 2) {  // beide Regionen geprüft
        if (missingNDVIAssets.length === 0) {
          waitingForNDVIExports = false;
          print('✅ Alle NDVI-Assets vorhanden – starte Analyse');
          runAnalysis(regionName, compName, year, useLiveNDVI, regionDefs, map, statusLabel, rightPanel);
        } else {
          waitingForNDVIExports = true;
          print('⛔️ Fehlende NDVI-Assets:', missingNDVIAssets);
          showMissingAssetsList(missingNDVIAssets);
          statusLabel.setValue('⚠️ Fehlende Assets erkannt. Bitte erst erzeugen.');
          show(exportButtonWrapper);
        }
      }
    }

    // Beide Regionen prüfen
    assetCheck.checkMissingNDVIAssets(regionName, requiredYears, handleResult);
    assetCheck.checkMissingNDVIAssets(compName, requiredYears, handleResult);
  }
});

// Fehlende Assets anzeigen
function showMissingAssetsList(list) {
  missingAssetsPanel.clear();
  show(missingAssetsPanel);
  missingAssetsPanel.add(ui.Label({
    value: 'Fehlende NDVI-Assets:',
    style: { fontWeight: 'bold', margin: '4px 0 4px 0' }
  }));
  list.forEach(function (item) {
    missingAssetsPanel.add(ui.Label('- ' + item.assetId));
  });
}

// UI-Aufbau
var leftPanel = ui.Panel({
  widgets: [
    ui.Label('NDVI Z-Score Comparison', { fontWeight: 'bold', fontSize: '18px' }),
    ui.Label('Analyse-Region:'), regionSelect,
    ui.Label('Vergleichsregion:'), compSelect,
    ui.Label('Jahr:'), yearSelect,
    ui.Label('Modus:'), liveModeCheckbox,
    runButton,
    statusLabel,
    exportButtonWrapper,
    missingAssetsPanel
  ],
  style: { width: '300px', padding: '10px' }
});

var rightPanel = ui.Panel({ style: { width: '350px', padding: '10px' } });

var mainLayout = ui.SplitPanel({
  firstPanel: leftPanel,
  secondPanel: map,
  orientation: 'horizontal',
  wipe: false
});

// Root einrichten
ui.root.clear();
ui.root.add(mainLayout);
ui.root.add(rightPanel);
ui.root.add(exportStatusPanel);
