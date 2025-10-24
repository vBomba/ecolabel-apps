# 🚀 Szybki Start - Analiza Wielu Stron

## Instalacja

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom serwer
npm start

# 3. Otwórz przeglądarkę
# http://localhost:3000
```

## Korzystanie z interfejsu sieciowego

1. Przejdź na http://localhost:3000
2. Znajdź sekcję **"🌐 Analiza wielu stron witryny"**
3. Wklej adresy URL (jeden na linię):

```
https://www.example.com/
https://www.example.com/about
https://www.example.com/services
```

4. Kliknij **"Analizuj wiele stron"**
5. Czekaj na wyniki (~2-3 minuty)

## Testowanie z interfejsu wiersza poleceń

```bash
# Uruchom skrypt testowy
node test-multi-page.js
```

Skrypt przeanalizuje przykładową witrynę (example.com) i wyświetli ładny raport.

## Przykłady API

### cURL

```bash
curl -X POST http://localhost:3000/api/analyze-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.example.com/",
      "https://www.example.com/page1",
      "https://www.example.com/page2"
    ]
  }'
```

### JavaScript

```javascript
const urls = [
  "https://www.example.com/",
  "https://www.example.com/about",
  "https://www.example.com/blog",
];

const response = await fetch("http://localhost:3000/api/analyze-multiple", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ urls }),
});

const result = await response.json();
console.log(`Domena: ${result.domain}`);
console.log(`Wynik: ${result.aggregatedEcoData.ecoScore}`);
console.log(`Ocena: ${result.ecoLabel.grade}`);
```

### Python

```python
import requests

urls = [
    'https://www.example.com/',
    'https://www.example.com/page1'
]

response = requests.post(
    'http://localhost:3000/api/analyze-multiple',
    json={'urls': urls}
)

result = response.json()
print(f"Domena: {result['domain']}")
print(f"Wynik: {result['aggregatedEcoData']['ecoScore']}")
print(f"Ocena: {result['ecoLabel']['grade']}")
```

## Dostępne punkty końcowe API

### Analiza

- `POST /api/analyze` - Analizuj jedną stronę
- `POST /api/analyze-multiple` - Analizuj wiele stron

### Raporty

- `GET /api/reports` - Lista wszystkich raportów stron
- `GET /api/reports/:filename` - Konkretny raport strony
- `GET /api/website-reports` - Lista raportów witryn
- `GET /api/website-reports/:filename` - Konkretny raport witryny

## Przykładowy wynik

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
  "pages": [
    {
      "url": "https://www.example.com/",
      "ecoData": {
        /* ... */
      }
    }
    // ... więcej stron
  ]
}
```
