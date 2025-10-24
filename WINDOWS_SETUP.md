# 🪟 Instrukcja instalacji na Windows

Projekt **EcoLabel** używa `puppeteer-core` zamiast pełnego `puppeteer` dla lepszej wydajności i mniejszego rozmiaru.

## ⚠️ Ważne: Musisz zainstalować Chrome lub Chromium!

### Opcja 1: Google Chrome (REKOMENDOWANE) ✅

#### Krok 1: Pobierz Chrome

- Przejdź na: https://www.google.com/chrome
- Kliknij "Pobierz Chrome"
- Zainstaluj (cały proces jest automatyczny)
- Domyślnie będzie w: `C:\Program Files\Google\Chrome\Application\chrome.exe`

#### Krok 2: Uruchomienie aplikacji

```bash
npm install
npm start
```

Aplikacja **automatycznie znajdzie** Chrome i uruchomi się bez błędów! 🎉

---

### Opcja 2: Chromium (Darmowy, open-source)

#### Krok 1: Pobierz Chromium

- Przejdź na: https://www.chromium.org/getting-involved/download-chromium
- Pobierz najnowszą wersję dla Windows
- Rozpakuj do: `C:\Program Files\Chromium\`

#### Krok 2: Uruchomienie aplikacji

```bash
npm install
npm start
```

Aplikacja automatycznie znajdzie Chromium! 🎉

---

### Opcja 3: Własna lokalizacja Chrome

Jeśli Chrome jest zainstalowany w **innym miejscu**, możesz podać ścieżkę:

#### Na Windows PowerShell:

```powershell
$env:CHROME_PATH = "C:\Users\TwojaUzytkownik\AppData\Local\Google\Chrome\Application\chrome.exe"
npm start
```

#### Lub edytuj utils.js:

Dodaj swoją ścieżkę do `possiblePaths` w pliku `utils.js`:

```javascript
const possiblePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Users\\TwojaUzytkownik\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe", // ← DODAJ TĘ LINIĘ
  // ... reszta
];
```

---

## 🚀 Pełna instalacja krok po kroku

```bash
# 1. Sklonuj lub pobierz projekt
git clone https://github.com/vBomba/ecolabel-apps.git
cd ecolabel-apps

# 2. Zainstaluj zależności Node.js
npm install

# 3. Skompiluj style SCSS
npm run build-css-once

# 4. Uruchom serwer
npm start
```

Jeśli wszystko się zainstalowało prawidłowo, zobaczysz:

```
🌍 EcoLabel Server running on http://localhost:3000
📊 API available at http://localhost:3000/api
🌱 Ready to analyze websites!
```

## ✅ Jeśli coś się nie powiodło

### Problem: "Chrome not found"

**Rozwiązanie:**

1. Sprawdź czy Chrome jest zainstalowany w domyślnym miejscu:

   - `C:\Program Files\Google\Chrome\Application\chrome.exe`
   - lub `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

2. Jeśli nie, pobierz Chrome: https://www.google.com/chrome

3. Albo pobierz Chromium: https://www.chromium.org/getting-involved/download-chromium

### Problem: Port 3000 jest zajęty

**Rozwiązanie:**

```bash
# Użyj innego portu
set PORT=3001
npm start
```

### Problem: Błąd przy npm install

**Rozwiązanie:**

```bash
# Wyczyść cache npm
npm cache clean --force

# Spróbuj ponownie
npm install
```

---

## 📱 Testowanie

Otwórz przeglądarkę i przejdź na: **http://localhost:3000**

Powinieneś zobaczyć interfejs do analizy stron internetowych 🌿

---

## 🔗 Przydatne linki

- [Google Chrome](https://www.google.com/chrome)
- [Chromium](https://www.chromium.org/getting-involved/download-chromium)
- [Puppeteer Core Dokumentacja](https://pptr.dev)
- [EcoLabel GitHub](https://github.com/vBomba/ecolabel-apps)

---

**Pytania czy problemy?** Zgłoś issue na GitHub! 🐛
