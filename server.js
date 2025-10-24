import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";
import lighthouse from "lighthouse";
import fs from "fs";
import cors from "cors";
import { getBrowserPath } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

  return { ecoData, filename, report };
}

// --- Główna funkcja analizy ---
async function runLighthouseWithCookieHandling(url) {
  console.log(`\n🔍 Analizuję ${url} ...`);

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
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
    // Ustawienie viewport dla desktop
    await page.setViewport({ width: 1920, height: 1080 });

    // Przejście na stronę
    console.log("📄 Ładowanie strony...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Oczekiwanie na załadowanie dynamicznej zawartości
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Obsługa zgód na cookies tymczasowo wyłączona
    console.log("🍪 Obsługa zgód na cookies tymczasowo wyłączona");

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

    // Return the result with URL
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server with error handling for port conflicts
const server = app.listen(PORT, () => {
  console.log(`🌍 EcoLabel Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🌱 Ready to analyze websites!`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log(`Trying port ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`🌍 EcoLabel Server running on http://localhost:${PORT + 1}`);
      console.log(`📊 API available at http://localhost:${PORT + 1}/api`);
      console.log(`🌱 Ready to analyze websites!`);
    });
  } else {
    console.error(err);
  }
});

export default app;
