# 🇺🇦 NDVI-Z-Score-Vergleich Ukraine & Nachbarregionen

Dieses Earth Engine Projekt erlaubt interaktive NDVI-Z-Score-Vergleiche zwischen verschiedenen Regionen der Ukraine, Moldaus und Rumäniens für die Jahre 2022–2024. Ziel ist es, die landwirtschaftliche Produktivität in Konfliktregionen wie Cherson unter Berücksichtigung klimatisch und pedologisch ähnlicher Vergleichsregionen zu analysieren.

---

## 🔧 Funktionen

### 🔬 Z-Score Analyse

- Berechnung des NDVI-Z-Scores für eine Zielregion basierend auf der historischen Referenz (2019–2021).
- Vergleich mit dem mittleren Z-Wert einer Vergleichsregion.
- Darstellung der Differenz: `Z_Diff = Z_Target - Mean(Z_Comparison)`.

### 🌍 Regionsauswahl

- Regionen wie `kherson`, `vinnytsia`, `romania_baragan`, `moldova_balti` u. a.
- Validierung über `regions.isValidRegion(name)`.

### ☁️ NDVI-Berechnung

- Nutzung von Sentinel-2 SR Daten.
- Cloud-Masking über SCL-Band.
- NDVI-Berechnung mit `.normalizedDifference(['B8', 'B4'])`.
- Optional: Maskierung negativer NDVI-Werte und Cropland-Maskierung.

### ⚙️ Zwei Betriebsmodi

1. **Live-Modus (Standard)**  
   - NDVI wird direkt aus Sentinel-2-Daten berechnet.
   - Keine Exporte nötig, ideal für Exploration & Debugging.

2. **Asset-Modus (reproduzierbar)**  
   - NDVI-Bilder werden pro Region & Jahr vorab als Assets exportiert.
   - Schnellere Ladezeiten, konsistente Basis für langfristige Auswertungen.

### 📉 Statistik & Visualisierung

- Interaktive Charts und Histogramme über `charts.showAllStats(...)`.
- Farbcodierte Z-Differenzkarte (`Z_Diff`) mit einstellbarem Wertebereich.

### 🔫 Frontlinie anzeigen

- Frontlinien für Juni 2022–2024 über `frontline.showFrontline(year)` eingeblendet.

---

## 🧩 Modulübersicht

| Modulname           | Funktion                                                      |
|---------------------|---------------------------------------------------------------|
| `config.js`         | Zentrale Parameter (Skalierung, Farbpalette, Baseline-Jahre) |
| `regions.js`        | Definition und Validierung von Analyse-Regionen              |
| `ndvi.js`           | Rohdatenverarbeitung: NDVI-Berechnung, Wolkenmaskierung      |
| `zscore.js`         | Z-Score-Logik, Live- und Asset-Varianten                     |
| `export.js`         | Export von NDVI-Bildern zu GEE Assets                        |
| `asset_check.js`    | Überprüfung, ob alle NDVI-Assets vorhanden sind              |
| `exportzdiff.js`    | Export der berechneten Z-Differenzkarten                     |
| `frontline.js`      | Laden und Anzeigen von Frontlinien (FeatureCollection)       |
| `charts.js`         | Darstellung von Histogrammen und Statistikwerten            |
| `app.js`            | UI-Logik für Interaktion & Visualisierung                    |

---

## 🚀 Nutzung

### 1. Interface starten

Im Earth Engine Code Editor:
```js
var uiApp = require('users/jakobkoppermann/Ukraine_NDVIRep:ui/app');
```

### 2. Region, Vergleichsregion & Jahr auswählen

- Zielregion = Analysegebiet (z. B. `kherson`)
- Vergleichsregion = Referenzwert (z. B. `vinnytsia`)
- Jahr = 2022–2024

### 3. Modus wählen

- Häkchen bei *Live-Berechnung* → Berechnung direkt aus Rohdaten
- Kein Häkchen → prüft/verwendet gespeicherte Assets

### 4. Analyse starten

Per Klick auf `Run Analysis`:
- Bei Live-Modus sofortige Berechnung
- Bei Asset-Modus wird geprüft, ob alle NDVI-Assets vorhanden sind. Fehlende Assets werden automatisch exportiert (ca. 1–2 Stunden Wartezeit je nach GEE-Last).

---

## 🖼 Beispiel: NDVI-Anomalie in Cherson

```text
Region: kherson
Vergleich: vinnytsia
Jahr: 2023
Modus: Asset-basiert
→ Ausgabe: Z_Diff-Karte mit Visualisierung der landwirtschaftlichen Abweichung
```

---

## 📦 Asset-Struktur

- NDVI-Exporte:  
  `projects/ndvi-comparison-ukr/assets/ndvi_exports/NDVI_<region>_<year>`

- Z-Diff-Exports:  
  `projects/ndvi-comparison-ukr/assets/ZDIFF_<regionA>_minusMean_<regionB>_<year>`

- Frontlinien:  
  `projects/ndvi-comparison-ukr/assets/frontline_<year>-06-30`

---

## 🧠 Hinweise

- Z-Scores sind nur bei ausreichender Standardabweichung (`minStdDev = 0.01`) gültig.
- Für alle Regionen ist eine minimale Beobachtungsdichte im Mai–Juni Voraussetzung.
- Das Projekt ist erweiterbar: weitere Regionen, Frontlinien, Zeiträume.

---

## 📝 Autor

**Jakob Koppermann**  
Projektbeginn: 2024  
Fokus: Agrarproduktivität & Kriegsfolgen in der Ukraine