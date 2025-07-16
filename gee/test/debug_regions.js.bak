/**
 * Testskript: Verifikation von regionDefs
 * Module: gee/logic/regions.js
 */

print('🧪 Verfügbare Regionen:', Object.keys(regionDefs));

regionKeys.forEach(function(key) {
  var def = regionDefs[key];
  var geom = def.geometry;
  Map.addLayer(geom, {}, 'Region: ' + key);
});

print('Test isValidRegion("vinnytsia"):', isValidRegion('vinnytsia')); // erwartet: true
print('Test isValidRegion("berlin"):', isValidRegion('berlin'));       // erwartet: false
