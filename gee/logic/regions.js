/**
 * Geometrien und Metadaten für NDVI/Z-Analyse-Regionen.
 * Jede Region ist ein Feature mit Geometrie & Metadaten.
 */
var regionDefs = {
  kherson: ee.Geometry.Rectangle([32.0, 46.0, 33.0, 47.0]),
  vinnytsia: ee.Geometry.Rectangle([28.1, 49.3, 29.1, 49.9]),
  kharkiv: ee.Geometry.Rectangle([36.0, 49.5, 37.5, 50.5]),
  donetsk: ee.Geometry.Rectangle([37.0, 47.0, 38.5, 48.5]),
  luhansk: ee.Geometry.Rectangle([38.0, 48.0, 39.5, 49.5]),
  zaporizhzhia: ee.Geometry.Rectangle([35.0, 47.0, 36.5, 48.0]),
  mariupol: ee.Geometry.Rectangle([37.0, 47.0, 38.0, 47.5])
};

/**
 * Metadaten zu Regionen.
 */
var regionMeta = {
  kherson: { hasFrontline: true },
  vinnytsia: { hasFrontline: false },
  kharkiv: { hasFrontline: true },
  donetsk: { hasFrontline: true },
  luhansk: { hasFrontline: true },
  zaporizhzhia: { hasFrontline: true },
  mariupol: { hasFrontline: true }
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


