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
