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
