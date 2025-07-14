function maskSCL(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(6)).and(scl.neq(7)).and(scl.neq(8));
  return image.updateMask(mask);
}

function addNDVI(image) {
  return image.addBands(
    image.normalizedDifference(['B8', 'B4']).rename('NDVI')
  );
}

/**
 * Berechnet das jährliche NDVI-Medianbild für eine Region.
 * @param {number} year
 * @param {ee.Geometry} region
 * @returns {ee.Image}
 */
function getYearlyNDVI(year, region) {
  // 📆 Filtere Sentinel-2-Bilder nach Jahr und Region
  var start = ee.Date.fromYMD(year, config.analysisMonths.start, 1);
  var end = ee.Date.fromYMD(year, config.analysisMonths.end, 1).advance(1, 'month');
  var collection = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(region)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80));

  print('📂 Rohbilder (Anzahl):', collection.size());

  // 🧼 Maskiere Wolken mit SCL-Band
  var masked = collection.map(maskSCL);

  // 🌿 Berechne NDVI für jedes Bild
  var withNDVI = masked.map(addNDVI);

  // 📊 Median NDVI
  var ndviMedian = withNDVI.select('NDVI').median().rename('NDVI');

  // 🔢 Anzahl gültiger Beobachtungen pro Pixel
  var validObs = withNDVI.select('NDVI')
    .reduce(ee.Reducer.count())
    .rename('valid_obs');

  // 🌾 Cropland-Maske (optional)
  var cropland = ee.Image('USGS/GFSAD1000_V1').select('landcover');
  var croplandMask = cropland.eq(1);  // Nur bewässertes Farmland

  // 🧪 Maske anwenden (optional – hier: deaktiviert)
  var useCroplandMask = config.useCroplandMask;  // true oder false
  var finalNDVI = ee.Image(
    ee.Algorithms.If(useCroplandMask, ndviMedian.updateMask(croplandMask), ndviMedian)
  );

  // 📦 Ergebnis als NDVI-Bild (1 Band)
  return finalNDVI.set({
    'system:time_start': start.millis(),
    'region_name': region
  });
}


function countValidNDVIObservations(year, region, months) {
  var m = months || config.analysisMonths;
  var start = ee.Date.fromYMD(year, m[0], 1);
  var end = ee.Date.fromYMD(year, m[1] + 1, 1);

  var collection = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(region)
    .filterDate(start, end)
    .map(maskSCL)
    .map(addNDVI)
    .select('NDVI');

  return collection.map(function(img) {
      return img.mask().rename('valid').uint8();
    })
    .sum()
    .rename('valid_obs');
}
