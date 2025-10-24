# 🌱 EcoLabel - Analiza ekologiczności stron internetowych

Nowoczesny interfejs webowy do analizy ekologiczności stron internetowych wykorzystujący Lighthouse i własny algorytm EcoScore.

## 🚀 Szybki start

### 1. Instalacja zależności

```bash
npm install
```

### 2. ⚙️ Konfiguracja na Windowsie

Projekt używa `puppeteer-core`, co oznacza, że musisz zainstalować Chrome lub Chromium oddzielnie:

**Opcja A: Google Chrome (rekomendowane)**

1. Pobierz ze strony: https://www.google.com/chrome
2. Zainstaluj w domyślnym miejscu: `C:\Program Files\Google\Chrome\Application\chrome.exe`
3. Aplikacja automatycznie znajdzie Chrome

**Opcja B: Chromium (darmowe)**

1. Pobierz ze strony: https://www.chromium.org/getting-involved/download-chromium
2. Rozpakuj do: `C:\Program Files\Chromium\Application\`
3. Aplikacja automatycznie znajdzie Chromium

**Opcja C: Własna ścieżka**
Ustaw zmienną środowiskową (jeśli Chrome jest zainstalowany w innym miejscu):

```bash
set CHROME_PATH=C:\path\to\chrome.exe
```

### 3. Kompilacja stylów SCSS

```bash
npm run build-css-once
```

### 4. Uruchomienie serwera webowego

```bash
npm start
```

### 5. Otwarcie w przeglądarce

Przejdź na http://localhost:3000

## 📋 Funkcjonalność

### ✨ Główne możliwości

- **Wprowadzanie URL** - prosty interfejs do wprowadzania URL strony
- **Postęp analizy** - wizualne śledzenie etapów analizy
- **Szczegółowe wyniki** - pełny raport z EcoScore i metrykami
- **Rekomendacje** - konkretne porady do poprawy
- **Pobieranie raportów** - możliwość zapisania wyników analizy

### 🎯 Analizowane metryki

- **EcoScore** - ogólna ocena ekologiczności (0-100)
- **Wydajność** - ocena szybkości ładowania
- **Rozmiar strony** - całkowity rozmiar zasobów
- **Czas ładowania** - czas wykonania JavaScript
- **Zielony hosting** - wykorzystanie energii odnawialnej
- **Optymalizacja obrazów** - efektywność obrazów
- **CLS** - Cumulative Layout Shift

## 🛠️ Stack technologiczny

### Frontend

- **HTML5** - semantyczna struktura
- **SCSS** - nowoczesne style z zmiennymi i mixinami
- **Vanilla JavaScript** - bez zależności
- **Lokalne ikony SVG** - zamiast Font Awesome

### Backend

- **Node.js** - platforma serwerowa
- **Express.js** - framework webowy
- **Puppeteer Core** - automatyzacja przeglądarki (wymaga oddzielnej instalacji Chrome/Chromium)
- **Lighthouse** - analiza wydajności

## 📁 Struktura projektu

```
eco/
├── public/                 # Interfejs webowy
│   ├── index.html         # Strona główna
│   ├── styles.css         # Skompilowane style
│   └── script.js          # JavaScript klienta
├── src/                   # Źródła SCSS
│   └── styles/
│       ├── main.scss      # Główny plik SCSS
│       ├── _variables.scss # Zmienne
│       ├── _mixins.scss   # Mixiny
│       └── _icons.scss    # Lokalne ikony
├── reports/               # Raporty analizy
├── server.js              # Serwer webowy
├── index.js               # Wersja CLI
└── package.json           # Zależności
```

👉 **Pełna dokumentacja struktury**: Zapoznaj się z [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) aby dowiedzieć się więcej o organizacji projektu.

## 🎨 Design

### Paleta kolorów

- **Główny**: Zielony gradient (#4CAF50 → #2E7D32)
- **Tło**: Niebiesko-fioletowy gradient
- **Karty**: Półprzezroczyste białe z rozmyciem

### Responsywność

- Urządzenia mobilne (320px+)
- Tablety (768px+)
- Desktop (1200px+)

## 🔧 API Endpoints

### POST /api/analyze

Analiza strony internetowej

```json
{
  "url": "https://example.com"
}
```

### GET /api/reports

Pobierz listę raportów

### GET /api/reports/:filename

Pobierz konkretny raport

## 📊 System oceniania

### EcoScore (0-100)

- **A (80-100)**: Doskonała efektywność ekologiczna
- **B (60-79)**: Dobra efektywność z niewielkimi poprawkami
- **C (40-59)**: Zadowalająca z umiarkowanymi poprawkami
- **D (20-39)**: Wymaga znaczących poprawek
- **F (0-19)**: Krytyczne problemy

### Algorytm obliczania

```
EcoScore = Wydajność × 0.4 +
           ZnormalizowaneBajty × 0.2 +
           ZnormalizowanyBootup × 0.15 +
           ZielonyHosting × 0.1 +
           OptymalizacjaObrazów × 0.1 +
           ZnormalizowanyCLS × 0.05
```

## 🚀 Komendy

```bash
# Uruchomienie serwera webowego
npm start

# Rozwój z automatycznym przeładowaniem
npm run dev

# Wersja CLI
npm run cli

# Kompilacja stylów SCSS
npm run build-css

# Jednorazowa kompilacja stylów
npm run build-css-once

# Testowanie
npm test
```

## 🌍 Korzyści ekologiczne

- **Zmniejszenie zużycia energii** - optymalizacja stron internetowych
- **Poprawa wydajności** - szybsze ładowanie
- **Zielony hosting** - wsparcie energii odnawialnej
- **Efektywność zasobów** - minimalizacja wykorzystania

## 🔮 Przyszłe ulepszenia

- [ ] Rzeczywisty postęp analizy przez WebSockets
- [ ] Porównywanie stron
- [ ] Historia analiz
- [ ] Eksport raportów do PDF
- [ ] Tryb ciemny
- [ ] Wielojęzyczność

## 📝 Licencja

MIT License - zobacz plik LICENSE dla szczegółów.

## 👥 Autor

**vBomba** - Deweloper EcoLabel

---

🌱 **EcoLabel** - Analiza ekologiczności stron internetowych dla lepszej przyszłości!

## 🆕 Nowa Funkcjonalność: Analiza Wielu Stron Serwisu

### O Funkcji

EcoLabel teraz obsługuje analizę **kilku stron jednego serwisu** jednocześnie. Pozwala to na:

- 📊 Analizę wielu URL-i z tego samego serwisu
- 🏆 Wyznaczenie **wspólnej etykiety ekologiczności** dla całego serwisu
- 📈 Porównanie wydajności między stronami
- 📄 Pobranie ujednoliconego raportu

### Jak Używać

#### Via Web UI

1. Przewiń w dół do sekcji **"🌐 Analiza wielu stron serwisu"**
2. Wklej adresy URL (jeden na linię, maksymalnie 10)
3. Kliknij **"Analizuj wiele stron"**
4. Czekaj na wyniki

Przykład:

```
https://www.example.com/
https://www.example.com/about
https://www.example.com/services
```

#### Via API

**Endpoint:** `POST /api/analyze-multiple`

**Request:**

```json
{
  "urls": [
    "https://www.example.com/",
    "https://www.example.com/page1",
    "https://www.example.com/page2"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "domain": "example.com",
  "analyzedPages": 3,
  "successfulAnalyses": 3,
  "failedAnalyses": 0,
  "analyzedAt": "2025-10-24T19:30:00.000Z",
  "aggregatedEcoData": {
    "ecoScore": 72,
    "performance": 65.4,
    "totalBytes": 2048576,
    "bootupTime": 1250,
    "hostingGreen": 0,
    "imageOptimization": 0,
    "cls": 0.05
  },
  "ecoLabel": {
    "grade": "B",
    "label": "Good",
    "color": "#f39c12"
  },
  "pages": [
    {
      "url": "https://www.example.com/",
      "ecoData": {
        /* ... */
      }
    }
    /* ... more pages ... */
  ],
  "errors": [] // jeśli były
}
```

### Dostęne Endpoints

#### Analiza Wielu Stron

- **POST** `/api/analyze-multiple` - Analizuje wiele stron jednego serwisu

#### Raporty Serwisów

- **GET** `/api/website-reports` - Lista wszystkich raportów serwisów
- **GET** `/api/website-reports/:filename` - Pobiera szczegółowy raport serwisu

### Eco-Label Grading

| Grade | Ocena     | Zakres | Kolor           |
| ----- | --------- | ------ | --------------- |
| A     | Excellent | 80-100 | Zielony         |
| B     | Good      | 60-79  | Żółty           |
| C     | Fair      | 40-59  | Pomarańczowy    |
| D     | Poor      | 20-39  | Czerwony        |
| F     | Critical  | 0-19   | Ciemna czerwień |

### Algorytm Agregacji

Wynikowa etyketa serwisu jest obliczana na podstawie **średnich wartości** z wszystkich analizowanych stron:

```javascript
aggregatedEcoData = {
  ecoScore: ŚREDNIA(wszystkie eco scores),
  performance: ŚREDNIA(wszystkie performance scores),
  totalBytes: ŚREDNIA(rozmiary stron),
  bootupTime: ŚREDNIA(czasy bootup),
  hostingGreen: 100 jeśli WSZYSTKIE strony mają green hosting, 0 inaczej,
  imageOptimization: 100 jeśli WSZYSTKIE strony mają optymalizacje, 0 inaczej,
  cls: ŚREDNIA(CLS wartości)
}
```

### CLI Test

Możesz przetestować funkcjonalność z linii poleceń:

```bash
node test-multi-page.js
```

Skrypt przetestuje analizę przykładowej witryny i wyświetli sformatowany raport.

### Ograniczenia

- Maksymalnie **10 URL-i** per żądanie
- URLs muszą być prawidłowe (zaczynać się od `http://` lub `https://`)
- Każda analiza trwa ~2-3 minuty w zależności od rozmiaru strony

### Struktura Raportu

Raporty są zapisywane z nazwą: `website-report-{domain}-{timestamp}.json`

Przykład: `website-report-example-com-2025-10-24T19-21-43-886Z.json`

### Rekomendacje do Poprawy

Na podstawie zagregowanych wyników, system sugeruje:

- Optymalizację wydajności strony
- Zmniejszenie rozmiaru zasobów
- Poprawę czasu ładowania
- Przejście na green hosting
- Optymalizację obrazów
- Redukcję Cumulative Layout Shift
