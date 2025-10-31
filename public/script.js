// Przełączanie zakładek
document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Usuń klasę active ze wszystkich przycisków i treści
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Dodaj klasę active do klikniętego przycisku i docelowej treści
      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });
});

// Elementy DOM - wspólny input dla wszystkich funkcji
const commonUrlInput = document.getElementById("common-url-input");
const analyzeBtn = document.getElementById("analyze-btn");
const performanceBtn = document.getElementById("performance-btn");
const clearBtn = document.getElementById("clear-btn");
const progressSection = document.getElementById("progress-section");
const resultsSection = document.getElementById("results-section");
const errorSection = document.getElementById("error-section");

// Elementy paska postępu
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const progressSteps = document.querySelector(".progress-steps");
const steps = {
  loading: document.getElementById("step-loading"),
  lighthouse: document.getElementById("step-lighthouse"),
  analysis: document.getElementById("step-analysis"),
  complete: document.getElementById("step-complete"),
};

// --- Elementy wyników ---
const analyzedUrl = document.getElementById("analyzed-url");
const scoreValue = document.getElementById("score-value");
const scoreDescription = document.getElementById("score-description");
const scoreCircle = document.getElementById("score-circle");
const performanceValue = document.getElementById("performance-value");
const sizeValue = document.getElementById("size-value");
const bootupValue = document.getElementById("bootup-value");
const hostingValue = document.getElementById("hosting-value");
const imagesValue = document.getElementById("images-value");
const clsValue = document.getElementById("cls-value");
const recommendationsList = document.getElementById("recommendations-list");

// --- Przyciski akcji ---
const newAnalysisBtn = document.getElementById("new-analysis-btn");
const downloadReportBtn = document.getElementById("download-report-btn");
const retryBtn = document.getElementById("retry-btn");

// --- Stan ---
let currentAnalysisId = null;
let currentReport = null;
let analysisStartTime = null;
let analysisTimerInterval = null;
let progressTextUpdateInterval = null;
let currentProgressMessage = "";

// --- Słuchacze zdarzeń ---
analyzeBtn.addEventListener("click", handleEcoAnalysis);
if (performanceBtn) {
  performanceBtn.addEventListener("click", loadResults);
}
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (commonUrlInput) {
      commonUrlInput.value = "";
      commonUrlInput.focus();
    }
  });
}
newAnalysisBtn.addEventListener("click", resetForm);
retryBtn.addEventListener("click", retryAnalysis);
downloadReportBtn.addEventListener("click", downloadReport);

// Obsługa Enter w wspólnym input
if (commonUrlInput) {
  commonUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Enter lub Cmd+Enter = uruchom analizę
      e.preventDefault();
      handleEcoAnalysis();
    }
  });
}

// --- Pomocnicza funkcja do parsowania URL z wspólnego input ---
function getUrlsFromCommonInput() {
  if (!commonUrlInput) return [];
  const text = commonUrlInput.value.trim();
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// --- Funkcja obsługująca analizę Eco (automatycznie wybiera single lub multi) ---
async function handleEcoAnalysis() {
  let urls = getUrlsFromCommonInput();

  // Jeśli input pusty, użyj domyślnego URL
  if (urls.length === 0) {
    urls = ["https://example.com"];
  }

  // Jeśli jeden URL - analiza pojedyncza, jeśli więcej - analiza wielostronowa
  if (urls.length === 1) {
    await startAnalysis();
  } else {
    await startMultiPageAnalysis();
  }
}

// --- Główna funkcja analizy pojedynczej strony ---
async function startAnalysis() {
  let urls = getUrlsFromCommonInput();

  // Jeśli input pusty, użyj domyślnego URL
  if (urls.length === 0) {
    urls = ["https://example.com"];
  }

  // Dla analizy pojedynczej bierzemy pierwszy URL
  const url = urls[0];

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
    if (commonUrlInput) commonUrlInput.disabled = true;

    // Rozpocznij analizę
    await performAnalysis(url);
  } catch (error) {
    console.error("Błąd analizy:", error);
    showError(`Błąd analizy: ${error.message}`);
  } finally {
    // Re-enable form
    analyzeBtn.disabled = false;
    if (commonUrlInput) commonUrlInput.disabled = false;
  }
}

// --- Przeprowadź właściwą analizę ---
async function performAnalysis(url) {
  try {
    // Start timer
    analysisStartTime = Date.now();
    let elapsedSeconds = 0;

    // Update timer every 100ms for smooth updates
    analysisTimerInterval = setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    }, 100);

    // Update progress text display with timer every 100ms for real-time updates
    progressTextUpdateInterval = setInterval(() => {
      if (currentProgressMessage) {
        progressText.textContent = `${currentProgressMessage} (${elapsedSeconds}s)`;
      }
    }, 100);

    // Etap 1: Ładowanie strony - z widoczną animacją
    updateProgress(5, `Ładowanie strony... (${elapsedSeconds}s)`, "loading");
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Widoczna pauza

    let response;
    try {
      response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
    } catch (fetchError) {
      console.error("Błąd połączenia:", fetchError);
      throw new Error(
        `Błąd połączenia z serwerem: ${fetchError.message}. Sprawdź czy serwer działa na http://localhost:3000`
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorText;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    // Etap 2: Analiza Lighthouse - z widoczną zmianą kroku
    elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgress(
      30,
      `Uruchamianie analizy Lighthouse... (${elapsedSeconds}s)`,
      "lighthouse"
    );
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Widoczna pauza

    // Wait for the API response
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error("Błąd parsowania JSON:", jsonError);
      throw new Error(
        "Błąd parsowania odpowiedzi z serwera. Serwer zwrócił nieprawidłowy format danych."
      );
    }

    // Etap 3: Obliczanie EcoScore - z widoczną zmianą kroku
    elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgress(
      90,
      `Obliczanie EcoScore... (${elapsedSeconds}s)`,
      "analysis"
    );
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Widoczna pauza przed zakończeniem

    // Clear all intervals
    clearInterval(analysisTimerInterval);
    clearInterval(progressTextUpdateInterval);

    // Etap 4: Complete - z widoczną zmianą kroku
    elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgress(100, `Analiza zakończona! (${elapsedSeconds}s)`, "complete");
    await new Promise((resolve) => setTimeout(resolve, 800)); // Krótka pauza przed pokazaniem wyników

    // Store results
    currentReport = result;
    currentAnalysisId = result.filename;

    // Clear all intervals
    clearInterval(analysisTimerInterval);
    clearInterval(progressTextUpdateInterval);

    // Show results after a short delay
    setTimeout(() => {
      showResults(result);
    }, 1000);
  } catch (error) {
    clearInterval(analysisTimerInterval);
    clearInterval(progressTextUpdateInterval);
    throw new Error(`Błąd podczas analizy: ${error.message}`);
  }
}

// --- Zaktualizuj pasek postępu z animacjami ---
function updateProgress(percentage, text, activeStep) {
  // Płynna animacja paska postępu
  progressFill.style.transition = "width 0.6s ease-out";
  progressFill.style.width = `${percentage}%`;

  // Extract message without the time part (remove anything like "(Xs)")
  currentProgressMessage = text.replace(/ \(\d+s\)$/, "");
  progressText.textContent = text;
  progressText.style.transition = "opacity 0.3s ease-in-out";

  // Animacja zmiany tekstu (krótkie mruganie)
  progressText.style.opacity = "0.5";
  setTimeout(() => {
    progressText.style.opacity = "1";
  }, 150);

  // Zaktualizuj stany kroków z animacjami
  Object.values(steps).forEach((step) => {
    step.classList.remove("active", "completed");
    step.style.transition = "all 0.4s ease-in-out";
  });

  // Dodaj opóźnienia dla lepszej widoczności przejść
  if (activeStep === "loading") {
    setTimeout(() => {
      steps.loading.classList.add("active");
    }, 100);
  } else if (activeStep === "lighthouse") {
    setTimeout(() => {
      steps.loading.classList.add("completed");
      steps.lighthouse.classList.add("active");
    }, 200);
  } else if (activeStep === "analysis") {
    setTimeout(() => {
      steps.loading.classList.add("completed");
      steps.lighthouse.classList.add("completed");
      steps.analysis.classList.add("active");
    }, 300);
  } else if (activeStep === "complete") {
    setTimeout(() => {
      steps.loading.classList.add("completed");
      steps.lighthouse.classList.add("completed");
      steps.analysis.classList.add("completed");
      steps.complete.classList.add("active");
    }, 400);
  }
}

// --- Pokaż wyniki ---
function showResults(result) {
  // Upewnij się, że zakładka Eco Analysis jest aktywna
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  const ecoAnalysisTab = document.getElementById("eco-analysis");

  // Przełącz na zakładkę Eco Analysis
  tabButtons.forEach((btn) => btn.classList.remove("active"));
  tabContents.forEach((content) => content.classList.remove("active"));

  const ecoTabButton = document.querySelector('[data-tab="eco-analysis"]');
  if (ecoTabButton) {
    ecoTabButton.classList.add("active");
  }
  if (ecoAnalysisTab) {
    ecoAnalysisTab.classList.add("active");
  }

  hideAllSections();
  resultsSection.classList.remove("hidden");

  // Zaktualizuj wyświetlanie adresu URL
  analyzedUrl.textContent = result.url;

  // Zaktualizuj wynik
  const ecoScore = result.ecoData.ecoScore;
  const grade = getGrade(ecoScore);

  scoreValue.textContent = ecoScore;
  scoreCircle.className = `score-circle grade-${grade}`;

  // Podświetl odpowiednią klasę w etykiecie energetycznej
  const energyLabel = document.getElementById("energy-label");
  if (energyLabel) {
    energyLabel.querySelectorAll(".energy-class").forEach((el) => {
      el.classList.remove("active");
      // Usuń inline style aby użyć CSS
      el.style.transform = "";
      el.style.boxShadow = "";
      el.style.zIndex = "";
      el.style.border = "";
      el.style.margin = "";
    });
    const activeClass = energyLabel.querySelector(`.grade-${grade}`);
    if (activeClass) {
      activeClass.classList.add("active");
    }
  }

  // Update score description
  scoreDescription.textContent = getScoreDescription(ecoScore, grade);

  // Update metrics
  performanceValue.textContent = `${result.ecoData.performance.toFixed(1)}/100`;
  sizeValue.textContent = `${(result.ecoData.totalBytes / 1024).toFixed(1)} KB`;
  bootupValue.textContent = `${result.ecoData.bootupTime.toFixed(1)} ms`;
  hostingValue.textContent = result.ecoData.hostingGreen ? "Tak" : "Nie";
  imagesValue.textContent = result.ecoData.imageOptimization ? "Tak" : "Nie";
  clsValue.textContent = result.ecoData.cls.toFixed(3);

  // Apply color coding to metric cards
  applyMetricColor(
    performanceValue.closest(".metric-card"),
    result.ecoData.performance,
    true,
    0,
    100
  );
  applyMetricColor(
    sizeValue.closest(".metric-card"),
    result.ecoData.totalBytes,
    false,
    0,
    2000000
  ); // 2MB max
  applyMetricColor(
    bootupValue.closest(".metric-card"),
    result.ecoData.bootupTime,
    false,
    0,
    2000
  ); // 2s max
  applyMetricColor(
    hostingValue.closest(".metric-card"),
    result.ecoData.hostingGreen ? 100 : 0,
    true,
    0,
    100
  );
  applyMetricColor(
    imagesValue.closest(".metric-card"),
    result.ecoData.imageOptimization ? 100 : 0,
    true,
    0,
    100
  );
  applyMetricColor(
    clsValue.closest(".metric-card"),
    result.ecoData.cls,
    false,
    0,
    0.25
  ); // CLS: lower is better

  // Update recommendations
  updateRecommendations(result.ecoData);

  // Update CO2 emissions
  console.log("🌍 Sprawdzanie danych CO2:", {
    hasCo2: !!result.ecoData.co2,
    co2Data: result.ecoData.co2,
    ecoData: result.ecoData,
  });

  // Szczegółowe logowanie wartości równoważników jeśli są dostępne
  if (result.ecoData.co2) {
    console.log("🌍 Szczegóły równoważników CO2:", {
      totalCO2: result.ecoData.co2.totalCO2,
      equivalentTrees: result.ecoData.co2.equivalentTrees,
      equivalentCarsKm: result.ecoData.co2.equivalentCarsKm,
      treesType: typeof result.ecoData.co2.equivalentTrees,
      carsKmType: typeof result.ecoData.co2.equivalentCarsKm,
    });
  }

  const co2Total = document.getElementById("co2-total");
  const co2Trees = document.getElementById("co2-trees");
  const co2Cars = document.getElementById("co2-cars");

  if (result.ecoData.co2 && typeof result.ecoData.co2 === "object") {
    console.log("🌍 Elementy DOM dla CO2:", {
      co2Total: !!co2Total,
      co2Trees: !!co2Trees,
      co2Cars: !!co2Cars,
    });

    // Walidacja wartości CO2
    if (
      typeof result.ecoData.co2.totalCO2 !== "number" ||
      typeof result.ecoData.co2.equivalentTrees !== "number" ||
      typeof result.ecoData.co2.equivalentCarsKm !== "number"
    ) {
      console.error("⚠️ Błędne dane CO2:", result.ecoData.co2);
      if (co2Total) co2Total.textContent = "N/A";
      if (co2Trees) co2Trees.textContent = "N/A";
      if (co2Cars) co2Cars.textContent = "N/A";
    } else {
      if (co2Total) {
        // Wyświetl w odpowiedniej jednostce (mg dla małych wartości, g dla większych)
        // totalCO2 jest w kg, więc konwertujemy do gramów
        let co2Display = "";
        const totalCO2Kg = result.ecoData.co2.totalCO2;
        const totalGrams = totalCO2Kg * 1000;

        if (totalGrams < 1) {
          // Mniej niż 1g - wyświetl w mg
          co2Display = `${(totalGrams * 1000).toFixed(2)} mg`;
        } else if (totalGrams < 1000) {
          // Mniej niż 1000g (1kg) - wyświetl w gramach
          co2Display = `${totalGrams.toFixed(2)} g`;
        } else {
          // Więcej niż 1kg - wyświetl w kg
          co2Display = `${totalCO2Kg.toFixed(4)} kg`;
        }
        co2Total.textContent = co2Display;
      }
      if (co2Trees) {
        const trees = result.ecoData.co2.equivalentTrees;
        // Poprawione formatowanie dla bardzo małych wartości
        // Sprawdź czy wartość jest faktycznie 0 lub bardzo bliska 0
        if (trees === 0 || Math.abs(trees) < 1e-10) {
          co2Trees.textContent = "0";
        } else if (trees < 0.00001) {
          // Bardzo małe wartości - pokaż z maksymalną precyzją
          co2Trees.textContent = trees.toFixed(8);
        } else if (trees < 0.0001) {
          // Bardzo małe wartości - pokaż z większą precyzją
          co2Trees.textContent = trees.toFixed(6);
        } else if (trees < 0.01) {
          co2Trees.textContent = trees.toFixed(4);
        } else if (trees < 1) {
          co2Trees.textContent = trees.toFixed(4);
        } else if (trees < 100) {
          co2Trees.textContent = trees.toFixed(2);
        } else {
          co2Trees.textContent = trees.toFixed(0);
        }
      }
      if (co2Cars) {
        const km = result.ecoData.co2.equivalentCarsKm;
        // Poprawione formatowanie dla bardzo małych wartości
        // Sprawdź czy wartość jest faktycznie 0 lub bardzo bliska 0
        if (km === 0 || Math.abs(km) < 1e-10) {
          co2Cars.textContent = "0 m";
        } else if (km < 0.00001) {
          // Bardzo małe wartości - wyświetl w metrach z większą precyzją
          const meters = km * 1000;
          if (meters < 0.001) {
            // Mniej niż 1mm - pokaż z większą precyzją
            co2Cars.textContent = `${(meters * 1000).toFixed(1)} mm`;
          } else if (meters < 0.01) {
            co2Cars.textContent = `${meters.toFixed(3)} m`;
          } else {
            co2Cars.textContent = `${meters.toFixed(2)} m`;
          }
        } else if (km < 0.001) {
          // Mniej niż 1m - wyświetl w metrach
          const meters = km * 1000;
          co2Cars.textContent = `${meters.toFixed(2)} m`;
        } else if (km < 0.01) {
          co2Cars.textContent = `${(km * 1000).toFixed(1)} m`;
        } else if (km < 1) {
          co2Cars.textContent = `${km.toFixed(3)} km`;
        } else {
          co2Cars.textContent = `${km.toFixed(2)} km`;
        }
      }
    }
  } else {
    console.warn("⚠️ Brak danych CO2 w wyniku analizy");
    // Wyświetl domyślne wartości lub "N/A"
    if (co2Total) co2Total.textContent = "N/A";
    if (co2Trees) co2Trees.textContent = "N/A";
    if (co2Cars) co2Cars.textContent = "N/A";
  }

  // Update score circle animation
  setTimeout(() => {
    const percentage = (ecoScore / 100) * 360;

    // Get color based on grade for dynamic gradient (używamy tych samych kolorów co w $energy-colors)
    const gradeColors = {
      A: "#00852e", // Ciemna zieleń
      B: "#6cae3a", // Jasna zieleń
      C: "#b0cc33", // Żółto-zielony
      D: "#fdd835", // Żółty
      E: "#ff9800", // Pomarańczowy
      F: "#ff5722", // Czerwony
    };

    const fillColor = gradeColors[grade] || "#4CAF50";
    scoreCircle.style.background = `conic-gradient(${fillColor} 0deg, ${fillColor} ${percentage}deg, #e0e0e0 ${percentage}deg)`;
  }, 100);

  // Przewiń do sekcji wyników, aby użytkownik od razu zobaczył wyniki
  setTimeout(() => {
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 300);
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
// Podział zgodny z klasyfikacją energetyczną EU (A-F)
function getGrade(score) {
  if (score >= 80) return "A"; // 80-100: Doskonała
  if (score >= 65) return "B"; // 65-79: Dobra
  if (score >= 50) return "C"; // 50-64: Zadowalająca
  if (score >= 35) return "D"; // 35-49: Wymaga poprawek
  if (score >= 20) return "E"; // 20-34: Znaczące problemy
  return "F"; // 0-19: Krytyczne
}

// --- Pobierz opis wyniku ---
function getScoreDescription(score, grade) {
  const descriptions = {
    A: "Doskonale! Twoja strona ma wysoką efektywność ekologiczną",
    B: "Dobrze! Twoja strona ma dobrą efektywność ekologiczną z niewielkim marginesem na poprawę",
    C: "Zadowalająco. Twoja strona wymaga umiarkowanych poprawek ekologiczności",
    D: "Wymaga poprawy. Twoja strona ma znaczące problemy z efektywnością ekologiczną",
    E: "Znaczące problemy. Twoja strona wymaga poważnych poprawek ekologiczności",
    F: "Krytycznie. Twoja strona wymaga radykalnych poprawek ekologiczności",
  };
  return descriptions[grade] || "Nieokreślone";
}

// --- Funkcja do kolorowania metryk na podstawie wartości ---
function applyMetricColor(card, value, higherIsBetter, min, max) {
  if (!card) return;

  // Normalizuj wartość do 0-100
  let normalizedValue;
  if (higherIsBetter) {
    normalizedValue = ((value - min) / (max - min)) * 100;
  } else {
    // dla wartości gdzie mniejsze jest lepsze (np. CLS, bootup time)
    normalizedValue = ((max - value) / (max - min)) * 100;
  }

  // Ogranicz do 0-100
  normalizedValue = Math.max(0, Math.min(100, normalizedValue));

  // Określ kolor na podstawie znormalizowanej wartości
  let color;
  if (normalizedValue >= 80) {
    color = "#00852e"; // A - ciemna zieleń
  } else if (normalizedValue >= 60) {
    color = "#6cae3a"; // B - jasna zieleń
  } else if (normalizedValue >= 40) {
    color = "#b0cc33"; // C - żółto-zielony
  } else if (normalizedValue >= 20) {
    color = "#fdd835"; // D - żółty
  } else if (normalizedValue >= 10) {
    color = "#ff9800"; // E - pomarańczowy
  } else {
    color = "#ff5722"; // F - czerwony
  }

  // Zastosuj kolor do ikony metryki
  const icon = card.querySelector(".metric-icon");
  if (icon) {
    icon.style.background = color;
  }
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
  // Trigger animation when showing progress
  setTimeout(() => {
    progressSection.classList.add("animate");
  }, 10);
}

// --- Ukryj wszystkie sekcje ---
function hideAllSections() {
  progressSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  errorSection.classList.add("hidden");
}

// --- Resetuj postęp ---
function resetProgress() {
  // Clear any existing timers
  if (analysisTimerInterval) {
    clearInterval(analysisTimerInterval);
    analysisTimerInterval = null;
  }
  if (progressTextUpdateInterval) {
    clearInterval(progressTextUpdateInterval);
    progressTextUpdateInterval = null;
  }

  progressFill.style.width = "0%";
  progressText.textContent = "Przygotowywanie do analizy...";

  // Remove animate from progress steps
  if (progressSteps) {
    progressSteps.classList.remove("animate");
  }

  Object.values(steps).forEach((step) => {
    step.classList.remove("active", "completed", "animate");
  });

  // Add animate class to progress steps
  if (progressSteps) {
    setTimeout(() => {
      progressSteps.classList.add("animate");
    }, 30);
  }

  // Add staggered animations to steps
  const stepArray = Object.values(steps);
  stepArray.forEach((step, index) => {
    setTimeout(() => {
      step.classList.add("animate");
    }, 50 + index * 100);
  });
}

// --- Resetuj formularz ---
function resetForm() {
  if (commonUrlInput) {
    commonUrlInput.value = "";
  }
  hideAllSections();
  currentReport = null;
  currentAnalysisId = null;
}

// --- Ponów analizę ---
function retryAnalysis() {
  const urls = getUrlsFromCommonInput();
  if (urls.length > 0) {
    handleEcoAnalysis();
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
  let urls = getUrlsFromCommonInput();

  // Jeśli input pusty, użyj domyślnego URL
  if (urls.length === 0) {
    urls = ["https://example.com"];
  }

  // Validate URLs
  const validUrls = urls.filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    showError("Proszę wprowadzić prawidłowe adresy URL");
    return;
  }

  if (validUrls.length > 10) {
    showError("Maksymalnie 10 URL-i na raz");
    return;
  }

  // Use validated URLs
  const finalUrls = validUrls;

  try {
    // Reset UI
    hideAllSections();
    showProgress();
    resetProgress();

    // Disable form
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (commonUrlInput) commonUrlInput.disabled = true;

    // Start analysis
    await performMultiPageAnalysis(finalUrls);
  } catch (error) {
    console.error("Multi-page analysis error:", error);
    showError(`Błąd analizy: ${error.message}`);
  } finally {
    // Re-enable form
    if (analyzeBtn) analyzeBtn.disabled = false;
    if (commonUrlInput) commonUrlInput.disabled = false;
  }
}

// --- Wykonaj analizę wielostronną ---
async function performMultiPageAnalysis(urls) {
  let progressInterval = null;

  try {
    // Start timer
    analysisStartTime = Date.now();
    let elapsedSeconds = 0;

    // Update timer every 100ms for smooth updates
    analysisTimerInterval = setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    }, 100);

    // Update progress text display with timer every 100ms for real-time updates
    progressTextUpdateInterval = setInterval(() => {
      if (currentProgressMessage) {
        progressText.textContent = `${currentProgressMessage} (${elapsedSeconds}s)`;
      }
    }, 100);

    // Etap 1: Rozpoczynanie analizy
    elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgress(
      0,
      `Rozpoczynanie analizy ${urls.length} stron... (${elapsedSeconds}s)`,
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

    // Etap 2: Analiza Lighthouse w toku
    elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgress(
      50,
      `Analiza Lighthouse w toku... (${elapsedSeconds}s)`,
      "lighthouse"
    );

    progressInterval = setInterval(() => {
      const currentProgress = parseInt(progressFill.style.width) || 50;
      elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
      if (currentProgress < 75) {
        updateProgress(
          currentProgress + 3,
          `Analiza w toku... (${elapsedSeconds}s)`,
          "lighthouse"
        );
      }
    }, 1000);

    // Etap 3: Obliczanie EcoScore
    elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgress(
      75,
      `Obliczanie EcoScore dla serwisu... (${elapsedSeconds}s)`,
      "analysis"
    );

    const result = await response.json();

    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

    // Etap 4: Zakończenie
    elapsedSeconds = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgress(100, `Analiza zakończona! (${elapsedSeconds}s)`, "complete");

    // Clear all intervals
    clearInterval(analysisTimerInterval);
    clearInterval(progressTextUpdateInterval);

    // Store results
    currentReport = result;
    currentAnalysisId = `website-report-${result.domain}`;

    setTimeout(() => {
      showMultiPageResults(result);
    }, 1000);
  } catch (error) {
    // Clear all intervals on error
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    clearInterval(analysisTimerInterval);
    clearInterval(progressTextUpdateInterval);
    throw new Error(`Błąd podczas analizy: ${error.message}`);
  }
}

// --- Pokaż wyniki wielostronne ---
function showMultiPageResults(result) {
  // Upewnij się, że zakładka Eco Analysis jest aktywna
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  const ecoAnalysisTab = document.getElementById("eco-analysis");

  // Przełącz na zakładkę Eco Analysis
  tabButtons.forEach((btn) => btn.classList.remove("active"));
  tabContents.forEach((content) => content.classList.remove("active"));

  const ecoTabButton = document.querySelector('[data-tab="eco-analysis"]');
  if (ecoTabButton) {
    ecoTabButton.classList.add("active");
  }
  if (ecoAnalysisTab) {
    ecoAnalysisTab.classList.add("active");
  }

  hideAllSections();

  const resultsDiv = document.getElementById("results-section");
  resultsDiv.classList.remove("hidden");

  // Update header
  analyzedUrl.textContent = `Serwis: ${result.domain} (${result.successfulAnalyses} stron)`;

  // Update score - użyj getGrade() zamiast result.ecoLabel
  const ecoScore = result.aggregatedEcoData.ecoScore;
  const grade = getGrade(ecoScore);

  scoreValue.textContent = ecoScore;
  scoreCircle.className = `score-circle grade-${grade}`;

  // Podświetl odpowiednią klasę w etykiecie energetycznej
  const energyLabel = document.getElementById("energy-label");
  if (energyLabel) {
    energyLabel.querySelectorAll(".energy-class").forEach((el) => {
      el.classList.remove("active");
      // Usuń inline style aby użyć CSS
      el.style.transform = "";
      el.style.boxShadow = "";
      el.style.zIndex = "";
      el.style.border = "";
      el.style.margin = "";
    });
    const activeClass = energyLabel.querySelector(`.grade-${grade}`);
    if (activeClass) {
      activeClass.classList.add("active");
    }
  }

  // Update score description - użyj getScoreDescription() zamiast label.label
  scoreDescription.textContent = `${getScoreDescription(
    ecoScore,
    grade
  )} - Średnia ocena wszystkich ${
    result.successfulAnalyses
  } analizowanych stron`;

  // Update metrics
  const data = result.aggregatedEcoData;
  performanceValue.textContent = `${data.performance.toFixed(1)}/100`;
  sizeValue.textContent = `${(data.totalBytes / 1024).toFixed(1)} KB`;
  bootupValue.textContent = `${data.bootupTime.toFixed(1)} ms`;
  hostingValue.textContent = data.hostingGreen ? "Tak" : "Nie";
  imagesValue.textContent = data.imageOptimization ? "Tak" : "Nie";
  clsValue.textContent = data.cls.toFixed(3);

  // Apply color coding to metric cards
  applyMetricColor(
    performanceValue.closest(".metric-card"),
    data.performance,
    true,
    0,
    100
  );
  applyMetricColor(
    sizeValue.closest(".metric-card"),
    data.totalBytes,
    false,
    0,
    2000000
  ); // 2MB max
  applyMetricColor(
    bootupValue.closest(".metric-card"),
    data.bootupTime,
    false,
    0,
    2000
  ); // 2s max
  applyMetricColor(
    hostingValue.closest(".metric-card"),
    data.hostingGreen ? 100 : 0,
    true,
    0,
    100
  );
  applyMetricColor(
    imagesValue.closest(".metric-card"),
    data.imageOptimization ? 100 : 0,
    true,
    0,
    100
  );
  applyMetricColor(clsValue.closest(".metric-card"), data.cls, false, 0, 0.25); // CLS: lower is better

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

  // Update CO2 emissions for multi-page results
  const co2Total = document.getElementById("co2-total");
  const co2Trees = document.getElementById("co2-trees");
  const co2Cars = document.getElementById("co2-cars");

  if (data.co2 && typeof data.co2 === "object") {
    // Walidacja wartości CO2
    if (
      typeof data.co2.totalCO2 !== "number" ||
      typeof data.co2.equivalentTrees !== "number" ||
      typeof data.co2.equivalentCarsKm !== "number"
    ) {
      console.error("⚠️ Błędne dane CO2 dla multi-page:", data.co2);
      if (co2Total) co2Total.textContent = "N/A";
      if (co2Trees) co2Trees.textContent = "N/A";
      if (co2Cars) co2Cars.textContent = "N/A";
    } else {
      if (co2Total) {
        // Wyświetl w odpowiedniej jednostce (mg dla małych wartości, g dla większych)
        // totalCO2 jest w kg, więc konwertujemy do gramów
        let co2Display = "";
        const totalCO2Kg = data.co2.totalCO2;
        const totalGrams = totalCO2Kg * 1000;

        if (totalGrams < 1) {
          // Mniej niż 1g - wyświetl w mg
          co2Display = `${(totalGrams * 1000).toFixed(2)} mg`;
        } else if (totalGrams < 1000) {
          // Mniej niż 1000g (1kg) - wyświetl w gramach
          co2Display = `${totalGrams.toFixed(2)} g`;
        } else {
          // Więcej niż 1kg - wyświetl w kg
          co2Display = `${totalCO2Kg.toFixed(4)} kg`;
        }
        co2Total.textContent = co2Display;
      }
      if (co2Trees) {
        const trees = data.co2.equivalentTrees;
        // Poprawione formatowanie dla bardzo małych wartości
        // Sprawdź czy wartość jest faktycznie 0 lub bardzo bliska 0
        if (trees === 0 || Math.abs(trees) < 1e-10) {
          co2Trees.textContent = "0";
        } else if (trees < 0.00001) {
          // Bardzo małe wartości - pokaż z maksymalną precyzją
          co2Trees.textContent = trees.toFixed(8);
        } else if (trees < 0.0001) {
          // Bardzo małe wartości - pokaż z większą precyzją
          co2Trees.textContent = trees.toFixed(6);
        } else if (trees < 0.01) {
          co2Trees.textContent = trees.toFixed(4);
        } else if (trees < 1) {
          co2Trees.textContent = trees.toFixed(4);
        } else if (trees < 100) {
          co2Trees.textContent = trees.toFixed(2);
        } else {
          co2Trees.textContent = trees.toFixed(0);
        }
      }
      if (co2Cars) {
        const km = data.co2.equivalentCarsKm;
        // Poprawione formatowanie dla bardzo małych wartości
        // Sprawdź czy wartość jest faktycznie 0 lub bardzo bliska 0
        if (km === 0 || Math.abs(km) < 1e-10) {
          co2Cars.textContent = "0 m";
        } else if (km < 0.00001) {
          // Bardzo małe wartości - wyświetl w metrach z większą precyzją
          const meters = km * 1000;
          if (meters < 0.001) {
            // Mniej niż 1mm - pokaż z większą precyzją
            co2Cars.textContent = `${(meters * 1000).toFixed(1)} mm`;
          } else if (meters < 0.01) {
            co2Cars.textContent = `${meters.toFixed(3)} m`;
          } else {
            co2Cars.textContent = `${meters.toFixed(2)} m`;
          }
        } else if (km < 0.001) {
          // Mniej niż 1m - wyświetl w metrach
          const meters = km * 1000;
          co2Cars.textContent = `${meters.toFixed(2)} m`;
        } else if (km < 0.01) {
          co2Cars.textContent = `${(km * 1000).toFixed(1)} m`;
        } else if (km < 1) {
          co2Cars.textContent = `${km.toFixed(3)} km`;
        } else {
          co2Cars.textContent = `${km.toFixed(2)} km`;
        }
      }
    }
  } else {
    console.warn("⚠️ Brak danych CO2 w wyniku analizy multi-page");
    // Wyświetl domyślne wartości lub "N/A"
    if (co2Total) co2Total.textContent = "N/A";
    if (co2Trees) co2Trees.textContent = "N/A";
    if (co2Cars) co2Cars.textContent = "N/A";
  }

  updateRecommendations(data);

  // Update score circle animation - tak samo jak dla pojedynczej strony
  setTimeout(() => {
    const percentage = (ecoScore / 100) * 360;

    // Get color based on grade for dynamic gradient (używamy tych samych kolorów co w $energy-colors)
    const gradeColors = {
      A: "#00852e", // Ciemna zieleń
      B: "#6cae3a", // Jasna zieleń
      C: "#b0cc33", // Żółto-zielony
      D: "#fdd835", // Żółty
      E: "#ff9800", // Pomarańczowy
      F: "#ff5722", // Czerwony
    };

    const fillColor = gradeColors[grade] || "#4CAF50";
    scoreCircle.style.background = `conic-gradient(${fillColor} 0deg, ${fillColor} ${percentage}deg, #e0e0e0 ${percentage}deg)`;
  }, 100);

  // Przewiń do sekcji wyników, aby użytkownik od razu zobaczył wyniki
  setTimeout(() => {
    if (resultsDiv) {
      resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 300);
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

// --- Performance Testing Functions ---
function parseUrlsFromTextarea() {
  if (!commonUrlInput) return [];

  const lines = commonUrlInput.value
    .trim()
    .split("\n")
    .filter((line) => line.trim());
  const urls = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes("|")) {
      // Format: nazwa|url
      const parts = trimmed.split("|").map((s) => s.trim());
      if (parts.length === 2 && parts[1].startsWith("http")) {
        urls.push({ name: parts[0], url: parts[1] });
      }
    } else if (trimmed.startsWith("http")) {
      // Tylko URL bez nazwy
      urls.push({ name: trimmed, url: trimmed });
    }
  }

  return urls;
}

function clearPerformanceTextarea() {
  if (commonUrlInput) {
    commonUrlInput.value = "";
  }
}

// Funkcja pomocnicza do tworzenia wykresów
function createChart(container, labels, datasets, title, yAxisLabel) {
  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";
  const canvas = document.createElement("canvas");
  chartContainer.appendChild(canvas);
  container.appendChild(chartContainer);

  new Chart(canvas, {
    type: "bar",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#000",
            font: { size: 12 },
            padding: 10,
          },
          position: "top",
          align: "center",
        },
        title: {
          display: true,
          text: title,
          color: "#000",
          font: { size: 16, weight: "bold" },
          padding: { top: 10, bottom: 20 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          display: true,
          ticks: { color: "#333" },
          grid: { color: "rgba(0,0,0,0.1)", display: true },
          title: {
            display: true,
            text: yAxisLabel,
            color: "#333",
            font: { size: 12 },
          },
        },
        x: {
          display: true,
          ticks: { color: "#333" },
          grid: { color: "rgba(0,0,0,0.05)" },
          title: {
            display: true,
            text: "Pages",
            color: "#333",
            font: { size: 12 },
          },
        },
      },
    },
  });
}

async function loadResults() {
  const chartsDiv = document.getElementById("charts");

  if (!chartsDiv || !performanceBtn) return;

  // NIE przełączaj na zakładkę Performance na początku - tylko po zakończeniu analizy

  performanceBtn.disabled = true;
  const originalText = performanceBtn.innerHTML;
  performanceBtn.innerHTML = "<i class='icon icon-spinner'></i> Analizuję...";
  chartsDiv.innerHTML =
    "<div style='text-align:center; color:rgba(0,0,0,0.7); padding: 2rem;'><i class='icon icon-spinner' style='animation: spin 1s linear infinite;'></i><br/><br/>Trwa analiza interfejsu użytkownika...</div>";

  // Pobierz URL z textarea
  const testUrls = parseUrlsFromTextarea();

  // Jeśli brak URL, użyj domyślnego example.com
  const finalUrls =
    testUrls.length > 0
      ? testUrls
      : [{ name: "Example", url: "https://example.com" }];

  try {
    const response = await fetch("/api/run-scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalUrls),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error occurred" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    chartsDiv.innerHTML = "";

    // Upewnij się, że zakładka Performance jest aktywna po zakończeniu analizy
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    const performanceTabButton = document.querySelector(
      '[data-tab="performance"]'
    );
    const performanceTabContent = document.getElementById("performance");
    if (performanceTabButton) {
      performanceTabButton.classList.add("active");
    }
    if (performanceTabContent) {
      performanceTabContent.classList.add("active");
    }

    // Przygotuj dane dla wykresów
    const labels = data.map((s) => s.name);

    // System metrics
    const cpuSystemData = data.map((s) => s.metrics.systemCpuPercent ?? 0);
    const ramUsedData = data.map((s) => s.metrics.systemUsedMemoryMB ?? 0);
    const ramTotalData = data.map((s) => s.metrics.systemTotalMemoryMB ?? 0);

    // JVM metrics
    const jvmUsedData = data.map((s) => s.metrics.jvmUsedMemoryMB ?? 0);
    const jvmTotalData = data.map((s) => s.metrics.jvmTotalMemoryMB ?? 0);

    // Chrome metrics
    const cpuChromeData = data.map((s) => s.metrics.CPUTime ?? 0);
    const jsHeapUsedData = data.map((s) => s.metrics.JSHeapUsedSize ?? 0);
    const jsHeapTotalData = data.map((s) => s.metrics.JSHeapTotalSize ?? 0);
    const gpuEnabledData = data.map((s) =>
      s.metrics.gpuCompositorEnabled ? 1 : 0
    );

    // Chrome DevTools Performance metrics (if available)
    const navigationStartData = data.map((s) => s.metrics.NavigationStart ?? 0);
    const domContentLoadedData = data.map(
      (s) => s.metrics.DomContentLoaded ?? 0
    );
    const loadCompleteData = data.map((s) => s.metrics.LoadComplete ?? 0);

    // Chart.js jest ładowane z CDN w index.html
    if (typeof Chart === "undefined") {
      chartsDiv.innerHTML =
        "<p style='color:red;'>Chart.js nie jest załadowany</p>";
      return;
    }

    // Utwórz wykresy dla wszystkich metryk
    const cpuSystemContainer = document.createElement("div");
    cpuSystemContainer.className = "chart-container";
    const cpuSystemCanvas = document.createElement("canvas");
    cpuSystemContainer.appendChild(cpuSystemCanvas);
    chartsDiv.appendChild(cpuSystemContainer);
    new Chart(cpuSystemCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "CPU system (%)",
            data: cpuSystemData,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, labels: { color: "#000" } },
          title: {
            display: true,
            text: "System CPU Usage",
            color: "#000",
            font: { size: 16, weight: "bold" },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            display: true,
            ticks: { color: "#333" },
            grid: { color: "rgba(0,0,0,0.1)", display: true },
            title: {
              display: true,
              text: "Percentage (%)",
              color: "#333",
              font: { size: 12 },
            },
          },
          x: {
            display: true,
            ticks: { color: "#333" },
            grid: { color: "rgba(0,0,0,0.05)" },
            title: {
              display: true,
              text: "Pages",
              color: "#333",
              font: { size: 12 },
            },
          },
        },
      },
    });

    // Додаткові графіки для всіх метрик

    // 2. RAM Used vs Total
    createChart(
      chartsDiv,
      labels,
      [
        {
          label: "RAM Used (MB)",
          data: ramUsedData,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
        {
          label: "RAM Total (MB)",
          data: ramTotalData,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
      ],
      "System RAM Usage",
      "Memory (MB)"
    );

    // 3. JVM Memory
    createChart(
      chartsDiv,
      labels,
      [
        {
          label: "JVM Used (MB)",
          data: jvmUsedData,
          backgroundColor: "rgba(153, 102, 255, 0.6)",
        },
        {
          label: "JVM Total (MB)",
          data: jvmTotalData,
          backgroundColor: "rgba(255, 159, 64, 0.6)",
        },
      ],
      "JVM Memory Usage",
      "Memory (MB)"
    );

    // 4. Chrome CPU Time
    createChart(
      chartsDiv,
      labels,
      [
        {
          label: "CPU Time",
          data: cpuChromeData,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
      "Chrome CPU Usage",
      "CPU Time"
    );

    // 5. JS Heap Memory Used vs Total
    createChart(
      chartsDiv,
      labels,
      [
        {
          label: "JS Heap Used (bytes)",
          data: jsHeapUsedData,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
        {
          label: "JS Heap Total (bytes)",
          data: jsHeapTotalData,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
      ],
      "JavaScript Heap Memory",
      "Heap Size (bytes)"
    );

    // 6. GPU Compositor Status
    createChart(
      chartsDiv,
      labels,
      [
        {
          label: "GPU Enabled",
          data: gpuEnabledData,
          backgroundColor: "rgba(255, 206, 86, 0.6)",
        },
      ],
      "GPU Compositor Status",
      "Enabled (1 = Yes, 0 = No)"
    );

    // 7. Page Load Timeline (if available)
    if (
      data.some(
        (s) =>
          s.metrics.NavigationStart ||
          s.metrics.DomContentLoaded ||
          s.metrics.LoadComplete
      )
    ) {
      createChart(
        chartsDiv,
        labels,
        [
          {
            label: "Navigation Start",
            data: navigationStartData,
            backgroundColor: "rgba(255, 159, 64, 0.6)",
          },
          {
            label: "DOM Content Loaded",
            data: domContentLoadedData,
            backgroundColor: "rgba(153, 102, 255, 0.6)",
          },
          {
            label: "Load Complete",
            data: loadCompleteData,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
          },
        ],
        "Page Load Timeline",
        "Time (ms)"
      );
    }
  } catch (err) {
    console.error("Error loading results:", err);
    const errorMessage = err.message || err.toString();
    const errorDetails =
      err.details || (err.stack ? err.stack.substring(0, 200) : "");
    chartsDiv.innerHTML = `
      <div style="padding: 2rem; background: rgba(255, 99, 132, 0.1); border-radius: 8px; border: 2px solid rgba(255, 99, 132, 0.3);">
        <h3 style="color: #ff6b6b; margin-bottom: 1rem;">❌ Błąd podczas analizy interfejsu użytkownika</h3>
        <p style="color: rgba(0,0,0,0.8); margin-bottom: 0.5rem;"><strong>Błąd:</strong> ${errorMessage}</p>
        ${
          errorDetails
            ? `<p style="color: rgba(0,0,0,0.6); font-size: 0.9rem; white-space: pre-wrap;">${errorDetails}</p>`
            : ""
        }
        <p style="color: rgba(0,0,0,0.6); margin-top: 1rem; font-size: 0.9rem;">
          Sprawdź konsolę serwera lub przeglądarki (F12) aby zobaczyć więcej szczegółów.
        </p>
      </div>
    `;
  } finally {
    if (performanceBtn) {
      performanceBtn.disabled = false;
      performanceBtn.innerHTML =
        originalText ||
        "<i class='icon icon-chart-bar'></i> Analizuj interfejs użytkownika";
    }
  }
}

// Inicjalizacja aplikacji
document.addEventListener("DOMContentLoaded", () => {
  console.log("Interfejs ZielonaPlaneta zainicjalizowany");

  // Ustaw fokus na wejściu URL
  if (commonUrlInput) commonUrlInput.focus();

  // Dodaj przykładowe adresy URL do testowania
  const sampleUrls = [
    "https://www.example.com/",
    "https://www.example.com/about",
    "https://www.example.com/services",
  ];

  // Możesz dodać tutaj dropdown lub sugestie
});
