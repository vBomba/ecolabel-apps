import puppeteer from "puppeteer-core";
import lighthouse from "lighthouse";
import fs from "fs";
import path from "path";
import { getBrowserPath } from "./utils.js";

// --- Obliczanie EcoScore ---
function normalizeScore(value, min, max) {
  return Math.max(0, Math.min(100, ((max - value) / (max - min)) * 100));
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

  return {
    ecoScore,
    performance,
    totalBytes,
    bootupTime,
    hostingGreen,
    imageOptimization,
    cls,
  };
}

// --- Zapisywanie i analiza raportu ---
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
  console.log(`🌱 EcoScore: ${ecoData.ecoScore}/100`);
  console.log(`📊 Performance: ${ecoData.performance.toFixed(1)}/100`);
  console.log(`💾 Total Bytes: ${(ecoData.totalBytes / 1024).toFixed(1)} KB`);
  console.log(`⏱️ Bootup Time: ${ecoData.bootupTime.toFixed(1)} ms`);
  console.log(`🌿 Hosting Green: ${ecoData.hostingGreen ? "Yes" : "No"}`);
  console.log(
    `🖼️ Image Optimization: ${ecoData.imageOptimization ? "Yes" : "No"}`
  );
  console.log(`📐 CLS: ${ecoData.cls.toFixed(3)}`);

  return { ecoData, filename };
}

// --- Główna funkcja analizy ---
async function runLighthouseWithCookieHandling(url) {
  console.log(`\n🔍 Analizuję ${url} ...`);

  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--window-size=1920,1080", // Rozdzielczość desktop
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ],
  });

  const page = await browser.newPage();

  try {
    // Ustawienie viewport dla desktop
    await page.setViewport({ width: 1920, height: 1080 });

    // Przejście na stronę
    console.log("📄 Ładowanie strony...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Oczekiwanie na załadowanie dynamicznej zawartości
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Obsługa zgód na cookies tymczasowo wyłączona
    console.log("🍪 Obsługa zgód na cookies tymczasowo wyłączona");
    // TODO: Ponownie włączyć obsługę zgód na cookies gdy będzie potrzebne

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
}

// --- Główna pętla ---
async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    console.log("❌ Proszę podać URL do analizy");
    console.log("Użycie: node index.js <url1> <url2> ...");
    process.exit(1);
  }

  console.log("🌍 PODSUMOWANIE RAPORTU EKO");
  console.log("──────────────────────────────");

  const results = [];

  for (const url of urls) {
    try {
      const result = await runLighthouseWithCookieHandling(url);
      results.push({ url, ...result });
    } catch (error) {
      console.log(`❌ Błąd dla ${url}: ${error.message}`);
      results.push({ url, error: error.message });
    }
  }

  console.log("──────────────────────────────");

  const successfulResults = results.filter((r) => !r.error);
  if (successfulResults.length > 0) {
    const avgEcoScore =
      successfulResults.reduce((sum, r) => sum + r.ecoData.ecoScore, 0) /
      successfulResults.length;
    const grade =
      avgEcoScore >= 80
        ? "A"
        : avgEcoScore >= 60
        ? "B"
        : avgEcoScore >= 40
        ? "C"
        : avgEcoScore >= 20
        ? "D"
        : "F";
    console.log(`🌱 Średni EcoScore: ${avgEcoScore.toFixed(1)} (${grade})`);
  } else {
    console.log("🌱 Średni EcoScore: NaN (G)");
  }

  console.log("──────────────────────────────");
}

// Uruchomienie głównej funkcji
main().catch(console.error);
