# 📁 Struktura Projektu ZielonaPlaneta

Kompleksowy przewodnik struktury katalogów i plików projektu.

## 🗂️ Przegląd katalogów

```
eco/
├── 📄 Pliki konfiguracyjne
│   ├── package.json              # Zależności i skrypty npm
│   ├── package-lock.json         # Zablokowane wersje zależności
│   └── .gitignore               # Pliki ignorowane przez Git
│
├── 🎯 Punkty wejścia aplikacji
│   ├── index.js                 # Interfejs CLI (node index.js <url>)
│   ├── server.js                # Serwer webowy (npm start)
│   └── utils.js                 # Funkcje pomocnicze (wyszukiwanie Chrome/Chromium)
│
├── 🌐 Interfejs webowy
│   └── public/
│       ├── index.html           # Strona główna HTML
│       ├── script.js            # JavaScript klienta (analiza, UI)
│       ├── styles.css           # Style CSS (skompilowane z SCSS)
│       └── styles.css.map       # Source map dla debugowania (w .gitignore)
│
├── 🎨 Źródła stylów (SCSS)
│   └── src/
│       └── styles/
│           ├── main.scss        # Główny plik - importuje wszystkie moduły
│           ├── _variables.scss  # Zmienne kolorów, czcionek, rozmiarów
│           ├── _mixins.scss     # Reutilizowalne mixiny
│           └── _icons.scss      # Definicje ikon SVG
│
├── 📊 Raporty analizy
│   └── reports/
│       ├── report-*.json        # Pojedyncze raporty stron
│       └── website-report-*.json # Zagregowane raporty witryn
│
├── 📚 Dokumentacja
│   ├── README.md                # Główny plik dokumentacji
│   ├── QUICK_START.md           # Szybki start dla nowych użytkowników
│   ├── FEATURES.md              # Lista funkcji i możliwości
│   ├── ARCHITECTURE.md          # Architektura systemu
│   ├── MULTI_PAGE_ANALYSIS.md   # Dokumentacja analizy wielu stron
│   ├── CHANGELOG.md             # Historia zmian
│   └── PROJECT_STRUCTURE.md     # Ten plik
│
├── 📦 Zależności (automatycznie tworzone)
│   └── node_modules/            # Zainstalowane pakiety npm
│
└── 🧪 Skrypty testowe
    └── test-multi-page.js       # Test funkcji analizy wielu stron (node test-multi-page.js)
```

## 📝 Pliki konfiguracyjne

### `package.json`

```json
{
  "main": "index.js",
  "scripts": {
    "start": "node server.js", // Uruchamia serwer webowy na porcie 3000
    "dev": "nodemon server.js", // Develop mode z automatycznym przeładowaniem
    "cli": "node index.js", // Uruchamia CLI (wymaga URL)
    "test": "node index.js https://example.com", // Test CLI
    "analyze": "node index.js", // Test CLI bez parametrów
    "build-css": "sass src/styles/main.scss public/styles.css --watch",
    "build-css-once": "sass src/styles/main.scss public/styles.css"
  }
}
```

## 🎯 Punkty wejścia

### `index.js` - Interfejs CLI

- **Przeznaczenie**: Analiza jednej lub więcej stron z linii poleceń
- **Użycie**: `node index.js <url1> <url2> ...`
- **Przykład**: `node index.js https://example.com https://google.com`
- **Wyjście**: Raporty JSON w folderze `reports/`

### `server.js` - Serwer webowy

- **Przeznaczenie**: Interfejs webowy i API REST
- **Port**: 3000 (lub następny dostępny port)
- **Routes**:
  - `GET /` - Interfejs webowy
  - `POST /api/analyze` - Analiza pojedynczej strony
  - `POST /api/analyze-multiple` - Analiza wielu stron
  - `GET /api/reports` - Lista raportów
  - `GET /api/website-reports` - Lista raportów witryn

### `utils.js` - Funkcje pomocnicze

- **getBrowserPath()** - Wyszukiwanie ścieżki do Chrome/Chromium
  - Windows: Szuka w `Program Files`
  - macOS: Szuka w `/Applications`
  - Linux: Użycie `which` do znalezienia

## 🌐 Interfejs webowy (`public/`)

### `index.html`

- Struktura HTML5
- Sekcje:
  - Nagłówek z logiem
  - Formularze wejścia (pojedynczy URL, wiele URL-i)
  - Wyświetlanie postępu
  - Wyświetlanie wyników
  - Historia raportów

### `script.js`

- Obsługa formularzy
- Komunikacja z API
- Wyświetlanie wyników
- Animacje i interakcje UI
- WebSocket (przyszłość)

### `styles.css`

- Skompilowany z `src/styles/main.scss`
- Responsive design
- Animacje i przejścia
- Ikony SVG inline

## 🎨 Style (`src/styles/`)

### `main.scss`

Importuje wszystkie moduły stylów:

```scss
@import "variables";
@import "mixins";
@import "icons";
// ... reszta stylów
```

### `_variables.scss`

Definiuje:

- Paleta kolorów (główny zielony, gradienty)
- Rozmiary (mobile, tablet, desktop)
- Czcionki i wielkości tekstu
- Breakpointy responsywne

### `_mixins.scss`

Reutilizowalne mixiny:

- `@mixin flexCenter` - Flex centering
- `@mixin card` - Style karty
- Media queries helpers

### `_icons.scss`

Inline ikony SVG:

- `icon-leaf`, `icon-search`, `icon-spinner`
- `icon-check`, `icon-chart-line`, itd.
- Animacje (spin, fade, pulse)

## 📊 Raporty (`reports/`)

### Struktura nazw plików

#### Raporty pojedynczych stron

```
report-{domain}-{timestamp}.json
```

Przykład: `report-example-com-2025-10-24T08-53-02-335Z.json`

#### Raporty witryn (zagregowane)

```
website-report-{domain}-{timestamp}.json
```

Przykład: `website-report-example-com-2025-10-24T19-51-32-537Z.json`

### Zawartość raportu

```json
{
  "domain": "example.com",
  "analyzedPages": 3,
  "successfulAnalyses": 3,
  "failedAnalyses": 0,
  "analyzedAt": "ISO8601",
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
    /* ... */
  ],
  "errors": [
    /* ... */
  ]
}
```

## 📚 Dokumentacja

| Plik                     | Przeznaczenie                               |
| ------------------------ | ------------------------------------------- |
| `README.md`              | Główna dokumentacja, szybki start, features |
| `QUICK_START.md`         | Konfiguracja i pierwsza uruchomienie        |
| `FEATURES.md`            | Lista i opis wszystkich funkcji             |
| `ARCHITECTURE.md`        | Diagram systemu, przepływ danych            |
| `MULTI_PAGE_ANALYSIS.md` | Szczegółowy przewodnik analizy wielu stron  |
| `CHANGELOG.md`           | Historia zmian i nowości                    |
| `PROJECT_STRUCTURE.md`   | Ten plik - struktura katalogów              |

## 🔧 Skrypty npm

```bash
# Uruchomienie
npm start          # Serwer na localhost:3000
npm run dev        # Develop mode z nodemon
npm run cli        # Interfejs CLI

# Kompilacja stylów
npm run build-css        # Watch mode - aktualizuje na bieżąco
npm run build-css-once   # Jednorazowa kompilacja

# Testowanie
npm test           # Test CLI
npm run analyze    # Test CLI bez parametrów

# Skrypt testowy
node test-multi-page.js  # Test API
```

## 🚀 Przepływ użytkownika

### Via Interfejs Webowy

```
1. npm start
   ↓
2. Otwórz http://localhost:3000
   ↓
3. Wklej URL
   ↓
4. Kliknij "Analizuj"
   ↓
5. Czekaj na wyniki (1-3 minuty)
   ↓
6. Wyświetl raport / Pobierz JSON
```

### Via CLI

```
1. node index.js https://example.com
   ↓
2. Czekaj na wyniki
   ↓
3. Plik raportu w reports/
```

### Via API

```
1. npm start
   ↓
2. curl -X POST http://localhost:3000/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}'
   ↓
3. Otrzymaj JSON response
```

## 📦 Zależności

### Production

- `puppeteer-core` - Automatyzacja przeglądarki
- `lighthouse` - Analiza wydajności
- `express` - Framework webowy
- `cors` - CORS middleware

### Development

- `nodemon` - Automatyczne przeładowanie
- `sass` - Kompilacja SCSS

## .gitignore

Ignorowane pliki:

```
node_modules/          # Zależności
reports/*.json         # Tymczasowe raporty
test-icons.html        # Plik testowy
public/styles.css.map  # Source map
.env                   # Zmienne środowiskowe
.DS_Store             # Pliki systemowe
*.log                 # Logi
```

## ✨ Best Practices

### Dodawanie nowych stylów

1. Edytuj pliki w `src/styles/`
2. Uruchom `npm run build-css` dla watch mode
3. Skompilowany plik to `public/styles.css`

### Dodawanie nowych endpointów API

1. Edytuj `server.js`
2. Uruchom `npm run dev` dla automatycznego przeładowania
3. Przetestuj via `curl` lub Postman

### Dodawanie nowych funkcji CLI

1. Edytuj `index.js`
2. Przetestuj: `node index.js <args>`

## 🔐 Bezpieczeństwo

- Puppeteer izoluje przeglądarkę
- Lighthouse jest read-only
- Brak przechowywania danych użytkownika
- CORS pozwala na dostęp z przeglądarki

---

**Ostatnia aktualizacja**: 24 października 2025
