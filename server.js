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
  // Walidacja wartości wejściowych
  if (value === null || value === undefined || isNaN(value)) {
    console.warn(`normalizeScore: wartość jest null/undefined/NaN: ${value}`);
    return 0;
  }
  if (min === max) {
    console.warn(`normalizeScore: min === max (${min}), zwracam 50`);
    return 50; // Zwróć średnią wartość jeśli zakres jest zerowy
  }

  // Normalizacja: im mniejsza wartość (np. totalBytes, bootupTime, cls), tym lepszy wynik
  // Formuła: ((max - value) / (max - min)) * 100
  let normalized = ((max - value) / (max - min)) * 100;

  // Ograniczenie do zakresu 0-100
  normalized = Math.max(0, Math.min(100, normalized));

  // Sprawdzenie czy nie mamy NaN
  if (isNaN(normalized)) {
    console.warn(
      `normalizeScore: wynik jest NaN dla value=${value}, min=${min}, max=${max}`
    );
    return 0;
  }

  return normalized;
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
  // Walidacja danych wejściowych
  if (!ecoData) {
    console.error("❌ calculateCO2: brak danych ecoData");
    throw new Error("Brak danych do obliczenia emisji CO2");
  }

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

  // Walidacja wartości z ecoData
  let totalBytes = Number(ecoData.totalBytes) || 0;
  let bootupTime = Number(ecoData.bootupTime) || 0;
  const hostingGreen = Number(ecoData.hostingGreen) || 0;

  // Ustaw minimalne wartości aby uniknąć zerowych obliczeń
  // Minimalne wartości bazują na typowych wartościach dla małych stron
  const MIN_BYTES = 1000; // 1 KB minimum
  const MIN_BOOTUP_TIME = 10; // 10ms minimum

  if (totalBytes === 0 || totalBytes < MIN_BYTES) {
    console.warn(
      "⚠️ calculateCO2: totalBytes jest zerowe lub bardzo małe, używam minimum:",
      {
        original: totalBytes,
        using: MIN_BYTES,
      }
    );
    totalBytes = MIN_BYTES;
  }

  // Poprawka: sprawdzamy czy bootupTime jest mniejsze niż minimum, ale tylko jeśli jest dodatnie
  if (bootupTime === 0) {
    console.warn("⚠️ calculateCO2: bootupTime jest zerowe, używam minimum:", {
      original: bootupTime,
      using: MIN_BOOTUP_TIME,
    });
    bootupTime = MIN_BOOTUP_TIME;
  } else if (bootupTime > 0 && bootupTime < MIN_BOOTUP_TIME) {
    console.warn(
      "⚠️ calculateCO2: bootupTime jest bardzo małe, używam minimum:",
      {
        original: bootupTime,
        using: MIN_BOOTUP_TIME,
      }
    );
    bootupTime = MIN_BOOTUP_TIME;
  }

  if (isNaN(totalBytes) || isNaN(bootupTime)) {
    console.error("❌ calculateCO2: nieprawidłowe wartości:", {
      totalBytes,
      bootupTime,
      hostingGreen,
      rawEcoData: ecoData,
    });
    throw new Error("Nieprawidłowe wartości metryk dla obliczenia CO2");
  }

  // Sprawdź czy hosting jest zielony
  const isGreenHosting = hostingGreen > 0;
  const co2PerMB = isGreenHosting ? CO2_PER_MB_GREEN : CO2_PER_MB_NORMAL;

  // Oblicz emisję dla przesyłu danych (w gramach)
  const dataSizeMB = totalBytes / BYTES_PER_MB;
  const dataCO2 = dataSizeMB * co2PerMB; // w gramach

  // Emisja za bootup time (CPU intensywny)
  // Bootup time reprezentuje czas przetwarzania JavaScript w przeglądarce
  // Według metodologii: przetwarzanie używa ~0.1 kWh/GB danych (różne od transferu 0.81 kWh/GB)
  // Bootup time jest proxy dla intensywności przetwarzania - im dłuższy, tym więcej energii CPU
  const bootupSeconds = bootupTime / 1000;

  // Energia przetwarzania zależy od rozmiaru danych i czasu CPU
  // Wzór bazuje na: 0.1 kWh/GB dla przetwarzania * czas bootup * mnożnik CPU
  const PROCESSING_KWH_PER_GB = 0.1; // kWh/GB dla przetwarzania (zgodnie z komentarzem linia 63)
  const PROCESSING_CO2_PER_GB = PROCESSING_KWH_PER_GB * CO2_PER_KWH; // g CO2/GB dla przetwarzania
  const PROCESSING_CO2_PER_MB = PROCESSING_CO2_PER_GB / 1024; // g CO2/MB

  // Bootup CO2 = energia przetwarzania danych * współczynnik czasu bootup * mnożnik CPU
  // Bootup seconds reprezentuje czas przetwarzania, więc mnożymy przez niego
  // Używamy dataSizeMB jako bazę, bo przetwarzamy te dane przez bootupSeconds
  const baseProcessingCO2 = dataSizeMB * PROCESSING_CO2_PER_MB; // energia dla przetwarzania danych
  const bootupCO2 = baseProcessingCO2 * bootupSeconds * CPU_MULTIPLIER; // w gramach

  // Uwaga: bootupCO2 jest mniejszy niż dataCO2, bo przetwarzanie (0.1 kWh/GB)
  // zużywa mniej energii niż transfer (0.81 kWh/GB)

  // Całkowita emisja w gramach, konwersja na kg
  const totalCO2Grams = dataCO2 + bootupCO2;
  const totalCO2 = totalCO2Grams / 1000; // konwersja na kg

  // Sprawdzenie czy wyniki są poprawne
  if (isNaN(totalCO2) || isNaN(dataCO2) || isNaN(bootupCO2)) {
    console.error("❌ calculateCO2: wynik obliczenia jest NaN:", {
      totalCO2,
      dataCO2,
      bootupCO2,
      dataSizeMB,
      bootupSeconds,
    });
    throw new Error("Błąd obliczania emisji CO2 - wynik NaN");
  }

  // Równoważniki
  const EQUIVALENT_TREES = totalCO2 / 0.021; // Średnio jedno drzewo pochłania 21 kg CO2 rocznie
  const EQUIVALENT_CARS_KM = totalCO2Grams / 120; // Średnio 120g CO2/km

  const result = {
    totalCO2: Math.max(0, totalCO2), // w kg, upewnij się że nie jest ujemne
    dataCO2: Math.max(0, dataCO2 / 1000), // w kg
    bootupCO2: Math.max(0, bootupCO2 / 1000), // w kg
    dataSizeMB: Math.max(0, dataSizeMB),
    equivalentTrees: Math.max(0, EQUIVALENT_TREES),
    equivalentCarsKm: Math.max(0, EQUIVALENT_CARS_KM),
    perVisit: Math.max(0, totalCO2), // Emisja na jedno odwiedzenie strony
  };

  // Sprawdzenie czy wynik nie jest zbyt mały (może być problem z precyzją)
  if (result.totalCO2 === 0 && totalCO2 > 0) {
    console.warn(
      "⚠️ calculateCO2: totalCO2 został zaokrąglony do 0, oryginalna wartość:",
      totalCO2
    );
    // Jeśli wartość jest bardzo mała ale dodatnia, ustaw minimalną wartość
    result.totalCO2 = Math.max(totalCO2, 1e-10); // bardzo mała wartość ale nie zero
  }

  // Formatowanie z lepszą precyzją dla bardzo małych wartości
  const formatCO2 = (value) => {
    if (value === 0 || value < 1e-6) {
      return value < 1e-9
        ? `${value.toExponential(2)} kg`
        : `${value.toFixed(9)} kg`;
    }
    return `${value.toFixed(6)} kg`;
  };

  const formatTrees = (value) => {
    if (value === 0 || value < 1e-6) {
      return value < 1e-10 ? value.toExponential(2) : value.toFixed(8);
    }
    return value.toFixed(6);
  };

  const formatCarsKm = (value) => {
    if (value === 0 || value < 1e-6) {
      return value < 1e-10
        ? `${value.toExponential(2)} km`
        : `${value.toFixed(8)} km`;
    }
    return `${value.toFixed(6)} km`;
  };

  console.log("🌍 Obliczona emisja CO2:", {
    totalCO2: formatCO2(result.totalCO2),
    dataCO2: formatCO2(result.dataCO2),
    bootupCO2: formatCO2(result.bootupCO2),
    dataSizeMB: `${result.dataSizeMB.toFixed(2)} MB`,
    equivalentTrees: formatTrees(result.equivalentTrees),
    equivalentCarsKm: formatCarsKm(result.equivalentCarsKm),
    isGreenHosting,
    // Szczegóły obliczeń dla debugowania
    inputData: {
      totalBytes: ecoData.totalBytes,
      bootupTime: ecoData.bootupTime,
      hostingGreen: ecoData.hostingGreen,
    },
    calculations: {
      dataSizeMB: dataSizeMB.toFixed(4),
      dataCO2Grams: dataCO2.toFixed(4),
      bootupSeconds: bootupSeconds.toFixed(4),
      bootupCO2Grams: bootupCO2.toFixed(4),
      totalCO2Grams: totalCO2Grams.toFixed(4),
      EQUIVALENT_TREES_raw: EQUIVALENT_TREES,
      EQUIVALENT_CARS_KM_raw: EQUIVALENT_CARS_KM,
    },
  });

  return result;
}

function calculateEcoScore(report) {
  // Walidacja i pobranie wartości z raportu
  let performanceScore = report.categories?.performance?.score;

  // Jeśli performance score nie jest dostępne, spróbuj użyć metryk jako fallback
  if (
    performanceScore === null ||
    performanceScore === undefined ||
    isNaN(performanceScore)
  ) {
    console.warn(
      "⚠️ Brak wartości performance score w raporcie, próbuję obliczyć z metryk"
    );

    // Spróbuj obliczyć performance z metryk Core Web Vitals jeśli są dostępne
    const fcp = report.audits?.["first-contentful-paint"]?.numericValue;
    const lcp = report.audits?.["largest-contentful-paint"]?.numericValue;
    const fid =
      report.audits?.["max-potential-fid"]?.numericValue ||
      report.audits?.["total-blocking-time"]?.numericValue;
    const cls = report.audits?.["cumulative-layout-shift"]?.numericValue ?? 0;

    // Jeśli mamy jakieś metryki, użyj ich do oszacowania performance
    if (fcp || lcp || fid) {
      // Proste oszacowanie: im lepsze metryki, tym wyższy score
      let estimatedScore = 50; // start from middle

      if (fcp && fcp < 1800) estimatedScore += 15; // good FCP
      if (fcp && fcp < 3000) estimatedScore += 10; // needs improvement

      if (lcp && lcp < 2500) estimatedScore += 15; // good LCP
      if (lcp && lcp < 4000) estimatedScore += 10;

      if (fid && fid < 100) estimatedScore += 10;

      if (cls && cls < 0.1) estimatedScore += 10;

      performanceScore = Math.min(1, Math.max(0, estimatedScore / 100));
      console.log(
        `📊 Obliczony szacunkowy performance score: ${(
          performanceScore * 100
        ).toFixed(2)}`
      );
    } else {
      // Jeśli nie ma żadnych metryk, użyj domyślnej wartości
      console.warn(
        "⚠️ Brak metryk do oszacowania performance, używam wartości domyślnej 50"
      );
      performanceScore = 0.5; // 50/100 jako domyślna wartość
    }
  }

  const performance = performanceScore * 100;

  const totalBytes = report.audits?.["total-byte-weight"]?.numericValue ?? 0;
  const bootupTime = report.audits?.["bootup-time"]?.numericValue ?? 0;
  const hostingGreen =
    report.audits?.["uses-green-hosting"]?.score === 1 ? 100 : 0;
  const imageOptimization =
    report.audits?.["uses-optimized-images"]?.score === 1 ? 100 : 0;
  const cls = report.audits?.["cumulative-layout-shift"]?.numericValue ?? 0;

  // Logowanie wartości dla debugowania
  console.log("📊 Metryki Lighthouse:", {
    performance: performance.toFixed(2),
    totalBytes: totalBytes.toFixed(0),
    bootupTime: bootupTime.toFixed(0),
    hostingGreen,
    imageOptimization,
    cls: cls.toFixed(4),
  });

  // Obliczenie znormalizowanych wartości
  const normalizedBytes = normalizeScore(totalBytes, 0, 1000000);
  const normalizedBootup = normalizeScore(bootupTime, 0, 1000);
  const normalizedCls = normalizeScore(cls, 0, 0.25);

  console.log("📈 Znormalizowane wartości:", {
    normalizedBytes: normalizedBytes.toFixed(2),
    normalizedBootup: normalizedBootup.toFixed(2),
    normalizedCls: normalizedCls.toFixed(2),
  });

  // Obliczenie EcoScore z wagami
  const ecoScore = Math.round(
    performance * 0.4 +
      normalizedBytes * 0.2 +
      normalizedBootup * 0.15 +
      hostingGreen * 0.1 +
      imageOptimization * 0.1 +
      normalizedCls * 0.05
  );

  // Sprawdzenie czy wynik jest poprawny
  if (isNaN(ecoScore) || ecoScore < 0 || ecoScore > 100) {
    console.error("❌ Błąd obliczania EcoScore:", {
      performance,
      normalizedBytes,
      normalizedBootup,
      hostingGreen,
      imageOptimization,
      normalizedCls,
      wynik: ecoScore,
    });
    throw new Error(`Nieprawidłowy wynik EcoScore: ${ecoScore}`);
  }

  console.log(`✅ Obliczony EcoScore: ${ecoScore}`);

  const ecoData = {
    ecoScore,
    performance,
    totalBytes,
    bootupTime,
    hostingGreen,
    imageOptimization,
    cls,
  };

  // Oblicz emisję CO2 - z obsługą błędów aby nie przerywać analizy
  let co2Data = null;
  try {
    console.log("🔄 Próba obliczenia CO2 dla ecoData:", {
      totalBytes: ecoData.totalBytes,
      bootupTime: ecoData.bootupTime,
      hostingGreen: ecoData.hostingGreen,
    });
    co2Data = calculateCO2(ecoData);
    console.log("✅ CO2 obliczone pomyślnie:", co2Data ? "tak" : "nie");
  } catch (co2Error) {
    console.error(
      "⚠️ Błąd obliczania CO2 (analiza kontynuuje bez danych CO2):",
      co2Error.message,
      co2Error.stack
    );
    // Nie przerywamy analizy - zwracamy ecoData bez co2
  }

  console.log("📤 Zwracam ecoData z co2:", {
    hasCo2: !!co2Data,
    co2Type: typeof co2Data,
    co2Value: co2Data,
  });

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

  // Oblicz CO2 dla agregowanych danych - z obsługą błędów
  let co2Data = null;
  try {
    console.log("🔄 Próba obliczenia CO2 dla agregowanych danych:", {
      totalBytes: ecoData.totalBytes,
      bootupTime: ecoData.bootupTime,
      hostingGreen: ecoData.hostingGreen,
    });
    co2Data = calculateCO2(ecoData);
    console.log(
      "✅ CO2 dla agregowanych danych obliczone pomyślnie:",
      co2Data ? "tak" : "nie"
    );
  } catch (co2Error) {
    console.error(
      "⚠️ Błąd obliczania CO2 dla agregowanych danych (analiza kontynuuje bez danych CO2):",
      co2Error.message,
      co2Error.stack
    );
    // Nie przerywamy analizy - zwracamy ecoData bez co2
  }

  console.log("📤 Zwracam agregowane ecoData z co2:", {
    hasCo2: !!co2Data,
    co2Type: typeof co2Data,
    co2Value: co2Data,
  });

  return {
    ...ecoData,
    co2: co2Data,
  };
}

// Określenie eco-label na podstawie wyniku (zgodne z klasyfikacją energetyczną EU A-F)
function getEcoLabel(ecoScore) {
  if (ecoScore >= 80)
    return { grade: "A", label: "Excellent", color: "#00852e" }; // Ciemna zieleń
  if (ecoScore >= 65) return { grade: "B", label: "Good", color: "#6cae3a" }; // Jasna zieleń
  if (ecoScore >= 50) return { grade: "C", label: "Fair", color: "#b0cc33" }; // Żółto-zielony
  if (ecoScore >= 35) return { grade: "D", label: "Poor", color: "#fdd835" }; // Żółty
  if (ecoScore >= 20)
    return { grade: "E", label: "Very Poor", color: "#ff9800" }; // Pomarańczowy
  return { grade: "F", label: "Critical", color: "#ff5722" }; // Czerwony
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
  console.log(
    `🌍 Serwer ZielonaPlaneta uruchomiony na http://localhost:${PORT}`
  );
  console.log(`📊 API dostępne na http://localhost:${PORT}/api`);
  console.log(`🌱 Gotowy do analizy stron!`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} jest już w użytku`);
    console.log(`Próbuję port ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(
        `🌍 Serwer ZielonaPlaneta uruchomiony na http://localhost:${PORT + 1}`
      );
      console.log(`📊 API dostępne na http://localhost:${PORT + 1}/api`);
      console.log(`🌱 Gotowy do analizy stron!`);
    });
  } else {
    console.error(err);
  }
});

export default app;
