# ZielonaPlaneta 🌱

## Analiza ekologiczności stron internetowych

**Automatyczna analiza i ocena ekologiczności stron WWW**

---

## O projekcie

### Czym jest ZielonaPlaneta?

- 🌿 **Narzędzie do analizy ekologiczności** stron internetowych
- 📊 **Ocena wpływu** na środowisko przy użyciu zaawansowanych metryk
- 🎯 **Wizualna etykieta energetyczna** (A-F) dla każdej strony
- 💚 **Promowanie zrównoważonych** praktyk web developmentu

### Kluczowe cechy

- ✅ Automatyczna analiza przy użyciu Lighthouse
- ✅ System oceny EcoScore (0-100)
- ✅ Analiza pojedynczej strony lub całej witryny (do 10 stron)
- ✅ Szczegółowe raporty i rekomendacje
- ✅ Nowoczesny, responsywny interfejs

---

## Funkcjonalności główne

### Analiza ekologiczności

- 🌐 **Analiza pojedynczej strony** - szybka ocena jednej strony
- 📑 **Analiza wielostronna** - ocena całej witryny (max 10 stron)
- ⏱️ **Śledzenie postępu** - wizualny pasek postępu z timerem
- 📈 **Szczegółowe raporty** - pełne metryki i rekomendacje

### Analiza interfejsu użytkownika

- 🔍 **Performance Testing** - analiza wydajności UI
- 📊 **Wykresy metryk** - wizualizacja danych systemowych
- 💻 **Chrome DevTools** - zaawansowane pomiary
- 📉 **Porównanie stron** - analiza wielu URL jednocześnie

---

## Metryki analizowane

### Główne wskaźniki

| Metryka                   | Opis                              | Zakres  |
| ------------------------- | --------------------------------- | ------- |
| **EcoScore**              | Ogólna ocena ekologiczności       | 0-100   |
| **Performance**           | Szybkość ładowania strony         | 0-100   |
| **Rozmiar**               | Całkowity rozmiar zasobów         | KB/MB   |
| **Bootup Time**           | Czas wykonania JavaScript         | ms      |
| **Hosting Green**         | Wykorzystanie energii odnawialnej | Tak/Nie |
| **Optymalizacja obrazów** | Efektywność obrazów               | Tak/Nie |
| **CLS**                   | Cumulative Layout Shift           | 0-1     |

### Obliczanie emisji CO₂

- 📦 **Transfer danych** - emisja związana z pobieraniem zasobów
- ⚙️ **Przetwarzanie** - emisja związana z wykonaniem JavaScript
- 🌍 **Hosting** - emisja serwerów (uwzględnienie zielonego hostingu)
- 🌳 **Ekwivalenty** - drzewa potrzebne do zrównoważenia emisji
- 🚗 **Przebyty dystans** - ekwiwalent w kilometrach jazdy samochodem

---

## System ocen A-F

### Etykieta energetyczna

```
A (80-100)  ████████████████████ Doskonałe ✅
B (60-79)   ████████████░░░░░░░░ Dobrze 👍
C (40-59)   ████████░░░░░░░░░░░░ Akceptowalnie ⚠️
D (20-39)   ████░░░░░░░░░░░░░░░░ Słabo ❌
E (10-19)   ██░░░░░░░░░░░░░░░░░░ Bardzo słabo ❌❌
F (0-9)     ░░░░░░░░░░░░░░░░░░░░ Krytycznie ❌❌❌
```

### Wizualna prezentacja

- 🎨 **Kolorowa etykieta** - podobna do etykiet energetycznych urządzeń
- 📊 **Animowana prezentacja** - wyróżnienie aktywnej oceny
- 📈 **Szczegółowe metryki** - rozbicie na komponenty

---

## Interfejs użytkownika

### Funkcje UI

- 🎯 **Wspólny input** - jedno pole dla wszystkich typów analizy
- 🔄 **Automatyczne przełączanie** - zakładki po zakończeniu analizy
- ⏱️ **Timer analizy** - widoczny czas trwania
- 📊 **Wizualne metryki** - kolorowe wskaźniki wydajności
- 🌱 **Logo z animacją** - pulsująca Ziemia pokryta lasem
- 📱 **Responsywność** - pełna obsługa urządzeń mobilnych

### Design

- 🎨 **Nowoczesny design** - minimalistyczny, czytelny
- 🌈 **Kolorystka ekologiczna** - zielone akcenty
- ✨ **Płynne animacje** - profesjonalne przejścia
- 📐 **Uporządkowany layout** - intuicyjna nawigacja

---

## Stack technologiczny

### Frontend

- **HTML5** - semantyczna struktura
- **SCSS** - nowoczesne style z zmiennymi i mixinami
- **Vanilla JavaScript** - bez zależności frontendowych
- **SVG Icons** - lokalne ikony osadzone w CSS
- **Chart.js** - wykresy dla analizy UI

### Backend

- **Node.js** (≥18.0.0) - platforma serwerowa
- **Express.js** - framework webowy
- **Puppeteer Core** - automatyzacja przeglądarki
- **Lighthouse** - analiza wydajności i metryki
- **System Information** - metryki systemowe

---

## Architektura

### Struktura projektu

```
zielona-planeta-apps/
├── public/              # Frontend
│   ├── index.html      # Główny interfejs
│   ├── script.js       # Logika klienta
│   ├── styles.css      # Kompilowane style
│   ├── logo.jpg        # Logo aplikacji
│   └── favicon.jpg     # Favicon
├── src/                # Źródła
│   └── styles/         # SCSS
│       ├── main.scss   # Główny plik stylów
│       ├── _variables  # Zmienne
│       ├── _mixins     # Mixiny
│       └── _icons      # Definicje ikon
├── server.js           # Backend Express
├── utils.js            # Narzędzia pomocnicze
└── package.json        # Konfiguracja
```

### Przepływ danych

1. **Użytkownik** wprowadza URL
2. **Frontend** wysyła żądanie do API
3. **Backend** uruchamia Puppeteer + Lighthouse
4. **Lighthouse** analizuje stronę
5. **Algorytm EcoScore** oblicza ocenę
6. **Backend** zwraca wyniki
7. **Frontend** wyświetla raport

---

## Przypadki użycia

### Dla developerów

- ✅ Sprawdzenie wydajności swojej strony
- ✅ Identyfikacja obszarów do optymalizacji
- ✅ Monitoring wpływu na środowisko
- ✅ Benchmarking względem konkurencji

### Dla firm

- ✅ Audyt ekologiczności witryny
- ✅ Raporty CSR (Corporate Social Responsibility)
- ✅ Optymalizacja kosztów hostingowych
- ✅ Wizualizacja wpływu na środowisko

### Dla agencji

- ✅ Analiza projektów klientów
- ✅ Raporty z optymalizacji
- ✅ Weryfikacja implementacji best practices
- ✅ Prezentacja wyników klientom

---

## Zalety i korzyści

### Techniczne

- ⚡ **Szybka analiza** - wyniki w kilka sekund
- 🔧 **Łatwa integracja** - prosta instalacja i konfiguracja
- 📦 **Niezależność** - działa lokalnie, bez zewnętrznych API
- 🔒 **Prywatność** - analiza odbywa się na serwerze użytkownika

### Biznesowe

- 💰 **Redukcja kosztów** - optymalizacja transferu danych
- 🌍 **Odpowiedzialność** - promowanie zrównoważonych praktyk
- 📈 **Wzrost wydajności** - lepsze Core Web Vitals
- 🏆 **Konkurencyjność** - przewaga na rynku

### Środowiskowe

- 🌱 **Mniejsza emisja CO₂** - optymalizacja redukuje ślad węglowy
- 🌳 **Świadomość** - edukacja o wpływie technologii
- 💚 **Zrównoważony rozwój** - wsparcie dla green web
- 🌍 **Ochrona środowiska** - realny wpływ na planetę

---

## Roadmap

### Zrealizowane ✅

- [x] Analiza pojedynczej strony
- [x] Analiza wielostronna (do 10 stron)
- [x] System ocen A-F
- [x] Obliczanie emisji CO₂
- [x] Interfejs użytkownika
- [x] Analiza interfejsu użytkownika
- [x] Wykresy i wizualizacje

### W planach 🚀

- [ ] Integracja z CI/CD
- [ ] API dla zewnętrznych integracji
- [ ] Rozszerzenie o więcej metryk
- [ ] Dashboard z historią analiz
- [ ] Integracja z systemami monitoringu
- [ ] Eksport raportów w różnych formatach

---

## Demo i przykład użycia

### Krok po kroku

1. **Otwórz aplikację** → http://localhost:3000
2. **Wprowadź URL** → np. https://example.com
3. **Kliknij "Analizuj ekologiczność"**
4. **Obserwuj postęp** → wizualny pasek i timer
5. **Przeglądaj wyniki** → EcoScore, metryki, rekomendacje
6. **Pobierz raport** → JSON z pełnymi danymi

### Przykładowy wynik

```
EcoScore: 85/100 → Ocena: A ✅

Metryki:
- Performance: 92/100
- Rozmiar: 1.2 MB
- Bootup Time: 120 ms
- Hosting Green: Tak
- Emisja CO₂: 0.0012 kg
```

---

## Podsumowanie

### Czym jest ZielonaPlaneta?

🌿 **Narzędzie do analizy ekologiczności** stron internetowych, które pomaga:

- 📊 **Mierzyć wpływ** technologii na środowisko
- 🎯 **Oceniać wydajność** i optymalizować strony
- 🌍 **Promować zrównoważony** web development
- 💚 **Edukować** o green web practices

### Kluczowe wartości

- ✅ **Prostota** - łatwy w użyciu interfejs
- ✅ **Precyzja** - dokładne metryki i obliczenia
- ✅ **Przydatność** - konkretne rekomendacje
- ✅ **Nowoczesność** - aktualne technologie

---

## Dziękujemy! 🌱

### Kontakt i źródła

- 📚 **Repozytorium**: https://github.com/vBomba/ecolabel-apps
- 📄 **Dokumentacja**: Zobacz README.md i FEATURES.md
- 👤 **Autor**: vBomba
- 📜 **Licencja**: MIT

### Pytania?

**ZielonaPlaneta** - Twój partner w tworzeniu zrównoważonego internetu! 🌍💚
