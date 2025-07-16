// Geometrien für NDVI/Z-Analyse-Regionen
var regionDefs = {
  // 🟠 Ukraine (Original)
  kherson: ee.Geometry.Rectangle([32.0, 46.0, 33.0, 47.0]),  // ➤ Zielregion: semi-arid, intensiver Ackerbau
  vinnytsia: ee.Geometry.Rectangle([27.9, 48.9, 29.0, 49.8]),  // ➤ Vergleichbare Bodentypen, kühler, humider
  kharkiv: ee.Geometry.Rectangle([36.0, 49.5, 37.5, 50.5]),
  donetsk: ee.Geometry.Rectangle([37.0, 47.0, 38.5, 48.5]),
  luhansk: ee.Geometry.Rectangle([38.0, 48.0, 39.5, 49.5]),
  zaporizhzhia: ee.Geometry.Rectangle([35.0, 47.0, 36.5, 48.0]),
  mariupol: ee.Geometry.Rectangle([37.0, 47.0, 38.0, 47.5]),

  // 🟢 Moldau
  moldova_balti: ee.Geometry.Rectangle([27.5, 47.7, 28.5, 48.3]),  // ➤ Balti-Steppe, ähnliche Crops, stabile Referenz

  // 🔵 Rumänien
  romania_baragan: ee.Geometry.Rectangle([26.3, 44.3, 27.8, 45.2]),  // ➤ Bărăgan-Ebene, große Ackerflächen, vergleichbares Klima
  romania_timisoara: ee.Geometry.Rectangle([20.5, 45.5, 21.5, 46.0]),  // ➤ Westliche Landwirtschaftsregion, leicht feuchter
  romania_dobrogea: ee.Geometry.Rectangle([28.0, 44.3, 29.3, 45.0])  // ➤ Trockener, starke Sonnenblumen- und Weizenproduktion
};


// Metadaten zu Regionen (z.B. Frontline-Verfügbarkeit)


// Liste aller Regionsnamen
var regionKeys = Object.keys(regionDefs);

// Prüft, ob ein Regionsname gültig ist
function isValidRegion(name) {
  return regionDefs.hasOwnProperty(name);
}

// Exportieren der Variablen und Funktion
exports.regionDefs = regionDefs;
exports.regionKeys = regionKeys;
exports.isValidRegion = isValidRegion;
