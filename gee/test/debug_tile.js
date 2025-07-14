// 🧪 Hauptfunktion für Debugging
function debugTilingNDVI(year, region, tileSizeDeg) {
  print('🧪 Starte Tiling-Debug für Jahr:', year);

  // Berechne NDVI-Bild
  var ndviImg = getYearlyNDVI(year, region);

  // Visualisierung hinzufügen
  Map.addLayer(ndviImg, {min: 0, max: 1, palette: ['white', 'green']}, 'NDVI ' + year);

  // Tiles erzeugen
  var tiles = makeTiles(region, tileSizeDeg);
  Map.addLayer(tiles.style({color: 'black', fillColor: '00000000'}), {}, 'Tiles');

  // Für jedes Tile Histogramm berechnen
  tiles.toList(tiles.size()).evaluate(function(tileList) {
    tileList.forEach(function(tile, i) {
      var geom = ee.Feature(tile).geometry();
      var clipped = ndviImg.clip(geom);

      var chart = ui.Chart.image.histogram({
        image: clipped,
        region: geom,
        scale: 30,
        minBucketWidth: 0.02
      }).setOptions({
        title: 'Tile ' + i + ' NDVI Histogram (' + year + ')',
        hAxis: {title: 'NDVI'},
        vAxis: {title: 'Pixelanzahl'},
        lineWidth: 1,
        pointSize: 3
      });

      print(chart);
    });
  });
}


// 🔧 Funktion zur Tilerstellung (wenn noch nicht da)
function makeTiles(region, tileSizeDeg) {
  var bounds = region.bounds();
  var coords = ee.List(bounds.coordinates().get(0));

  var lngs = coords.map(function(c) { return ee.List(c).get(0); });
  var lats = coords.map(function(c) { return ee.List(c).get(1); });

  var minLng = ee.Number(lngs.reduce(ee.Reducer.min()));
  var maxLng = ee.Number(lngs.reduce(ee.Reducer.max()));
  var minLat = ee.Number(lats.reduce(ee.Reducer.min()));
  var maxLat = ee.Number(lats.reduce(ee.Reducer.max()));

  var xSteps = maxLng.subtract(minLng).divide(tileSizeDeg).ceil();
  var ySteps = maxLat.subtract(minLat).divide(tileSizeDeg).ceil();

  var tiles = ee.List.sequence(0, xSteps.subtract(1)).map(function(i) {
    return ee.List.sequence(0, ySteps.subtract(1)).map(function(j) {
      var x = minLng.add(ee.Number(i).multiply(tileSizeDeg));
      var y = minLat.add(ee.Number(j).multiply(tileSizeDeg));
      var tile = ee.Geometry.Rectangle([x, y, x.add(tileSizeDeg), y.add(tileSizeDeg)]);
      return ee.Feature(tile);
    });
  }).flatten();

  return ee.FeatureCollection(tiles);
}
