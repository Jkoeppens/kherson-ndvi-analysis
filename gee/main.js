// Auto-generated main.js for GEE
// Generated on Thu Jul 10 23:44:51 CEST 2025

// gee/logic/regions.js

// Geometries for regional NDVI/Z analysis
var regionDefs = {
  kherson: ee.Geometry.Rectangle([32.0, 46.0, 33.0, 47.0]),
  vinnytsia: ee.Geometry.Rectangle([27.6, 47.9, 28.4, 48.6]),
  kharkiv: ee.Geometry.Rectangle([36.0, 49.5, 37.5, 50.5]),
  donetsk: ee.Geometry.Rectangle([37.0, 47.0, 38.5, 48.5]),
  luhansk: ee.Geometry.Rectangle([38.0, 48.0, 39.5, 49.5]),
  zaporizhzhia: ee.Geometry.Rectangle([35.0, 47.0, 36.5, 48.0]),
  mariupol: ee.Geometry.Rectangle([37.0, 47.0, 38.0, 47.5])
};

// Export structure for future tooling (not used directly in GEE)
exports.regionDefs = regionDefs;


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


// gee/logic/zscore.js

/**
 * Calculate NDVI baseline (median and stdDev) from a list of years.
 * Uses cropland mask to focus on relevant pixels.
 * @param {number[]} years 
 * @param {ee.Geometry} region 
 * @param {ee.Image} croplandMask 
 * @param {function} getNDVISeason 
 * @returns {{median: ee.Image, stdDev: ee.Image}}
 */
function calculateBaseline(years, region, croplandMask) {
  var baseline = ee.ImageCollection(years.map(function(y) {
    return getNDVISeason(y, region).median().updateMask(croplandMask);
  }));
  return {
    median: baseline.reduce(ee.Reducer.median()),
    stdDev: baseline.reduce(ee.Reducer.stdDev())
  };
}


/**
 * Compute corrected Z-score image for a given year.
 * Subtracts Vinnytsia reference Z from Kherson raw Z.
 * @param {ee.Image} ndviImg 
 * @param {ee.Image} baselineMedian 
 * @param {ee.Image} baselineStdDev 
 * @param {number} vinnytsiaZ 
 * @param {ee.Geometry} region 
 * @returns {ee.Image}
 */
function computeZCorrected(ndviImg, baselineMedian, baselineStdDev, vinnytsiaZ, region) {
  var z_kh = ndviImg.subtract(baselineMedian).divide(baselineStdDev.add(0.0001));
  var z_vinnytsia_img = ee.Image.constant(vinnytsiaZ).clip(region);
  return z_kh.subtract(z_vinnytsia_img).rename('Z_Corrected');
}

// Conceptual exports
exports.calculateBaseline = calculateBaseline;
exports.computeZCorrected = computeZCorrected;


// gee/logic/zscore_visual.js

/**
 * Clamp and display the corrected Z-score image on the map.
 * @param {ee.Image} zCorrectedImg 
 * @param {string} label 
 */
function showZCorrectedLayer(zCorrectedImg, label) {
  var z_clipped = zCorrectedImg.clamp(-5, 5);
  Map.addLayer(z_clipped, {
    min: -2,
    max: 2,
    palette: [
      '#a50026', '#f46d43', '#fdae61',
      '#ffffbf', '#d9ef8b', '#66bd63', '#1a9850'
    ]
  }, label);
  return z_clipped;
}

/**
 * Generate histogram chart of Z-corrected NDVI values.
 * Requires Vinnytsia NDVI mean and std for label annotation.
 * @param {ee.Image} zImage 
 * @param {ee.Geometry} region 
 * @param {number} year 
 * @param {{mean: number, std: number}} vinnytsiaStats 
 */
function renderZHistogram(zImage, region, year, vinnytsiaStats) {
  zImage.reduceRegion({
    reducer: ee.Reducer.histogram({maxBuckets: 500}),
    geometry: region,
    scale: 100,
    maxPixels: 1e9
  }).get('Z_Corrected').evaluate(function(hist) {
    if (!hist) return;

    var z_vals = hist.bucketMeans;
    var counts = hist.histogram;
    var mean = vinnytsiaStats.mean;
    var std = vinnytsiaStats.std;

    var labels = z_vals.map(function(z) {
      var ndvi = z * std + mean;
      return z.toFixed(2) + ' (' + ndvi.toFixed(3) + ')';
    });

    var chart = ui.Chart.array.values({array: [counts], axis: 0})
      .setChartType('ColumnChart')
      .setOptions({
        title: 'Z Corrected Histogram ' + year,
        hAxis: {
          title: 'Z-Wert (NDVI aus Z)',
          slantedText: true,
          slantedTextAngle: 90,
          ticks: z_vals.map(function(z, i) {
            return {v: z, f: labels[i]};
          })
        },
        vAxis: {title: 'Pixel Count'},
        legend: {position: 'none'},
        bar: {groupWidth: '95%'}
      });

    print(chart);
  });
}

// Conceptual exports
exports.showZCorrectedLayer = showZCorrectedLayer;
exports.renderZHistogram = renderZHistogram;


// gee/logic/frontline.js

/**
 * Frontline asset IDs by year (June snapshots).
 */
var frontlineAssets = {
  2022: 'projects/ndvi-comparison-ukr/assets/frontline_2022-06-30',
  2023: 'projects/ndvi-comparison-ukr/assets/frontline_2023-06-30',
  2024: 'projects/ndvi-comparison-ukr/assets/frontline_2024-06-30'
};

/**
 * Converts polygon features into boundary lines (safe version).
 * Handles invalid or empty geometries gracefully.
 * @param {ee.FeatureCollection} fc 
 * @returns {ee.FeatureCollection}
 */
function extractFrontlineLines(fc) {
  return fc.map(function(feature) {
    var geoms = ee.Geometry(feature.geometry()).geometries();
    var lines = ee.List(geoms).map(function(g) {
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
 */
function showFrontline(year) {
  var assetId = frontlineAssets[year];
  var frontline = ee.FeatureCollection(assetId);
  var frontlineLines = extractFrontlineLines(frontline);
  Map.addLayer(frontlineLines, {
    color: '#1f78b4',
    width: 2
  }, 'Frontline ' + year + '-06-30');
}

// Conceptual exports
exports.showFrontline = showFrontline;
exports.frontlineAssets = frontlineAssets;


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