# 🏗️ Architektura - Analiza Wielu Stron

## 📊 Przegląd systemu

```
┌─────────────────────────────────────────────────────┐
│                    Interfejs sieciowy              │
│  - Wprowadzanie adresów URL (jeden na linię)       │
│  - Wyświetlanie wyników                            │
│  - Pobieranie raportów                             │
└─────────────┬───────────────────────────────────────┘
              │
              │ POST /api/analyze-multiple
              ▼
┌─────────────────────────────────────────────────────┐
│            Serwer API (Express)                      │
│  - Walidacja adresów URL                           │
│  - Zarządzanie analizą                             │
│  - Agregacja wyników                               │
└─────────────┬───────────────────────────────────────┘
              │
              ├─► Puppeteer (przeglądarka)
              │   - Ładuje każdą stronę
              │   - Ustawia viewport
              │   - Obsługuje przekierowania
              │
              └─► Lighthouse API
                  - Analizuje wydajność
                  - Zbiera metryki
                  - Generuje raporty
```

## 📁 Struktura plików

```
eco/
├── server.js                    # 🔧 Główny serwer API
│   ├── aggregateEcoScores()     # Funkcja agregacji wyników
│   ├── getEcoLabel()            # Określenie eco-label
│   ├── POST /api/analyze-multiple
│   ├── GET /api/website-reports
│   └── GET /api/website-reports/:filename
│
├── public/
│   ├── index.html               # Interfejs sieciowy
│   ├── script.js                # 🆕 Funkcjonalność analizy wielu stron
│   └── styles.css               # 🆕 Style analizy wielu stron
│
├── test-multi-page.js           # 🆕 Skrypt testowy
├── MULTI_PAGE_ANALYSIS.md       # 🆕 Szczegółowy przewodnik
├── QUICK_START.md               # 🆕 Szybki start
└── ARCHITECTURE.md              # 📄 Ten plik
```

## 🔄 Proces analizy

### Krok 1: Walidacja zapytania

```javascript
POST /api/analyze-multiple
├── Sprawdzić obecność tablicy urls
├── Sprawdzić liczbę (1-10)
└── Sprawdzić poprawność każdego adresu URL
```

### Krok 2: Sekwencyjna analiza stron

```javascript
for each URL:
├── Uruchomić Puppeteer z tym adresem URL
├── Ustawić viewport (1920x1080)
├── Załadować stronę
├── Czekać na dynamiczną zawartość (3s)
├── Uruchomić analizę Lighthouse
├── Obliczyć eco-score
└── Zapisać wyniki
```

### Krok 3: Agregacja wyników

```javascript
aggregateEcoScores([
  { ecoScore: 75, performance: 72, ... },
  { ecoScore: 68, performance: 65, ... },
  { ecoScore: 73, performance: 71, ... }
])

Wynik:
{
  ecoScore: 72,           // ŚREDNIA
  performance: 69.3,      // ŚREDNIA
  totalBytes: 2500000,    // ŚREDNIA
  hostingGreen: 0,        // 100 jeśli WSZYSTKIE mają
  imageOptimization: 0,   // 100 jeśli WSZYSTKIE mają
  cls: 0.075              // ŚREDNIA
}
```

### Krok 4: Określenie Eco-Label

```javascript
getEcoLabel(72)
└── grade: "B"
    label: "Good"
    color: "#f39c12"
```

### Krok 5: Zapisanie raportu

```
reports/
└── website-report-{domain}-{timestamp}.json
    ├── aggregatedEcoData
    ├── ecoLabel
    ├── pages[]
    └── errors[]
```

## 💾 Struktura danych

### Zapytanie

```typescript
interface AnalyzeMultipleRequest {
  urls: string[]; // 1-10 adresów URL
}
```

### Odpowiedź

```typescript
interface AnalyzeMultipleResponse {
  success: boolean;
  domain: string;
  analyzedPages: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  analyzedAt: ISO8601Date;

  aggregatedEcoData: {
    ecoScore: number;
    performance: number;
    totalBytes: number;
    bootupTime: number;
    hostingGreen: number; // 0 lub 100
    imageOptimization: number; // 0 lub 100
    cls: number;
  };

  ecoLabel: {
    grade: "A" | "B" | "C" | "D" | "F";
    label: string;
    color: string; // Kolor HEX
  };

  pages: PageAnalysis[];
  errors?: AnalysisError[];
}

interface PageAnalysis {
  url: string;
  ecoData: EcoData;
}

interface AnalysisError {
  url: string;
  error: string;
}
```

## 🔧 Kluczowe funkcje

### 1. aggregateEcoScores()

```javascript
function aggregateEcoScores(ecoScoresArray) {
  // Oblicza ŚREDNIE wartości dla większości metryk
  // Dla hostingGreen i imageOptimization:
  // - 100 jeśli WSZYSTKIE strony mają to
  // - 0 inaczej
}
```

### 2. getEcoLabel()

```javascript
function getEcoLabel(ecoScore) {
  // A:  80-100 (Doskonałe)
  // B:  60-79  (Dobrze)
  // C:  40-59  (Akceptowalnie)
  // D:  20-39  (Słabo)
  // F:  0-19   (Krytycznie)
}
```

### 3. saveAndAnalyzeReport()

```javascript
function saveAndAnalyzeReport(report, url) {
  // Zapisuje raport lighthouse
  // Oblicza eco-score
  // Zwraca ecoData
}
```

## 🌐 Punkty końcowe API

### POST /api/analyze-multiple

**Przeznaczenie:** Uruchomić analizę wielu stron

**Wejście:**

```json
{ "urls": ["https://...", "https://..."] }
```

**Wyjście:**

```json
{
  "success": true,
  "domain": "example.com",
  "aggregatedEcoData": { ... },
  "ecoLabel": { ... },
  "pages": [ ... ]
}
```

**Błędy:**

- 400: Nieprawidłowe żądanie (brakuje urls, zbyt wiele urls)
- 500: Analiza nie powiodła się

### GET /api/website-reports

**Przeznaczenie:** Lista wszystkich raportów witryn

**Wyjście:**

```json
[
  {
    "filename": "website-report-example-com-...",
    "domain": "example.com",
    "ecoScore": 72,
    "ecoLabel": { "grade": "B", ... },
    "analyzedPages": 3,
    "createdAt": "2025-10-24T..."
  }
]
```

### GET /api/website-reports/:filename

**Przeznaczenie:** Pobierz pełny raport witryny

**Wyjście:** Pełny raport JSON ze wszystkimi szczegółami

## 🎨 Komponenty frontendu

### Sekcja wielostrony analizy

```html
<div class="multi-page-section">
  <textarea id="multi-urls-input"></textarea>
  <button id="analyze-multi-btn">Analizuj</button>
</div>
```

### Wyniki analizy

```html
<div id="results-section">
  <!-- Karta eco-score -->
  <!-- Metryki -->
  <!-- Lista stron z wynikami -->
  <div id="pages-list">
    <!-- Generowane dynamicznie -->
  </div>
</div>
```

## 🔐 Bezpieczeństwo

### Walidacja adresów URL

- Sprawdzenie składni adresu URL
- Sprawdzenie protokołu (http/https)
- Ograniczenie do 10 adresów URL
- Sprawdzenie dostępności serwera

### Obsługa błędów

- Indywidualna obsługa błędów dla każdego adresu URL
- Zwracanie wyników częściowych jeśli niektóre adresy URL nie zostaną przeanalizowane
- Szczegółowe rejestrowanie błędów

## 📊 Obliczanie Eco-Score

```javascript
ecoScore =
  performance * 0.4 +                           // 40%
  normalizeScore(totalBytes, 0, 1M) * 0.2 +    // 20%
  normalizeScore(bootupTime, 0, 1000) * 0.15 + // 15%
  hostingGreen * 0.1 +                         // 10%
  imageOptimization * 0.1 +                    // 10%
  normalizeScore(cls, 0, 0.25) * 0.05          // 5%
```

## ⏱️ Wymagania czasowe

| Operacja           | Czas      |
| ------------------ | --------- |
| Załadowanie strony | ~5s       |
| Analiza Lighthouse | ~35-55s   |
| Razem na stronę    | ~40-60s   |
| Na 3 strony        | ~2-3 min  |
| Na 10 stron        | ~7-10 min |

## 🛠️ Rozszerzenia

### Możliwe ulepszenia

1. **Analiza równoległa** - równoczesna analiza wielu adresów URL
2. **Pamięć podręczna wyników** - przechowywanie wyników do szybkich powtórnych zapytań
3. **Planowanie analizy** - uruchamianie w tle zgodnie z harmonogramem
4. **Porównanie trendów** - śledzenie zmian eco-score w czasie
5. **Eksport raportów** - formaty PDF, CSV, Excel
6. **Integracja Webhook** - powiadomienia o wynikach

---

**Architektura została stworzona z myślą o skalowalności i niezawodności! 🌿**
