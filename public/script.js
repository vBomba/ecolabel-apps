// DOM Elements
const urlInput = document.getElementById("url-input");
const analyzeBtn = document.getElementById("analyze-btn");
const progressSection = document.getElementById("progress-section");
const resultsSection = document.getElementById("results-section");
const errorSection = document.getElementById("error-section");

// Progress elements
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const steps = {
  loading: document.getElementById("step-loading"),
  lighthouse: document.getElementById("step-lighthouse"),
  analysis: document.getElementById("step-analysis"),
  complete: document.getElementById("step-complete"),
};

// Results elements
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

// Action buttons
const newAnalysisBtn = document.getElementById("new-analysis-btn");
const downloadReportBtn = document.getElementById("download-report-btn");
const retryBtn = document.getElementById("retry-btn");

// State
let currentAnalysisId = null;
let currentReport = null;

// Event listeners
analyzeBtn.addEventListener("click", startAnalysis);
newAnalysisBtn.addEventListener("click", resetForm);
retryBtn.addEventListener("click", retryAnalysis);
downloadReportBtn.addEventListener("click", downloadReport);

urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    startAnalysis();
  }
});

// Main analysis function
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
    // Reset UI
    hideAllSections();
    showProgress();
    resetProgress();

    // Disable form
    analyzeBtn.disabled = true;
    urlInput.disabled = true;

    // Start analysis
    await performAnalysis(url);
  } catch (error) {
    console.error("Analysis error:", error);
    showError(`Błąd analizy: ${error.message}`);
  } finally {
    // Re-enable form
    analyzeBtn.disabled = false;
    urlInput.disabled = false;
  }
}

// Perform the actual analysis
async function performAnalysis(url) {
  try {
    // Step 1: Loading page
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

    // Step 2: Lighthouse analysis
    updateProgress(25, "Uruchamianie analizy Lighthouse...", "lighthouse");

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      const currentProgress = parseInt(progressFill.style.width) || 25;
      if (currentProgress < 75) {
        updateProgress(currentProgress + 5, "Analiza w toku...", "lighthouse");
      }
    }, 1000);

    // Step 3: Analysis calculation
    updateProgress(75, "Obliczanie EcoScore...", "analysis");

    const result = await response.json();

    clearInterval(progressInterval);

    // Step 4: Complete
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

// Update progress UI
function updateProgress(percentage, text, activeStep) {
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = text;

  // Update step states
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

// Show results
function showResults(result) {
  hideAllSections();
  resultsSection.classList.remove("hidden");

  // Update URL display
  analyzedUrl.textContent = result.url;

  // Update score
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

// Update recommendations based on analysis results
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

// Get grade based on score
function getGrade(score) {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

// Get score description
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

// Show error
function showError(message) {
  hideAllSections();
  errorSection.classList.remove("hidden");
  document.getElementById("error-message").textContent = message;
}

// Show progress
function showProgress() {
  hideAllSections();
  progressSection.classList.remove("hidden");
}

// Hide all sections
function hideAllSections() {
  progressSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  errorSection.classList.add("hidden");
}

// Reset progress
function resetProgress() {
  progressFill.style.width = "0%";
  progressText.textContent = "Przygotowywanie do analizy...";
  Object.values(steps).forEach((step) => {
    step.classList.remove("active", "completed");
  });
}

// Reset form
function resetForm() {
  urlInput.value = "";
  hideAllSections();
  currentReport = null;
  currentAnalysisId = null;
}

// Retry analysis
function retryAnalysis() {
  if (urlInput.value.trim()) {
    startAnalysis();
  } else {
    resetForm();
  }
}

// Download report
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

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("EcoLabel UI zainicjalizowany");

  // Focus on URL input
  urlInput.focus();

  // Add some sample URLs for testing
  const sampleUrls = [
    "https://www.bnpparibas.pl/",
    "https://example.com",
    "https://www.google.com",
  ];

  // You can add a dropdown or suggestions here if needed
});
