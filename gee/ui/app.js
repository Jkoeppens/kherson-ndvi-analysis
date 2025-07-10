// gee/ui/app.js (refactored for dual Z-standardization)

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

    // Cropland masks
    var cropland = ee.Image(config.croplandSource);
    var maskA = cropland.gt(0).clip(region);
    var maskB = cropland.gt(0).clip(compRegion);

    // Z images (region-wise standardized)
    var zA = calculateZImage(year, region, maskA);
    var zB = calculateZImage(year, compRegion, maskB);

    // Z correction: A - B
    var zCorr = zA.subtract(zB).rename('Z_Corrected');
    var clipped = showZCorrectedLayer(zCorr, 'Z Corrected ' + year);

    renderZHistogram(clipped, region, year, null); // no vinnytsiaStats needed

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
    ui.Label('NDVI Z-Score Analysis'),
    ui.Label('Analysis Region:'), regionSelect,
    ui.Label('Comparison Region:'), compSelect,
    ui.Label('Year:'), yearSelect,
    runButton
  ],
  style: { width: '300px' }
});

ui.root.insert(0, panel);
