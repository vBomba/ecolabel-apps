import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";
import lighthouse from "lighthouse";
import fs from "fs";
import cors from "cors";
import { getBrowserPath } from "./utils.js";
import Scenario from "./src/scenario.js";
import Config from "./src/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Obliczanie EcoScore
function normalizeScore(value, min, max) {
  return Math.max(0, Math.min(100, ((max - value) / (max - min)) * 100));
}

// Obliczanie emisji CO2 na podstawie metryk Lighthouse
// Metodologia bazowana na badaniach:
// https://sustainablewebdesign.org/carbon-calculator/
// https://www.websitecarbon.com/
// https://github.com/thegreenwebfoundation/carbon.txt
//
// Kluczowe zasady:
// 1. Emisja zależy od kraju w którym znajduje się serwer (mix energetyczny)
// 2. Średnia globalna emisja: ~475g CO2/kWh
// 3. Średnie zużycie energii: ~0.81 kWh/GB dla transmisji danych
// 4. Średnie zużycie energii: ~0.1 kWh/GB dla przetwarzania na serwerze
// 5. Zielony hosting zmniejsza emisje o ~95% (zakłada 100% OZE)
//
// Dla przeciętnej strony WWW (bez informacji o lokalizacji):
// - 1 MB danych ≈ 0.001 kWh zużycia energii
// - Średnia globalna emisja: 475g CO2/kWh
// - Normalny hosting: ~0.475g CO2/MB
// - Zielony hosting (100% OZE): ~0.024g CO2/MB (5% remaining grid factor)
function calculateCO2(ecoData) {
  // Konwersja: 1 MB = 1024 * 1024 bytes
  const BYTES_PER_MB = 1024 * 1024;

  // Średnie zużycie energii i emisja CO2
  // Zgodnie z badaniami: 1GB = ~0.81 kWh, średnio 475g CO2/kWh
  const KWH_PER_GB = 0.81; // kWh na GB przesyłu danych
  const CO2_PER_KWH = 475; // g CO2/kWh (średnia globalna, 2024)
  const GB_PER_MB = 1 / 1024; // konwersja MB na GB
  const CO2_PER_MB_NORMAL = KWH_PER_GB * GB_PER_MB * CO2_PER_KWH; // g CO2/MB
  const CO2_PER_MB_GREEN = CO2_PER_MB_NORMAL * 0.05; // 95% redukcja dla OZE

  // Mnożnik dla bootup time - CPU intensywny task
  const CPU_MULTIPLIER = 1.5; // CPU time = więcej energii serwera

  // Sprawdź czy hosting jest zielony
  const isGreenHosting = ecoData.hostingGreen > 0;
  const co2PerMB = isGreenHosting ? CO2_PER_MB_GREEN : CO2_PER_MB_NORMAL;

  // Oblicz emisję dla przesyłu danych (w gramach)
  const dataSizeMB = ecoData.totalBytes / BYTES_PER_MB;
  const dataCO2 = dataSizeMB * co2PerMB; // w gramach

  // Emisja za bootup time (CPU intensywny)
  // Bootup time to proxy dla zużycia CPU
  const bootupSeconds = ecoData.bootupTime / 1000;
  const bootupCO2 =
    (dataSizeMB * co2PerMB * CPU_MULTIPLIER * bootupSeconds) / 5; // uśredniony czas bootup

  // Całkowita emisja w gramach, konwersja na kg
  const totalCO2Grams = dataCO2 + bootupCO2;
  const totalCO2 = totalCO2Grams / 1000; // konwersja na kg

  // Równoważniki
  const EQUIVALENT_TREES = totalCO2 / 0.021; // Średnio jedno drzewo pochłania 21 kg CO2 rocznie
  const EQUIVALENT_CARS_KM = totalCO2Grams / 120; // Średnio 120g CO2/km

  return {
    totalCO2, // w kg
    dataCO2: dataCO2 / 1000, // w kg
    bootupCO2: bootupCO2 / 1000, // w kg
    dataSizeMB,
    equivalentTrees: EQUIVALENT_TREES,
    equivalentCarsKm: EQUIVALENT_CARS_KM,
    perVisit: totalCO2, // Emisja na jedno odwiedzenie strony
  };
}

function calculateEcoScore(report) {
  const performance = report.categories.performance.score * 100;
  const totalBytes = report.audits["total-byte-weight"].numericValue;
  const bootupTime = report.audits["bootup-time"].numericValue;
  const hostingGreen =
    report.audits["uses-green-hosting"]?.score === 1 ? 100 : 0;
  const imageOptimization =
    report.audits["uses-optimized-images"]?.score === 1 ? 100 : 0;
  const cls = report.audits["cumulative-layout-shift"].numericValue;

  const ecoScore = Math.round(
    performance * 0.4 +
      normalizeScore(totalBytes, 0, 1000000) * 0.2 +
      normalizeScore(bootupTime, 0, 1000) * 0.15 +
      hostingGreen * 0.1 +
      imageOptimization * 0.1 +
      normalizeScore(cls, 0, 0.25) * 0.05
  );

  const ecoData = {
    ecoScore,
    performance,
    totalBytes,
    bootupTime,
    hostingGreen,
    imageOptimization,
    cls,
  };

  // Oblicz emisję CO2
  const co2Data = calculateCO2(ecoData);

  return {
    ...ecoData,
    co2: co2Data,
  };
}

// Zapisywanie i analiza raportu
function saveAndAnalyzeReport(report, url) {
  const domain = new URL(url).hostname.replace(/\./g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `report-${domain}-${timestamp}.json`;
  const filepath = path.join("reports", filename);

  // Upewnij się, że folder reports istnieje
  if (!fs.existsSync("reports")) {
    fs.mkdirSync("reports");
  }

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`📄 Raport zapisany: ${filepath}`);

  const ecoData = calculateEcoScore(report);

  return { ecoData, filename, report };
}

// Agregacja wyników wielu stron
function aggregateEcoScores(ecoScoresArray) {
  if (ecoScoresArray.length === 0) {
    throw new Error("No eco scores to aggregate");
  }

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const ecoData = {
    ecoScore: Math.round(avg(ecoScoresArray.map((e) => e.ecoScore))),
    performance: avg(ecoScoresArray.map((e) => e.performance)),
    totalBytes: avg(ecoScoresArray.map((e) => e.totalBytes)),
    bootupTime: avg(ecoScoresArray.map((e) => e.bootupTime)),
    hostingGreen: ecoScoresArray.every((e) => e.hostingGreen === 100) ? 100 : 0,
    imageOptimization: ecoScoresArray.every((e) => e.imageOptimization === 100)
      ? 100
      : 0,
    cls: avg(ecoScoresArray.map((e) => e.cls)),
  };

  // Oblicz CO2 dla agregowanych danych
  const co2Data = calculateCO2(ecoData);

  return {
    ...ecoData,
    co2: co2Data,
  };
}

// Określenie eco-label na podstawie wyniku
function getEcoLabel(ecoScore) {
  if (ecoScore >= 80)
    return { grade: "A", label: "Excellent", color: "#27ae60" };
  if (ecoScore >= 60) return { grade: "B", label: "Good", color: "#f39c12" };
  if (ecoScore >= 40) return { grade: "C", label: "Fair", color: "#e74c3c" };
  if (ecoScore >= 20) return { grade: "D", label: "Poor", color: "#c0392b" };
  return { grade: "F", label: "Critical", color: "#8b0000" };
}

// Główna funkcja analizy
async function runLighthouseWithCookieHandling(url) {
  console.log(`\n🔍 Analizuję ${url} ...`);

  try {
    const browserPath = getBrowserPath();
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--window-size=1920,1080",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "--no-proxy-server",
        "--proxy-bypass-list=*",
        "--disable-proxy-certificate-handler",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-plugins",
      ],
    });

    const page = await browser.newPage();

    try {
      // Ustaw widok dla pulpitu
      await page.setViewport({ width: 1920, height: 1080 });

      // Przejśćdo strony
      console.log("📄 Ładowanie strony...");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      // Oczekiwanie na dynamiczną zawartość
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Obsługa zgód na pliki cookie tymczasowo wyłączona
      console.log("🍪 Obsługa zgód na pliki cookie tymczasowo wyłączona");

      console.log("🚀 Uruchamianie analizy Lighthouse...");

      // Uruchomienie Lighthouse za pomocą API
      const options = {
        logLevel: "info",
        output: "json",
        onlyCategories: ["performance"],
        port: new URL(browser.wsEndpoint()).port,
      };

      const runnerResult = await lighthouse(url, options);

      // Zapisywanie i analiza raportu
      return saveAndAnalyzeReport(runnerResult.lhr, url);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`❌ Błąd analizy dla ${url}: ${error.message}`);
    throw error;
  }
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`Starting analysis for: ${url}`);

    const result = await runLighthouseWithCookieHandling(url);

    // Zwróć wynik z URL
    res.json({
      url,
      ...result,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
});

app.post("/api/analyze-multiple", async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: "urls array is required and must contain at least one URL",
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        error: "Maximum 10 URLs per request",
      });
    }

    console.log(`🔍 Starting analysis for ${urls.length} pages...`);

    const results = [];
    const errors = [];

    // Analizujemy każdą stronę sekwencyjnie
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`⏳ Analyzing ${i + 1}/${urls.length}: ${url}`);

      try {
        const result = await runLighthouseWithCookieHandling(url);
        results.push({
          url,
          ...result,
          ecoData: result.ecoData,
        });
      } catch (error) {
        console.error(`❌ Error analyzing ${url}: ${error.message}`);
        errors.push({
          url,
          error: error.message,
        });
      }
    }

    if (results.length === 0) {
      return res.status(500).json({
        error: "Failed to analyze any URLs",
        errors,
      });
    }

    // Agregujemy wyniki
    try {
      const ecoScoresArray = results.map((r) => r.ecoData);
      const aggregatedEcoData = aggregateEcoScores(ecoScoresArray);
      const ecoLabel = getEcoLabel(aggregatedEcoData.ecoScore);

      // Zbieramy informacje o domenie
      const domain = new URL(urls[0]).hostname;
      const websiteReport = {
        domain,
        analyzedPages: urls.length,
        successfulAnalyses: results.length,
        failedAnalyses: errors.length,
        analyzedAt: new Date().toISOString(),
        aggregatedEcoData,
        ecoLabel,
        pages: results,
        errors: errors.length > 0 ? errors : undefined,
      };

      // Zapisujemy złączony raport
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const domainForFile = domain.replace(/\./g, "-");
      const websiteReportFilename = `website-report-${domainForFile}-${timestamp}.json`;
      const websiteReportPath = path.join("reports", websiteReportFilename);

      if (!fs.existsSync("reports")) {
        fs.mkdirSync("reports");
      }

      fs.writeFileSync(
        websiteReportPath,
        JSON.stringify(websiteReport, null, 2)
      );
      console.log(`📄 Raport witryny zapisany: ${websiteReportPath}`);

      res.json({
        success: true,
        ...websiteReport,
      });
    } catch (aggregationError) {
      console.error("Error during result aggregation:", aggregationError);
      res.status(500).json({
        error: "Failed to aggregate results",
        message: aggregationError.message,
        partialResults: results,
      });
    }
  } catch (error) {
    console.error("Multi-page analysis error:", error);
    res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
});

app.get("/api/reports", (req, res) => {
  try {
    const reportsDir = path.join(__dirname, "reports");

    if (!fs.existsSync(reportsDir)) {
      return res.json([]);
    }

    const files = fs
      .readdirSync(reportsDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          createdAt: stats.birthtime,
          size: stats.size,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(files);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

app.get("/api/reports/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "reports", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Report not found" });
    }

    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

app.get("/api/website-reports", (req, res) => {
  try {
    const reportsDir = path.join(__dirname, "reports");

    if (!fs.existsSync(reportsDir)) {
      return res.json([]);
    }

    const files = fs
      .readdirSync(reportsDir)
      .filter(
        (file) => file.startsWith("website-report-") && file.endsWith(".json")
      )
      .map((file) => {
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

        return {
          filename: file,
          domain: content.domain,
          ecoScore: content.aggregatedEcoData.ecoScore,
          ecoLabel: content.ecoLabel,
          analyzedPages: content.analyzedPages,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(files);
  } catch (error) {
    console.error("Error fetching website reports:", error);
    res.status(500).json({ error: "Failed to fetch website reports" });
  }
});

app.get("/api/website-reports/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "reports", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Report not found" });
    }

    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json(report);
  } catch (error) {
    console.error("Error fetching website report:", error);
    res.status(500).json({ error: "Failed to fetch website report" });
  }
});

// Endpoint testowania wydajności
app.post("/api/run-scenarios", async (req, res) => {
  try {
    console.log("📊 Starting performance testing scenarios...");
    const scenarios = [];
    const customUrls = req.body; // Tablica {name, url}

    // Użycie niestandardowych URL lub domyślnych przykładów
    const urlsToTest =
      customUrls && customUrls.length > 0
        ? customUrls
        : [
            { name: "Example Homepage", url: "https://www.example.com/" },
            { name: "Example About", url: "https://www.example.com/about" },
            { name: "Example Contact", url: "https://www.example.com/contact" },
          ];

    console.log(`🔗 Testing ${urlsToTest.length} URLs`);

    // Inicjalizuj przeglądarkę przed uruchomieniem scenariuszy
    await Config.initBrowser();

    for (const item of urlsToTest) {
      console.log(`⏳ Creating scenario for: ${item.name}`);
      scenarios.push(new Scenario(item.name, item.url));
    }

    // Uruchom wszystkie scenariusze
    for (const scenario of scenarios) {
      console.log(`▶️ Running scenario: ${scenario.name}`);
      await scenario.run();
    }

    console.log("✅ All scenarios completed");

    // Zamknij przeglądarkę
    await Config.quitBrowser();
    console.log("🔒 Browser closed");

    // Konwertuj scenariusze na zwykłe obiekty do wysłania
    const results = scenarios.map((s) => ({
      name: s.name,
      url: s.url,
      metrics: s.metrics,
    }));

    // Zwróć dane scenariuszy
    res.json(results);
  } catch (error) {
    console.error("❌ Error running scenarios:", error);
    console.error("Stack trace:", error.stack);

    // Upewnij się, że przeglądarka jest zamknięta w przypadku błędu
    try {
      await Config.quitBrowser();
    } catch (quitError) {
      console.error("Error closing browser:", quitError);
    }

    res.status(500).json({
      error: error.message,
      details: error.stack,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🔴 Nieobsługiwany błąd:");
  console.error(err.stack);
  console.error("Wiadomość:", err.message);
  res.status(500).json({
    error: "Something went wrong!",
    details: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server with error handling for port conflicts
const server = app.listen(PORT, () => {
  console.log(`🌍 Serwer EcoLabel uruchomiony na http://localhost:${PORT}`);
  console.log(`📊 API dostępne na http://localhost:${PORT}/api`);
  console.log(`🌱 Gotowy do analizy stron!`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} jest już w użytku`);
    console.log(`Próbuję port ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(
        `🌍 Serwer EcoLabel uruchomiony na http://localhost:${PORT + 1}`
      );
      console.log(`📊 API dostępne na http://localhost:${PORT + 1}/api`);
      console.log(`🌱 Gotowy do analizy stron!`);
    });
  } else {
    console.error(err);
  }
});

export default app;
