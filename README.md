# EcoLabel dla Aplikacji 🌿

Uniwersalny analizator ekologiczności stron internetowych z obsługą rozdzielczości desktop, automatyczną obsługą zgód na cookies oraz obliczaniem EcoScore.

## 🚀 Funkcje

- **Uniwersalna analiza** - działa z dowolnymi stronami internetowymi
- **Rozdzielczość desktop** - zoptymalizowane dla przeglądarek desktop (1920x1080)
- **Automatyczna obsługa zgód na cookies** - znajduje i klika przyciski "Akceptuj"
- **Obsługa wielu języków** - w tym polski, angielski i inne
- **Kompleksowy EcoScore** - analizuje wydajność, rozmiar plików, czas ładowania i inne
- **Integracja z Lighthouse** - wykorzystuje Google Lighthouse do analizy
- **Automatyczne zapisywanie raportów** - tworzy pliki JSON ze szczegółowymi wynikami
- **Szczegółowy raport** - pokazuje rozbicie po wszystkich komponentach

## 📦 Instalacja

```bash
npm install
```

## 🎯 Użycie

### Analiza jednej strony

```bash
node index.js https://example.com
```

### Analiza wielu stron

```bash
node index.js https://strona1.com https://strona2.com https://strona3.com
```

### Analiza zapisanych raportów

```bash
# Raporty są automatycznie zapisywane jako report-{domena}-{timestamp}.json
ls reports/
```

## 📊 Komponenty EcoScore

EcoScore jest obliczany na podstawie:

- **Performance (40%)** - Wynik Performance z Lighthouse
- **Bytes (20%)** - Całkowity rozmiar strony
- **Bootup (15%)** - Czas ładowania JavaScript
- **Hosting (10%)** - Zielony hosting
- **Images (10%)** - Optymalizacja obrazów
- **CLS (5%)** - Cumulative Layout Shift

## 🏆 Oceny EcoScore

- **A++** (95-100) - Doskonałe
- **A+** (85-94) - Bardzo dobre
- **A** (75-84) - Dobre
- **B** (65-74) - Zadowalające
- **C** (55-64) - Poniżej średniej
- **D** (45-54) - Słabe
- **E** (35-44) - Bardzo słabe
- **F** (25-34) - Krytyczne
- **G** (0-24) - Niedopuszczalne

## 🍪 Zgody na Cookies

Program automatycznie obsługuje banery cookies, szukając przycisków z tekstem:

- "Accept", "Accept Cookies", "Accept All"
- "I Accept", "I Agree", "OK", "Agree"
- "Consent", "Allow", "Allow All"
- "Akceptuj", "Akceptuję", "Zgadzam się" (polski)

## 🔧 Wymagania techniczne

- Node.js >= 18.0.0
- Puppeteer do automatyzacji przeglądarki
- Lighthouse do analizy wydajności

## 📝 Przykład wyjścia

```
🌍 PODSUMOWANIE RAPORTU EKO
──────────────────────────────

🌿 https://example.com
  Lighthouse: 85/100
  Total bytes: 0.8 MB
  Bootup: 1200 ms
  CLS: 0.05
  ImagesScore: 90.0
  ➡️ EcoScore: 78.5/100 (A)

──────────────────────────────
🌱 Średni EcoScore: 78.5 (A)
──────────────────────────────
```

## 🐛 Znane problemy

- Na Windows mogą występować problemy z Lighthouse przez blokowanie plików
- Zalecane jest używanie Linux/Mac dla stabilnej pracy
- Dla skomplikowanych stron może być potrzebny więcej czasu na analizę

## 📄 Licencja

MIT License

## 🤝 Wkład

Zapraszamy do pull requests i issues dla ulepszenia funkcjonalności!

## 👨‍💻 Autor

**vBomba** - Twórca i główny deweloper EcoLabel dla Aplikacji
