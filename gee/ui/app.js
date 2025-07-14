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
