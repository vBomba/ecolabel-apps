# 🌟 Funkcje - EcoLabel 2.0

## 📋 Zawartość

- [Nowe funkcje](#nowe-funkcje)
- [Ulepszenia](#ulepszenia)
- [Dokumentacja API](#dokumentacja-api)
- [Przykłady użycia](#przykłady-użycia)

---

## Nowe funkcje

### 🌐 Analiza wielu stron witryny

Analizuj **do 10 stron** jednej witryny jednocześnie i otrzymaj **jednolitą eco-label** dla całej witryny.

**Jak to działa:**

1. Wstawiasz listę adresów URL
2. System analizuje każdą stronę za pomocą Lighthouse
3. Agreguje wyniki
4. Wyświetla wspólną ocenę

**Zalety:**

- 🎯 Pełna ocena witryny (nie tylko strona główna)
- 📊 Porównanie wydajności między stronami
- 🏆 Jednolita eco-label dla całej witryny
- 📈 Szczegółowy raport ze wszystkimi szczegółami

### 🏆 System Eco-Label (A-F)

Każda witryna otrzymuje ocenę od **A** (Doskonałe) do **F** (Krytyczne):

```
A (80-100)  ████████████████████ Doskonałe
B (60-79)   ████████████░░░░░░░░ Dobrze
C (40-59)   ████████░░░░░░░░░░░░ Akceptowalnie
D (20-39)   ████░░░░░░░░░░░░░░░░ Słabo
F (0-19)    ░░░░░░░░░░░░░░░░░░░░ Krytycznie
```

### 📊 Zagregowane metryki

System oblicza dla każdej witryny:

| Metryka                | Opis                    | Co to oznacza                     |
| ---------------------- | ----------------------- | --------------------------------- |
| **Eco Score**          | Ogólna ocena            | 0-100 punktów                     |
| **Performance**        | Średnia wydajność       | Jak szybko ładują się strony      |
| **Total Bytes**        | Średni rozmiar          | Ile danych jest pobieranych       |
| **Bootup Time**        | Czas inicjalizacji JS   | Jak długo kod JS się inicjalizuje |
| **Green Hosting**      | Użycie energii          | Czy jest zielony hosting          |
| **Image Optimization** | Optymalizacja obrazów   | Czy obrazy są zoptymalizowane     |
| **CLS**                | Cumulative Layout Shift | Czy układ jest stabilny           |

### 📁 Raporty witryn

Każda analiza generuje szczegółowy raport:

```json
{
  "domain": "example.com",
  "analyzedPages": 3,
  "aggregatedEcoData": { ... },
  "ecoLabel": {
    "grade": "B",
    "label": "Good",
    "color": "#f39c12"
  },
  "pages": [
    {
      "url": "https://example.com/",
      "ecoData": { /* szczegóły strony */ }
    },
    // ... więcej stron
  ]
}
```

---

## Ulepszenia

### 🎨 Interfejs

- ✨ **Piękny UI** - minimalistyczny design z gradientami
- 🎯 **Textarea na adresy URL** - łatwe wklejenie kilku linków
- 📊 **Karty wyników** - piękne wyświetlanie wyników
- 🔄 **Pasek postępu** - widać postęp analizy w czasie rzeczywistym
- 📋 **Lista stron** - widać wynik każdej strony osobno

### ⚡ Wydajność

- 🚀 **Szybka analiza** - zoptymalizowana obsługa błędów
- 💾 **Pamięć podręczna wyników** - szybkie zapisywanie raportów
- 📡 **JSON API** - prosty dostęp do danych

### 🔒 Niezawodność

- ✅ **Obsługa błędów** - jeśli jakaś strona się nie ładuje, analiza trwa dalej
- 🛡️ **Walidacja** - sprawdzenie wszystkich adresów URL przed analizą
- 📊 **Wyniki częściowe** - zwrócenie danych nawet jeśli część adresów URL nie została przeanalizowana

---

## Dokumentacja API

### POST /api/analyze-multiple

Uruchom analizę wielu stron.

**Zapytanie:**

```bash
curl -X POST http://localhost:3000/api/analyze-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/",
      "https://example.com/about",
      "https://example.com/blog"
    ]
  }'
```

**Pomyślna odpowiedź (200):**

```json
{
  "success": true,
  "domain": "example.com",
  "analyzedPages": 3,
  "successfulAnalyses": 3,
  "failedAnalyses": 0,
  "aggregatedEcoData": {
    "ecoScore": 72,
    "performance": 70.2,
    "totalBytes": 2500000,
    "bootupTime": 1520,
    "hostingGreen": 0,
    "imageOptimization": 0,
    "cls": 0.075
  },
  "ecoLabel": {
    "grade": "B",
    "label": "Good",
    "color": "#f39c12"
  },
  "pages": [ ... ]
}
```

**Błąd (400):**

```json
{
  "error": "urls array is required and must contain at least one URL"
}
```

### GET /api/website-reports

Pobierz listę wszystkich raportów witryn.

**Zapytanie:**

```bash
curl http://localhost:3000/api/website-reports
```

**Odpowiedź:**

```json
[
  {
    "filename": "website-report-example-com-2025-10-24T20-00-00-000Z.json",
    "domain": "example.com",
    "ecoScore": 72,
    "ecoLabel": {
      "grade": "B",
      "label": "Good",
      "color": "#f39c12"
    },
    "analyzedPages": 3,
    "createdAt": "2025-10-24T20:00:00.000Z"
  }
]
```

### GET /api/website-reports/:filename

Pobierz pełny raport witryny.

**Zapytanie:**

```bash
curl http://localhost:3000/api/website-reports/website-report-example-com-2025-10-24T20-00-00-000Z.json
```

**Odpowiedź:** Pełny raport JSON

---

## Przykłady użycia

### Przykład 1: Witryna e-commerce

```javascript
const ecommerceUrls = [
  "https://shop.example.com/",
  "https://shop.example.com/products",
  "https://shop.example.com/product/iphone-15",
  "https://shop.example.com/cart",
  "https://shop.example.com/checkout",
];

const response = await fetch("http://localhost:3000/api/analyze-multiple", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ urls: ecommerceUrls }),
});

const result = await response.json();
console.log(`Wynik sklepu: ${result.aggregatedEcoData.ecoScore}`);
```

### Przykład 2: Witryna wielojęzyczna

```bash
# Analizujemy główną stronę + kilka postów
curl -X POST http://localhost:3000/api/analyze-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://news.example.com/",
      "https://news.example.com/article/breaking-news",
      "https://news.example.com/article/tech-update",
      "https://news.example.com/about"
    ]
  }'
```

### Przykład 3: Platforma SaaS

```python
import requests
import json

urls = [
    'https://app.example.com/',
    'https://app.example.com/pricing',
    'https://app.example.com/dashboard',
    'https://app.example.com/settings',
    'https://app.example.com/docs'
]

response = requests.post(
    'http://localhost:3000/api/analyze-multiple',
    json={'urls': urls},
    headers={'Content-Type': 'application/json'}
)

result = response.json()

print(f"Platforma: {result['domain']}")
print(f"Ocena Eco: {result['ecoLabel']['grade']}")
print(f"Wynik: {result['aggregatedEcoData']['ecoScore']}/100")
print(f"Wydajność: {result['aggregatedEcoData']['performance']}/100")

# Wyświetl wynik każdej strony
for i, page in enumerate(result['pages'], 1):
    print(f"\n{i}. {page['url']}")
    print(f"   Wynik: {page['ecoData']['ecoScore']}")
```

### Przykład 4: Porównanie konkurentów

```javascript
const competitors = {
  "https://competitor1.com/": "Konkurent 1",
  "https://competitor2.com/": "Konkurent 2",
  "https://competitor3.com/": "Konkurent 3",
};

const results = {};

for (const [url, name] of Object.entries(competitors)) {
  const response = await fetch("http://localhost:3000/api/analyze-multiple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: [url] }),
  });

  const result = await response.json();
  results[name] = result.aggregatedEcoData.ecoScore;
}

console.log("Analiza konkurencji:");
console.table(results);
```

---

## 📈 Statystyka

### Typowe wyniki

| Typ witryny | Eco Score | Ocena | Uwaga                                            |
| ----------- | --------- | ----- | ------------------------------------------------ |
| Startup     | 65-75     | B     | Dobra optymalizacja, ale jest miejsce na poprawę |
| Bank        | 60-70     | B     | Ciężkie, ale funkcjonalne                        |
| Blog        | 75-85     | A/B   | Zwykle szybkie                                   |
| E-Commerce  | 50-70     | B/C   | Zależy od rozmiaru katalogu                      |
| Wiadomości  | 70-80     | B     | Często dobrze zoptymalizowane                    |

### Czas analizy

| Liczba adresów URL | Orientacyjny czas |
| ------------------ | ----------------- |
| 1                  | ~50 sek           |
| 3                  | ~2-3 min          |
| 5                  | ~4-5 min          |
| 10                 | ~8-10 min         |

---

## 🚀 Perspektywy rozwoju

### Zaplanowano na kolejne wersje

- [ ] Analiza równoległa adresów URL
- [ ] Pamięć podręczna wyników
- [ ] Eksport raportów PDF
- [ ] Planowanie regularnych analiz
- [ ] Integracja ze Slack/Teams
- [ ] Wykresy trendów
- [ ] Porównanie z konkurentami

---

**🌿 Dziękujemy za korzystanie z EcoLabel do analizy ekologiczności Twoich witryn!**
