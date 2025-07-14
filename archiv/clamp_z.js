/**
 * Begrenzt Z-Werte auf einen definierten Bereich, z. B. ±5.
 * @param {ee.Image} zImage – Bild mit Z-Werten
 * @param {number} minZ – Untergrenze (z. B. -5)
 * @param {number} maxZ – Obergrenze (z. B. +5)
 * @returns {ee.Image} – Geclampte Z-Werte
 */
function clampZ(zImage, minZ, maxZ) {
  return zImage.clamp(minZ, maxZ).rename('Z_clamped');
}
