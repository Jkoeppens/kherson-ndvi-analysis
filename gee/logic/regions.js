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
