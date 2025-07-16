/**
 * Modul zur Überwachung von NDVI-Asset-Exporten
 * 
 * Nutzt das bereitgestellte Panel, um den Status der Exporte anzuzeigen.
 */

var uiHelpers = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/ui_helpers');

/**
 * Startet Monitoring und aktualisiert regelmäßig das UI.
 * 
 * @param {Array<{assetId: string}>} assetList - Liste fehlender Assets
 * @param {ui.Panel} exportStatusPanel - Panel zur Anzeige
 * @param {ui.Label} statusLabel - Label zur Statusanzeige
 */
function monitorExportStatus(assetList, exportStatusPanel, statusLabel) {
  exportStatusPanel.clear();
  uiHelpers.show(exportStatusPanel);

  exportStatusPanel.add(ui.Label({
    value: '⏳ Überwache Exporte...',
    style: { fontWeight: 'bold', margin: '4px 0 4px 0' }
  }));

  var labels = {};
  assetList.forEach(function (item) {
    var label = ui.Label('- ' + item.assetId + ' [⏳ ausstehend]');
    exportStatusPanel.add(label);
    labels[item.assetId] = label;
  });

  function checkAll() {
    var remaining = [];
    var i = 0;

    function checkNext() {
      if (i >= assetList.length) {
        if (remaining.length === 0) {
          exportStatusPanel.clear();
          uiHelpers.hide(exportStatusPanel);
          statusLabel.setValue('✅ Alle Assets vorhanden. Du kannst jetzt analysieren.');
        } else {
          setTimeout(checkAll, 10000); // Wiederhole nach 10 Sekunden
        }
        return;
      }

      var asset = assetList[i];
      ee.data.getAsset(asset.assetId, function () {
        labels[asset.assetId].setValue('- ' + asset.assetId + ' [✅ fertig]');
        i++;
        checkNext();
      }, function () {
        labels[asset.assetId].setValue('- ' + asset.assetId + ' [⏳ ausstehend]');
        remaining.push(asset);
        i++;
        checkNext();
      });
    }

    checkNext();
  }

  checkAll();
}

// Export
exports.monitorExportStatus = monitorExportStatus;
