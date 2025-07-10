// gee/ui/app.js

/**
 * Main UI orchestration for NDVI Z-score analysis.
 * Allows dynamic selection of analysis and comparison region.
 * Computes Z-correction dynamically based on comparison NDVI.
 */

// UI elements
var regionSelect = ui.Select({
  items: Object.keys(regionDefs),
  placeholder: 'Select analysis region'
});

var compSelect = ui.Select({
  items: Object.keys(regionDefs),
  placeholder: 'Select comparison region'
});

var yearSelect = ui.Select({
  items: ['2022', '2023', '2024'],
  placeholder: 'Select year'
});

var runButton = ui.Button({
  label: 'Run Analysis',
  onClick: function() {
    var regionName = regionSelect.getValue();
    var compName = compSelect.getValue();
    var year = parseInt(yearSelect.getValue(), 10);
    if (!regionName || !compName || !year) {
      print('⚠️ Please select region, comparison, and year.');
      return;
    }

    var region = regionDefs[regionName];
    var compRegion = regionDefs[compName];
    Map.centerObject(region, 8);

    var cropland = ee.Image('USGS/GFSAD1000_V1');
    var croplandMask = cropland.gt(0).clip(region);

    var baseline = calculateBaseline([2018, 2019, 2020, 2021], region, croplandMask);
    var ndvi = getNDVISeason(year, region).median().updateMask(croplandMask);

    var ndvi_comp = getNDVISeason(year, compRegion).median();
    var z_comp = ndvi_comp.subtract(baseline.median)
                          .divide(baseline.stdDev.add(0.0001))
                          .rename('Z_Ref');

    var z_comp_mean = z_comp.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: compRegion,
      scale: 100,
      maxPixels: 1e9
    }).get('Z_Ref');

z_comp_mean.evaluate(function(z_val) {
  var zImage = computeZCorrected(ndvi, baseline.median, baseline.stdDev, z_val, region);
  var clipped = showZCorrectedLayer(zImage, 'Z Corrected ' + year);
  renderZHistogram(clipped, region, year, null);
  showFrontline(year);
}); // closes .evaluate()

  } // ✅ ← this closes the .onClick function
});


// Layout
// Layout
var panel = ui.Panel({
  widgets: [
    ui.Label('NDVI Z-Score Analysis'),
    ui.Label('Analysis Region:'), regionSelect,
    ui.Label('Comparison Region:'), compSelect,
    ui.Label('Year:'), yearSelect,
    runButton
  ],
  style: {width: '300px'}
});


ui.root.insert(0, panel);