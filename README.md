# NDVI Z-Score Analysis for War-Affected Regions in Ukraine

This Earth Engine application visualizes changes in vegetation health across key regions along the frontline of the war in Ukraine. It uses Sentinel-2 NDVI data, applies cloud masking, and computes Z-scores relative to a dynamically chosen comparison region.

---

## 🛰 What It Does

* Computes **NDVI medians** for May–June in each year (2022–2024)
* Applies **cloud masking** via Sentinel-2 SCL band
* Calculates **Z-scores** relative to a pre-war baseline (2018–2021)
* Enables dynamic **comparison to a reference region** (e.g. Vinnytsia, Luhansk, etc.)
* Visualizes results as:

  * Color-coded **Z-score maps**
  * **Histograms** annotated with NDVI equivalents
  * **Frontline overlays** per year

---

## 🎛 How to Use

1. Open the Earth Engine script in the GEE Code Editor
2. Use the **UI panel** to select:

   * **Analysis region** (e.g. Kherson, Donetsk, Mariupol)
   * **Comparison region** (any defined region)
   * **Year** (2022–2024)
3. Click **"Run Analysis"** to:

   * Center map on region
   * Display Z-corrected NDVI
   * Show histogram of Z-values
   * Overlay June frontlines of selected year

---

## 📁 Project Structure

```bash
kherson-ndvi-analysis/
├── gee/
│   ├── logic/
│   │   ├── regions.js         # Geometries for all regions
│   │   ├── ndvi.js            # NDVI calculation and masking
│   │   ├── zscore.js          # Baseline and Z-correction logic
│   │   ├── zscore_visual.js   # Visualization: color map + histogram
│   │   └── frontline.js       # Frontline asset loader and parser
│   └── ui/
│       └── app.js             # Main user interface logic
├── build.sh                  # Script to concatenate modules into main.js
├── main.js                   # Full script to run in GEE (generated)
└── README.md                 # You are here
```

---

## ⚙️ Dev Notes

* **Earth Engine version**: `ee.ImageCollection('COPERNICUS/S2_SR')`
* **Cropland mask**: `USGS/GFSAD1000_V1`
* **Z-score clamp range**: \[-5, 5] → color ramp normalized to \[-2, 2]
* Frontline shapefiles must be uploaded as assets under:

  ```
  ```

projects/ndvi-comparison-ukr/assets/frontline\_<year>-06-30

```

---

## 💡 About This Project

Developed as a **data journalism demo** to support remote sensing-based reporting in conflict zones. Modularized for maintainability and future expansion.

### 🛠 Maintainer
Jakob Koeppens  ·  [github.com/Jkoeppens](https://github.com/Jkoeppens)

```
# kherson-ndvi-analysis