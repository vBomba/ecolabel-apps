# 🌐 Analiza Wielu Stron - Przewodnik Użytkownika

## 📋 Zawartość

1. [Wstęp](#wstęp)
2. [Jak zacząć](#jak-zacząć)
3. [Dokumentacja API](#dokumentacja-api)
4. [Przykłady użycia](#przykłady-użycia)
5. [Zrozumienie wyników](#zrozumienie-wyników)
6. [Często zadawane pytania](#często-zadawane-pytania)

---

## Wstęp

### Co to jest?

**Analiza wielu stron** pozwala na jednorazową analizę **do 10 stron** z jednej witryny oraz otrzymanie **jedynej eco-label** dla całej witryny.

Zamiast analizować każdą stronę osobno, system:

- Analizuje wszystkie adresy URL
- Agreguje wyniki
- Wydaje jednolitą ocenę dla całej witryny

### Po co to potrzebne?

- 🎯 **Pełna ocena witryny** - nie tylko strona główna
- 📊 **Porównanie stron** - sprawdzenie, które strony są wolniejsze
- 🏆 **Jednolita etykieta** - zrozumienie ogólnego stanu witryny
- 📈 **Całościowy obraz** - identyfikacja obszarów wymagających poprawy

---

## Jak zacząć

### Metoda 1: Interfejs sieciowy

1. Otwórz aplikację EcoLabel w przeglądarce
2. Znajdź sekcję **"🌐 Analiza wielu stron witryny"**
3. Wklej adresy URL (jeden na linię):

```
https://www.example.com/
https://www.example.com/about
https://www.example.com/services
https://www.example.com/contact
```

4. Kliknij **"Analizuj wiele stron"**
5. Czekaj na ukończenie analizy

### Metoda 2: API (Programowo)

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

### Metoda 3: Skrypt Node.js

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
console.log(`Eco Score: ${result.aggregatedEcoData.ecoScore}`);
console.log(`Ocena: ${result.ecoLabel.grade}`);
```

---

## Dokumentacja API

### POST /api/analyze-multiple

Analizuje wiele adresów URL i zwraca zagregowany wynik.

#### Parametry

```json
{
  "urls": ["string (URL)", "..."]
}
```

**Wymogi:**

- `urls` - tablica (obowiązkowa)
- Od 1 do 10 adresów URL
- Wszystkie adresy URL muszą być prawidłowe

#### Odpowiedź (200 OK)

```json
{
  "success": true,
  "domain": "example.com",
  "analyzedPages": 3,
  "successfulAnalyses": 3,
  "failedAnalyses": 0,
  "analyzedAt": "2025-10-24T20:00:00.000Z",

  "aggregatedEcoData": {
    "ecoScore": 75,
    "performance": 72.5,
    "totalBytes": 2500000,
    "bootupTime": 1500,
    "hostingGreen": 0,
    "imageOptimization": 0,
    "cls": 0.08
  },

  "ecoLabel": {
    "grade": "B",
    "label": "Good",
    "color": "#f39c12"
  },

  "pages": [
    {
      "url": "https://example.com/",
      "ecoData": {
        /* szczegóły strony */
      }
    }
    // ... pozostałe strony
  ]
}
```

#### Kody błędów

| Kod | Błąd                          | Rozwiązanie                    |
| --- | ----------------------------- | ------------------------------ |
| 400 | `urls array is required`      | Przekaż tablicę adresów URL    |
| 400 | `Maximum 10 URLs per request` | Zmniejsz liczbę URL do 10      |
| 500 | `Failed to analyze any URLs`  | Sprawdź dostępność adresów URL |

### GET /api/website-reports

Pobierz listę wszystkich utworzonych raportów dla witryn.

#### Odpowiedź

```json
[
  {
    "filename": "website-report-example-com-2025-10-24T19-21-43-886Z.json",
    "domain": "example.com",
    "ecoScore": 68,
    "ecoLabel": {
      "grade": "B",
      "label": "Good",
      "color": "#f39c12"
    },
    "analyzedPages": 3,
    "createdAt": "2025-10-24T19:21:43.886Z"
  }
]
```

### GET /api/website-reports/:filename

Pobierz pełny raport dla konkretnej witryny.

#### Parametry

- `filename` - nazwa pliku raportu

#### Odpowiedź

Pełny raport JSON ze szczegółami wszystkich przeanalizowanych stron

---

## Przykłady użycia

### Przykład 1: Analiza witryny e-commerce

```javascript
const ecommerceSite = [
  "https://shop.example.com/", // Strona główna
  "https://shop.example.com/products", // Katalog
  "https://shop.example.com/product/123", // Karta produktu
  "https://shop.example.com/cart", // Koszyk
  "https://shop.example.com/checkout", // Checkout
];

// Wynik: jednolita ocena dla całego sklepu
```

### Przykład 2: Analiza wielojęzycznej witryny

```javascript
const multilingualSite = [
  "https://example.com/", // English
  "https://example.com/de/", // Deutsch
  "https://example.com/fr/", // Français
  "https://example.com/es/", // Español
];

// Wynik: średnia ocena dla wszystkich wersji językowych
```

### Przykład 3: Analiza bloga

```javascript
const blogPages = [
  "https://blog.example.com/",
  "https://blog.example.com/post1",
  "https://blog.example.com/post2",
  "https://blog.example.com/about",
];

// Wynik: ocena wszystkich popularnych stron bloga
```

---

## Zrozumienie wyników

### Skala Eco-Label

| Ocena | Zakres | Opis                    |
| ----- | ------ | ----------------------- |
| **A** | 80-100 | Doskonała ekologiczność |
| **B** | 60-79  | Dobra ekologiczność     |
| **C** | 40-59  | Zadowalająca            |
| **D** | 20-39  | Słaba                   |
| **F** | 0-19   | Krytyczna               |

### Zagregowane metryki

- **ecoScore** - ogólna ocena (0-100)
- **performance** - średnia wydajność
- **totalBytes** - średni rozmiar strony
- **bootupTime** - średni czas ładowania JS
- **hostingGreen** - 100 jeśli WSZYSTKIE strony mają zielony hosting
- **imageOptimization** - 100 jeśli WSZYSTKIE strony są zoptymalizowane
- **cls** - średni Cumulative Layout Shift

### Przykładowy wynik

```
📊 EXAMPLE.COM - Raport witryny
════════════════════════════════

🏆 ECO-LABEL: B - Good (Wynik: 72/100)
Przeanalizowano 3 strony 2025-10-24 20:30 UTC

📈 METRYKI:
  Wydajność: 70.2/100
  Średni rozmiar: 2.4 MB
  Czas uruchomienia: 1520 ms
  Zielony hosting: ❌ Nie
  Optymalizacja obrazów: ❌ Nie
  Średnie CLS: 0.075

📄 STRONY:
  1. https://www.example.com/          → 75/100 (Ocena: B)
  2. https://www.example.com/about     → 68/100 (Ocena: B)
  3. https://www.example.com/services  → 73/100 (Ocena: B)
```

---

## Często zadawane pytania

### P: Ile czasu zajmuje analiza?

O: Każda strona jest analizowana ~40-60 sekund. W przypadku 3 stron spodziewaj się 2-3 minut.

### P: Dlaczego niektóre strony nie są analizowane?

O: Możliwe przyczyny:

- URL jest niedostępny
- Witryna blokuje automatyczne kontrole
- Upłynął limit czasu
- Błąd serwera

Sprawdź konsolę po szczegóły błędu.

### P: Czy mogę analizować witryny z różnych domen?

O: Technicznie tak, ale nie jest to zalecane. System jest przeznaczony do analizy **jednej witryny**.

### P: Jak pobrać pełny raport?

O: Po analizie kliknij przycisk **"Pobierz raport"**. Raport zostanie zapisany jako plik JSON.

### P: Gdzie są przechowywane raporty?

O: W folderze `reports/` z nazwą:

```
website-report-{domain}-{timestamp}.json
```

### P: Jak usunąć stare raporty?

O: Usuń pliki ręcznie z folderu `reports/`.

### P: Co oznacza "Zielony hosting"?

O: Jeśli WSZYSTKIE analizowane strony używają energii odnawialnej.

---

## Porady dla najlepszych wyników

1. **Wybierz ważne strony** - strona główna, kontakty, główna zawartość
2. **Unikaj poddomen** - analizuj jedną domenę
3. **Sprawdź dostępność** - upewnij się, że wszystkie adresy URL są dostępne
4. **Bez przekierowań** - używaj ostatecznych adresów URL
5. **Pobieraj raporty** - zapisuj wyniki do porównania

---

## Kontakt i wsparcie

Jeśli masz pytania lub problemy:

- 📧 Otwórz problem na GitHubie
- 💬 Skontaktuj się z zespołem rozwojowym
- 📚 Zapoznaj się z główną dokumentacją README.md
