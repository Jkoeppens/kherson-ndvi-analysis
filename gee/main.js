// Auto-generated main.js for GEE
// Generated on Fri Jul 11 00:56:08 CEST 2025

/**
 * Geometrien und Metadaten für NDVI/Z-Analyse-Regionen.
 */
var regionDefs = {
  kherson: {
    geometry: ee.Geometry.Rectangle([32.0, 46.0, 33.0, 47.0]),
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


/**
 * Zentrale Konfiguration für NDVI-Z-Analyse.
 */
var config = {
  // Zeitkonfiguration
  baselineYears: [2018, 2019, 2020, 2021],
  analysisYears: [2022, 2023, 2024],
  analysisMonths: [5, 6], // Mai–Juni

  // Skalen & GEE-Limits
  scale: 100,
  maxPixels: 1e9,

  // Visualisierung von Z-Werten
  zClampRange: [-5, 5],
  zDisplayRange: [-2, 2],
  zPalette: [
    '#a50026', '#f46d43', '#fdae61',
    '#ffffbf', '#d9ef8b', '#66bd63', '#1a9850'
  ],

  // Cropland-Maske (Global Food Security Analysis Data)
  croplandSource: 'USGS/GFSAD1000_V1',

  // Frontline-Vektordaten nach Jahr
  frontlineAssets: {
    2022: 'projects/ndvi-comparison-ukr/assets/frontline_2022-06-30',
    2023: 'projects/ndvi-comparison-ukr/assets/frontline_2023-06-30',
    2024: 'projects/ndvi-comparison-ukr/assets/frontline_2024-06-30'
  }
};

// Konzeptionelle Exporte
exports.config = config;


// gee/logic/ndvi.js

/**
 * Apply cloud mask based on Sentinel-2 SCL band.
 * Removes cloud shadows, clouds, and cirrus.
 * @param {ee.Image} img 
 * @returns {ee.Image}
 */
function maskSCL(img) {
  var scl = img.select('SCL');
  var mask = scl.neq(3).and(scl.neq(7)).and(scl.neq(8));
  return img.updateMask(mask);
}

/**
 * Adds NDVI band using Sentinel-2 bands.
 * @param {ee.Image} img 
 * @returns {ee.Image}
 */
function addNDVI(img) {
  return img.normalizedDifference(['B8', 'B4']).rename('NDVI');
}

/**
 * Get NDVI image collection for a specific region and year.
 * Filters for May–June and applies SCL masking.
 * @param {number} year 
 * @param {ee.Geometry} region 
 * @returns {ee.ImageCollection}
 */
function getNDVISeason(year, region) {
  var start = ee.Date.fromYMD(year, 5, 1);
  var end = ee.Date.fromYMD(year, 7, 1);

  return ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(region)
    .filterDate(start, end)
    .map(maskSCL)
    .map(addNDVI)
    .select('NDVI');
}

// Conceptual export for version control
exports.getNDVISeason = getNDVISeason;


/**
 * Berechnet NDVI-Baseline (Median und StdDev) aus mehreren Jahren.
 * Optionaler Funktionsparameter für NDVI-Zugriff (testbar).
 * @param {number[]} years 
 * @param {ee.Geometry} region 
 * @param {ee.Image} croplandMask 
 * @param {function} getNDVI [optional]
 * @returns {{median: ee.Image, stdDev: ee.Image}}
 */
function calculateBaseline(years, region, croplandMask, getNDVI) {
  var getNDVISeason = getNDVI || exports.getNDVISeason;

  var baseline = ee.ImageCollection(years.map(function (y) {
    return getNDVISeason(y, region).median().updateMask(croplandMask);
  }));

  var reduced = baseline.reduce(ee.Reducer.median().combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
  }));

  return {
    median: reduced.select('NDVI_median'),
    stdDev: reduced.select('NDVI_stdDev')
  };
}

/**
 * Berechnet den Z-Wert aus NDVI, Median, StdDev.
 * @param {ee.Image} ndvi 
 * @param {ee.Image} median 
 * @param {ee.Image} stdDev 
 * @returns {ee.Image}
 */
function calculateZ(ndvi, median, stdDev) {
  return ndvi.subtract(median).divide(stdDev.add(0.0001)).rename('Z');
}

/**
 * Berechnet Z-Wert-Bild für eine Region und ein Jahr.
 * @param {number} year 
 * @param {ee.Geometry} region 
 * @param {ee.Image} croplandMask
 * @returns {ee.Image}
 */
function calculateZImage(year, region, croplandMask) {
  var baseline = calculateBaseline(config.baselineYears, region, croplandMask);
  var ndvi = getNDVISeason(year, region).median().updateMask(croplandMask);
  return calculateZ(ndvi, baseline.median, baseline.stdDev);
}

// Konzeptuelle Exporte
exports.calculateBaseline = calculateBaseline;
exports.calculateZ = calculateZ;
exports.calculateZImage = calculateZImage;


/**
 * Visualisiert das korrigierte Z-Bild auf der Karte.
 * @param {ee.Image} zCorrectedImg 
 * @param {string} label 
 * @returns {ee.Image}
 */
function showZCorrectedLayer(zCorrectedImg, label) {
  var z_clipped = zCorrectedImg.clamp(config.zClampRange[0], config.zClampRange[1]);
  Map.addLayer(z_clipped, {
    min: config.zDisplayRange[0],
    max: config.zDisplayRange[1],
    palette: config.zPalette
  }, label);
  return z_clipped;
}

/**
 * Zeigt ein Histogramm der Z-Werte im gegebenen Bereich.
 * @param {ee.Image} zImage 
 * @param {ee.Geometry} region 
 * @param {number} year 
 */
function renderZHistogram(zImage, region, year) {
  print('🟡 Histogramm wird berechnet...');
  zImage.reduceRegion({
    reducer: ee.Reducer.histogram({ maxBuckets: 500 }),
    geometry: region,
    scale: config.scale,
    maxPixels: config.maxPixels
  }).get('Z_Corrected').evaluate(function (hist) {
    if (!hist) {
      print('⚠️ Kein Histogramm berechenbar.');
      return;
    }

    var z_vals = hist.bucketMeans;
    var counts = hist.histogram;

    var chart = ui.Chart.array.values({ array: [counts], axis: 0 })
      .setChartType('ColumnChart')
      .setOptions({
        title: 'Z Corrected Histogram ' + year,
        hAxis: {
          title: 'Z-Wert (differenziert)',
          slantedText: true,
          slantedTextAngle: 90,
          ticks: z_vals
        },
        vAxis: { title: 'Pixel Count' },
        legend: { position: 'none' },
        bar: { groupWidth: '95%' }
      });

    print(chart);
  });
}

// Konzeptuelle Exporte
exports.showZCorrectedLayer = showZCorrectedLayer;
exports.renderZHistogram = renderZHistogram;


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
