var config = {
  baselineYears: [2019, 2020, 2021],
  analysisYears: [2022, 2023, 2024],
  analysisMonths: [5, 6], // Mai–Juni
  scale: 100,
  crs: 'EPSG:4326',
  maxPixels: 1e9,
  minStdDev: 0.01,
  zClampRange: [-5, 5],
  zDisplayRange: [-2, 2],
  zPalette: [
    '#a50026', '#f46d43', '#fdae61',
    '#ffffbf', '#d9ef8b', '#66bd63', '#1a9850'
  ],
  croplandSource: 'USGS/GFSAD1000_V1',
  useCroplandMask: false,
  maskNegativeNDVI: true, 

  frontlineAssets: {
    2022: 'projects/ndvi-comparison-ukr/assets/frontline_2022-06-30',
    2023: 'projects/ndvi-comparison-ukr/assets/frontline_2023-06-30',
    2024: 'projects/ndvi-comparison-ukr/assets/frontline_2024-06-30'
  }
};

// ✅ WICHTIG: exportiere config am Ende
exports.config = config;
