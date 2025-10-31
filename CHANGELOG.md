# 📝 Dziennik Zmian - Wersja 2.0

## 🎉 Nowa Funkcja: Analiza Wielu Stron Witryny

### ✨ Co się zmieniło

#### 🔧 Backend (server.js)

**Nowe funkcje:**

- `aggregateEcoScores()` - agreguje wyniki analizy wielu stron
- `getEcoLabel()` - określa eco-label (A-F) na podstawie wyniku

**Nowe trasy API:**

- **POST** `/api/analyze-multiple` - analizuje do 10 adresów URL jednej witryny
- **GET** `/api/website-reports` - lista wszystkich raportów witryn
- **GET** `/api/website-reports/:filename` - pobierz szczegółowy raport witryny

**Ulepszenia:**

- Obsługa błędów dla poszczególnych adresów URL
- Zwracanie wyników częściowych
- Zapisywanie zagregowanych raportów

#### 🎨 Frontend (public/script.js)

**Nowe funkcje:**

- `startMultiPageAnalysis()` - rozpoczyna analizę wielu stron
- `performMultiPageAnalysis()` - wykonuje zapytanie do API
- `showMultiPageResults()` - wyświetla wyniki
- `createPagesContainer()` - tworzy kontener na listę stron

**Ulepszenia:**

- Walidacja adresów URL
- Obsługa błędów
- Pasek postępu dla analizy wielu stron

#### 🎨 HTML (public/index.html)

**Nowe elementy:**

- Sekcja "🌐 Analiza wielu stron witryny"
- Textarea do wprowadzania adresów URL
- Przycisk "Analizuj wiele stron"
- Kontener do wyświetlania wyników dla każdej strony

#### 🎨 CSS (public/styles.css)

**Nowe style:**

- `.multi-page-section` - style sekcji analizy
- `.input-wrapper-multi` - style textarea
- `.pages-list` - style listy stron
- `.page-result` - style wyniku strony
- `.page-number`, `.page-url`, `.page-score` - komponenty wyników

#### 📚 Dokumentacja

**Nowe pliki:**

- `MULTI_PAGE_ANALYSIS.md` - szczegółowy przewodnik
- `QUICK_START.md` - szybki start
- `ARCHITECTURE.md` - architektura systemu
- `CHANGELOG.md` - ten plik

**Zaktualizowane pliki:**

- `README.md` - dodana informacja o nowej funkcji

#### 🧪 Testowanie

**Nowy plik:**

- `test-multi-page.js` - skrypt testowy do testowania z wiersza poleceń

### 📊 Szczegóły techniczne

#### System Eco-Label

| Ocena | Zakres | Opis          |
| ----- | ------ | ------------- |
| A     | 80-100 | Doskonale     |
| B     | 60-79  | Dobrze        |
| C     | 40-59  | Akceptowalnie |
| D     | 20-39  | Słabo         |
| F     | 0-19   | Krytycznie    |

#### Agregacja metryk

```javascript
{
  ecoScore: ŚREDNIA(wszystkie wyniki),
  performance: ŚREDNIA(wszystkie wyniki wydajności),
  totalBytes: ŚREDNIA(wszystkie rozmiary),
  bootupTime: ŚREDNIA(wszystkie czasy),
  hostingGreen: 100 jeśli WSZYSTKIE strony mają zielony hosting,
  imageOptimization: 100 jeśli WSZYSTKIE strony są zoptymalizowane,
  cls: ŚREDNIA(wszystkie wartości CLS)
}
```

#### Ograniczenia

- Maksymalnie **10 adresów URL** na żądanie
- Każda strona jest analizowana **40-60 sekund**
- W przypadku 3 stron spodziewaj się **2-3 minuty**

### 🚀 Jak używać

#### Za pośrednictwem interfejsu sieciowego

1. Otwórz http://localhost:3000
2. Znajdź "🌐 Analiza wielu stron witryny"
3. Wklej adresy URL (jeden na linię)
4. Kliknij "Analizuj"

#### Za pośrednictwem API

```bash
curl -X POST http://localhost:3000/api/analyze-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.example.com/",
      "https://www.example.com/page1"
    ]
  }'
```

### 📁 Struktura raportu

Raporty są zapisywane jako: `website-report-{domain}-{timestamp}.json`

Przykład: `website-report-example-com-2025-10-24T19-21-43-886Z.json`

**Struktura:**

```json
{
  "domain": "example.com",
  "analyzedPages": 3,
  "successfulAnalyses": 3,
  "failedAnalyses": 0,
  "aggregatedEcoData": { ... },
  "ecoLabel": { "grade": "B", "label": "Good", "color": "#f39c12" },
  "pages": [ ... ],
  "errors": [ ]
}
```

### ✅ Przetestowane scenariusze

- ✅ Analiza 3 stron przykładowej witryny
- ✅ Obsługa błędów dla niedostępnych adresów URL
- ✅ Walidacja liczby adresów URL (maks 10)
- ✅ Agregacja wyników
- ✅ Generowanie eco-label
- ✅ Zapisywanie raportów
- ✅ Pobieranie raportów za pośrednictwem API

### 🐛 Znane problemy

- Niektóre witryny mogą blokować automatyczne sprawdzenia
- Analiza wymaga czasu - cierpliwość jest niezbędna
- Dynamiczna zawartość może wymagać więcej czasu ładowania

### 🔄 Co dalej?

#### Planowane na przyszłe wersje

1. **Analiza równoległa** - uruchamianie wielu adresów URL jednocześnie
2. **Pamięć podręczna wyników** - przechowywanie wyników do szybkich powtórnych zapytań
3. **Eksport PDF** - generowanie ładnych raportów PDF
4. **Planowanie** - uruchamianie analizy zgodnie z harmonogramem
5. **Webhooki** - powiadomienia o wynikach

### 💬 Opinia

Jeśli masz:

- 🐛 Błędy - otwórz problem
- 💡 Pomysły - omów w dyskusjach
- 📧 Pytania - skontaktuj się z zespołem

---

## Wersja 1.0 (Poprzednia)

- Podstawowa analiza jednej strony
- Obliczenie eco-score
- Integracja Lighthouse
- Interfejs sieciowy do analizy
- API dla jednej strony

---

**Dziękujemy za korzystanie z ZielonaPlaneta! 🌿**
