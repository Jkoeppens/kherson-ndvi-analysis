/**
 * Führt Z-Differenz-Exporte für mehrere Jahre aus.
 * Region A wird pixelbasiert exportiert, Region B fließt als Mittelwert ein.
 * 
 * @param {string} Kherson - z. B. 'kherson'
 * @param {string} Vinnytsia - z. B. 'vinnytsia'
 * @param {number[]} years - Liste von Jahren, z. B. [2022, 2023, 2024]
 */
function batchExportZDiff(regionA, regionB, years) {
  years.forEach(function(year) {
    exportZDiff(regionA, regionB, year);
  });

  print('📦 Batch-Z-Diff-Exporte gestartet für:', regionA, 'gegen', regionB, 'Jahre:', years);
}

