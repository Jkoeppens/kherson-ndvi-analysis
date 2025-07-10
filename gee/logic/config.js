/**
 * Zentrale Konfiguration für NDVI-Z-Analyse.
 */
var config = {
  // Zeitkonfiguration
  baselineYears: [2018, 2019, 2020, 2021],
  analysisYears: [2022, 2023, 2024],
  analysisMonths: [5, 6], // Mai–Juni

  // Skalen & GEE-Limits
  scale: 100,
  maxPixels: 1e9,

  // Visualisierung von Z-Werten
  zClampRange: [-5, 5],
  zDisplayRange: [-2, 2],
  zPalette: [
    '#a50026', '#f46d43', '#fdae61',
    '#ffffbf', '#d9ef8b', '#66bd63', '#1a9850'
  ],

  // Cropland-Maske (Global Food Security Analysis Data)
  croplandSource: 'USGS/GFSAD1000_V1',

  // Frontline-Vektordaten nach Jahr
  frontlineAssets: {
    2022: 'projects/ndvi-comparison-ukr/assets/frontline_2022-06-30',
    2023: 'projects/ndvi-comparison-ukr/assets/frontline_2023-06-30',
    2024: 'projects/ndvi-comparison-ukr/assets/frontline_2024-06-30'
  }
};

// Konzeptionelle Exporte
exports.config = config;
