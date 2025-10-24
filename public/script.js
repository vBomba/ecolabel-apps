// --- Elementy DOM ---
const urlInput = document.getElementById("url-input");
const analyzeBtn = document.getElementById("analyze-btn");
const progressSection = document.getElementById("progress-section");
const resultsSection = document.getElementById("results-section");
const errorSection = document.getElementById("error-section");

// --- Elementy paska postępu ---
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const steps = {
  loading: document.getElementById("step-loading"),
  lighthouse: document.getElementById("step-lighthouse"),
  analysis: document.getElementById("step-analysis"),
  complete: document.getElementById("step-complete"),
};

// --- Elementy wyników ---
const analyzedUrl = document.getElementById("analyzed-url");
const scoreValue = document.getElementById("score-value");
const scoreGrade = document.getElementById("score-grade");
const scoreDescription = document.getElementById("score-description");
const scoreCircle = document.getElementById("score-circle");
const performanceValue = document.getElementById("performance-value");
const sizeValue = document.getElementById("size-value");
const bootupValue = document.getElementById("bootup-value");
const hostingValue = document.getElementById("hosting-value");
const imagesValue = document.getElementById("images-value");
const clsValue = document.getElementById("cls-value");
const recommendationsList = document.getElementById("recommendations-list");

// --- Dodaj nowe elementy do analizy wielostronowej ---
const multiPageSection = document.getElementById("multi-page-section");
const multiUrlsInput = document.getElementById("multi-urls-input");
const analyzeMultiBtn = document.getElementById("analyze-multi-btn");
const multiResults = document.getElementById("multi-results");

// --- Przyciski akcji ---
const newAnalysisBtn = document.getElementById("new-analysis-btn");
const downloadReportBtn = document.getElementById("download-report-btn");
const retryBtn = document.getElementById("retry-btn");

// --- Stan ---
let currentAnalysisId = null;
let currentReport = null;

// --- Słuchacze zdarzeń ---
analyzeBtn.addEventListener("click", startAnalysis);
newAnalysisBtn.addEventListener("click", resetForm);
retryBtn.addEventListener("click", retryAnalysis);
downloadReportBtn.addEventListener("click", downloadReport);

// --- Dodaj słuchacz wielostronowy ---
if (analyzeMultiBtn) {
  analyzeMultiBtn.addEventListener("click", startMultiPageAnalysis);
}

if (multiUrlsInput) {
  multiUrlsInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      startMultiPageAnalysis();
    }
  });
}

urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    startAnalysis();
  }
});

// --- Główna funkcja analizy ---
async function startAnalysis() {
  const url = urlInput.value.trim();

  if (!url) {
    showError("Proszę wprowadzić URL do analizy");
    return;
  }

  if (!isValidUrl(url)) {
    showError("Proszę wprowadzić prawidłowy URL (np. https://example.com)");
    return;
  }

  try {
    // Resetuj interfejs
    hideAllSections();
    showProgress();
    resetProgress();

    // Wyłącz formularz
    analyzeBtn.disabled = true;
    urlInput.disabled = true;

    // Rozpocznij analizę
    await performAnalysis(url);
  } catch (error) {
    console.error("Błąd analizy:", error);
    showError(`Błąd analizy: ${error.message}`);
  } finally {
    // Re-enable form
    analyzeBtn.disabled = false;
    urlInput.disabled = false;
  }
}

// --- Przeprowadź właściwą analizę ---
async function performAnalysis(url) {
  try {
    // Etap 1: Ładowanie strony
    updateProgress(0, "Ładowanie strony...", "loading");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Etap 2: Analiza Lighthouse
    updateProgress(25, "Uruchamianie analizy Lighthouse...", "lighthouse");

    // Symuluj aktualizacje postępu
    const progressInterval = setInterval(() => {
      const currentProgress = parseInt(progressFill.style.width) || 25;
      if (currentProgress < 75) {
        updateProgress(currentProgress + 5, "Analiza w toku...", "lighthouse");
      }
    }, 1000);

    // Etap 3: Obliczanie EcoScore
    updateProgress(75, "Obliczanie EcoScore...", "analysis");

    const result = await response.json();

    clearInterval(progressInterval);

    // Etap 4: Complete
    updateProgress(100, "Analiza zakończona!", "complete");

    // Store results
    currentReport = result;
    currentAnalysisId = result.filename;

    // Show results after a short delay
    setTimeout(() => {
      showResults(result);
    }, 1000);
  } catch (error) {
    throw new Error(`Błąd podczas analizy: ${error.message}`);
  }
}

// --- Zaktualizuj pasek postępu ---
function updateProgress(percentage, text, activeStep) {
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = text;

  // Zaktualizuj stany kroków
  Object.values(steps).forEach((step) => {
    step.classList.remove("active", "completed");
  });

  if (activeStep === "loading") {
    steps.loading.classList.add("active");
  } else if (activeStep === "lighthouse") {
    steps.loading.classList.add("completed");
    steps.lighthouse.classList.add("active");
  } else if (activeStep === "analysis") {
    steps.loading.classList.add("completed");
    steps.lighthouse.classList.add("completed");
    steps.analysis.classList.add("active");
  } else if (activeStep === "complete") {
    steps.loading.classList.add("completed");
    steps.lighthouse.classList.add("completed");
    steps.analysis.classList.add("completed");
    steps.complete.classList.add("active");
  }
}

// --- Pokaż wyniki ---
function showResults(result) {
  hideAllSections();
  resultsSection.classList.remove("hidden");

  // Zaktualizuj wyświetlanie adresu URL
  analyzedUrl.textContent = result.url;

  // Zaktualizuj wynik
  const ecoScore = result.ecoData.ecoScore;
  const grade = getGrade(ecoScore);

  scoreValue.textContent = ecoScore;
  scoreGrade.textContent = grade;
  scoreGrade.className = `grade-${grade}`;
  scoreCircle.className = `score-circle grade-${grade}`;

  // Update score description
  scoreDescription.textContent = getScoreDescription(ecoScore, grade);

  // Update metrics
  performanceValue.textContent = `${result.ecoData.performance.toFixed(1)}/100`;
  sizeValue.textContent = `${(result.ecoData.totalBytes / 1024).toFixed(1)} KB`;
  bootupValue.textContent = `${result.ecoData.bootupTime.toFixed(1)} ms`;
  hostingValue.textContent = result.ecoData.hostingGreen ? "Tak" : "Nie";
  imagesValue.textContent = result.ecoData.imageOptimization ? "Tak" : "Nie";
  clsValue.textContent = result.ecoData.cls.toFixed(3);

  // Update recommendations
  updateRecommendations(result.ecoData);

  // Update score circle animation
  setTimeout(() => {
    const percentage = (ecoScore / 100) * 360;
    scoreCircle.style.background = `conic-gradient(#4CAF50 0deg, #4CAF50 ${percentage}deg, #e0e0e0 ${percentage}deg)`;
  }, 100);
}

// --- Zaktualizuj rekomendacje na podstawie wyników analizy ---
function updateRecommendations(ecoData) {
  const recommendations = [];

  if (ecoData.performance < 50) {
    recommendations.push(
      "Zoptymalizuj wydajność strony - użyj minifikacji CSS i JavaScript"
    );
  }

  if (ecoData.totalBytes > 1000000) {
    recommendations.push(
      "Zmniejsz rozmiar strony - zoptymalizuj obrazy i usuń niepotrzebne zasoby"
    );
  }

  if (ecoData.bootupTime > 1000) {
    recommendations.push(
      "Popraw czas ładowania JavaScript - użyj lazy loading i code splitting"
    );
  }

  if (!ecoData.hostingGreen) {
    recommendations.push(
      "Rozważ przejście na zielony hosting, który wykorzystuje energię odnawialną"
    );
  }

  if (!ecoData.imageOptimization) {
    recommendations.push(
      "Zoptymalizuj obrazy - użyj nowoczesnych formatów (WebP, AVIF) i kompresji"
    );
  }

  if (ecoData.cls > 0.1) {
    recommendations.push(
      "Zmniejsz Cumulative Layout Shift - ustaw wymiary dla obrazów i reklam"
    );
  }

  // Add general recommendations
  recommendations.push("Używaj cache'owania dla zasobów statycznych");
  recommendations.push("Minimalizuj liczbę zapytań HTTP");
  recommendations.push("Używaj CDN do szybszej dostawy treści");

  // Update recommendations list
  recommendationsList.innerHTML = "";
  recommendations.forEach((rec) => {
    const li = document.createElement("li");
    li.textContent = rec;
    recommendationsList.appendChild(li);
  });
}

// --- Pobierz ocenę na podstawie wyniku ---
function getGrade(score) {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

// --- Pobierz opis wyniku ---
function getScoreDescription(score, grade) {
  const descriptions = {
    A: "Doskonale! Twoja strona ma wysoką efektywność ekologiczną",
    B: "Dobrze! Twoja strona ma dobrą efektywność ekologiczną z niewielkim marginesem na poprawę",
    C: "Zadowalająco. Twoja strona wymaga umiarkowanych poprawek ekologiczności",
    D: "Wymaga poprawy. Twoja strona ma znaczące problemy z efektywnością ekologiczną",
    F: "Krytycznie. Twoja strona wymaga radykalnych poprawek ekologiczności",
  };
  return descriptions[grade] || "Nieokreślone";
}

// --- Pokaż błąd ---
function showError(message) {
  hideAllSections();
  errorSection.classList.remove("hidden");
  document.getElementById("error-message").textContent = message;
}

// --- Pokaż postęp ---
function showProgress() {
  hideAllSections();
  progressSection.classList.remove("hidden");
}

// --- Ukryj wszystkie sekcje ---
function hideAllSections() {
  progressSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  errorSection.classList.add("hidden");
}

// --- Resetuj postęp ---
function resetProgress() {
  progressFill.style.width = "0%";
  progressText.textContent = "Przygotowywanie do analizy...";
  Object.values(steps).forEach((step) => {
    step.classList.remove("active", "completed");
  });
}

// --- Resetuj formularz ---
function resetForm() {
  urlInput.value = "";
  hideAllSections();
  currentReport = null;
  currentAnalysisId = null;
}

// --- Ponów analizę ---
function retryAnalysis() {
  if (urlInput.value.trim()) {
    startAnalysis();
  } else {
    resetForm();
  }
}

// --- Pobierz raport ---
function downloadReport() {
  if (!currentReport) {
    showError("Brak raportu do pobrania");
    return;
  }

  const dataStr = JSON.stringify(currentReport, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = currentAnalysisId || "ecolabel-report.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// --- Analiza wielostronowa ---
async function startMultiPageAnalysis() {
  const urlsText = multiUrlsInput.value.trim();

  if (!urlsText) {
    showError("Proszę wprowadzić co najmniej jeden URL");
    return;
  }

  // Parse URLs (one per line)
  const urls = urlsText
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (urls.length === 0) {
    showError("Proszę wprowadzić prawidłowe adresy URL");
    return;
  }

  if (urls.length > 10) {
    showError("Maksymalnie 10 URL-i na zapytanie");
    return;
  }

  // Validate all URLs
  for (const url of urls) {
    if (!isValidUrl(url)) {
      showError(`Nieprawidłowy URL: ${url}`);
      return;
    }
  }

  try {
    // Reset UI
    hideAllSections();
    showProgress();
    resetProgress();

    // Disable form
    analyzeMultiBtn.disabled = true;
    multiUrlsInput.disabled = true;

    // Start analysis
    await performMultiPageAnalysis(urls);
  } catch (error) {
    console.error("Multi-page analysis error:", error);
    showError(`Błąd analizy: ${error.message}`);
  } finally {
    // Re-enable form
    analyzeMultiBtn.disabled = false;
    multiUrlsInput.disabled = false;
  }
}

// --- Wykonaj analizę wielostronną ---
async function performMultiPageAnalysis(urls) {
  try {
    updateProgress(
      0,
      `Rozpoczynanie analizy ${urls.length} stron...`,
      "loading"
    );

    const response = await fetch("/api/analyze-multiple", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    updateProgress(50, "Analiza Lighthouse w toku...", "lighthouse");

    const progressInterval = setInterval(() => {
      const currentProgress = parseInt(progressFill.style.width) || 50;
      if (currentProgress < 75) {
        updateProgress(currentProgress + 3, "Analiza w toku...", "lighthouse");
      }
    }, 1000);

    updateProgress(75, "Obliczanie EcoScore dla serwisu...", "analysis");

    const result = await response.json();

    clearInterval(progressInterval);

    updateProgress(100, "Analiza zakończona!", "complete");

    // Store results
    currentReport = result;
    currentAnalysisId = `website-report-${result.domain}`;

    setTimeout(() => {
      showMultiPageResults(result);
    }, 1000);
  } catch (error) {
    throw new Error(`Błąd podczas analizy: ${error.message}`);
  }
}

// --- Pokaż wyniki wielostronne ---
function showMultiPageResults(result) {
  hideAllSections();

  const resultsDiv = document.getElementById("results-section");
  resultsDiv.classList.remove("hidden");

  // Update header
  analyzedUrl.textContent = `Serwis: ${result.domain} (${result.successfulAnalyses} stron)`;

  // Update score
  const ecoScore = result.aggregatedEcoData.ecoScore;
  const label = result.ecoLabel;

  scoreValue.textContent = ecoScore;
  scoreGrade.textContent = label.grade;
  scoreGrade.className = `grade-${label.grade}`;
  scoreCircle.className = `score-circle grade-${label.grade}`;
  scoreCircle.style.background = `conic-gradient(${label.color} 0deg, ${
    label.color
  } ${(ecoScore / 100) * 360}deg, #e0e0e0 ${(ecoScore / 100) * 360}deg)`;

  // Update score description
  scoreDescription.textContent = `${label.label} - Średnia ocena wszystkich ${result.successfulAnalyses} analizowanych stron`;

  // Update metrics
  const data = result.aggregatedEcoData;
  performanceValue.textContent = `${data.performance.toFixed(1)}/100`;
  sizeValue.textContent = `${(data.totalBytes / 1024).toFixed(1)} KB`;
  bootupValue.textContent = `${data.bootupTime.toFixed(1)} ms`;
  hostingValue.textContent = data.hostingGreen ? "✅ Tak" : "❌ Nie";
  imagesValue.textContent = data.imageOptimization ? "✅ Tak" : "❌ Nie";
  clsValue.textContent = data.cls.toFixed(3);

  // Show individual page results
  const pagesHtml = result.pages
    .map(
      (page, i) => `
    <div class="page-result">
      <div class="page-number">${i + 1}</div>
      <div class="page-url">${page.url}</div>
      <div class="page-score">
        <span class="score ${getGrade(page.ecoData.ecoScore)}">${
        page.ecoData.ecoScore
      }</span>
        <span class="performance">${page.ecoData.performance.toFixed(
          0
        )}/100</span>
      </div>
    </div>
  `
    )
    .join("");

  const pagesContainer =
    document.getElementById("pages-list") || createPagesContainer();
  pagesContainer.innerHTML = pagesHtml;

  updateRecommendations(data);
}

// --- Utwórz kontener z listą stron, jeśli nie istnieje ---
function createPagesContainer() {
  const container = document.createElement("div");
  container.id = "pages-list";
  container.className = "pages-list";
  const resultsSection = document.getElementById("results-section");
  resultsSection.appendChild(container);
  return container;
}

// --- Pobierz raport wielostronny ---
function downloadMultiPageReport() {
  if (!currentReport) {
    showError("Brak raportu do pobrania");
    return;
  }

  const dataStr = JSON.stringify(currentReport, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    currentAnalysisId || `website-report-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// --- Waliduj adres URL ---
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// --- Zainicjuj aplikację ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("Interfejs EcoLabel zainicjalizowany");

  // Ustaw fokus na wejściu URL
  urlInput.focus();

  // Dodaj przykładowe adresy URL do testowania
  const sampleUrls = [
    "https://www.example.com/",
    "https://www.example.com/about",
    "https://www.example.com/services",
  ];

  // Możesz dodać tutaj dropdown lub sugestie
});
