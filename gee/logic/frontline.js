// --- logic/frontline.js ---

// 🔁 Konfiguration importieren
var config = require('users/jakobkoppermann/Ukraine_NDVIRep:logic/config').config;

// 📦 Asset-Liste für Frontlinien je Jahr
var frontlineAssets = config.frontlineAssets;

/**
 * Konvertiert Polygon-Features in Grenzlinien.
 * Behandelt ungültige oder leere Geometrien robust.
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
 * Lädt und zeigt die Frontlinie für ein bestimmtes Jahr.
 * @param {number} year – z. B. 2023
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

// 📤 Exportiere Funktionen für andere Module
exports.showFrontline = showFrontline;
exports.frontlineAssets = frontlineAssets;
