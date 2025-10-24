/**
 * Skrypt testowy do analizy wielu stron witryny
 * Użycie: node test-multi-page.js
 */

const apiUrl = "http://localhost:3000/api/analyze-multiple";

// Dane testowe - przykładowe adresy URL do analizy
const testData = {
  urls: [
    "https://www.example.com/",
    "https://www.example.com/about",
    "https://www.example.com/contact",
  ],
};

async function testMultiPageAnalysis() {
  console.log("🚀 Rozpoczynanie testu analizy wielu stron witryny...\n");
  console.log("📍 Punkt końcowy API:", apiUrl);
  console.log("📄 Adresy URL do analizy:");
  testData.urls.forEach((url, i) => {
    console.log(`   ${i + 1}. ${url}`);
  });
  console.log("\n⏳ Przetwarzanie... Może to potrwać kilka minut...\n");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Błąd API:", error);
      return;
    }

    const result = await response.json();

    console.log("✅ Analiza ukończona!\n");
    console.log("═══════════════════════════════════════════════════");
    console.log("🌐 RAPORT ECO-LABEL WITRYNY");
    console.log("═══════════════════════════════════════════════════\n");

    console.log(`📊 Domena: ${result.domain}`);
    console.log(
      `📄 Przeanalizowane strony: ${result.successfulAnalyses}/${result.analyzedPages}`
    );
    console.log(
      `📅 Przeanalizowano: ${new Date(result.analyzedAt).toLocaleString()}`
    );

    console.log("\n🏆 ECO-LABEL:");
    const label = result.ecoLabel;
    console.log(`   Ocena: ${label.grade} - ${label.label}`);
    console.log(`   Wynik: ${result.aggregatedEcoData.ecoScore}/100`);

    console.log("\n📈 ZAGREGOWANE METRYKI:");
    const data = result.aggregatedEcoData;
    console.log(`   Wydajność: ${data.performance.toFixed(1)}/100`);
    console.log(
      `   Razem bajtów (średnia): ${(data.totalBytes / 1024).toFixed(1)} KB`
    );
    console.log(
      `   Czas uruchomienia (średnia): ${data.bootupTime.toFixed(1)} ms`
    );
    console.log(
      `   Zielony hosting: ${data.hostingGreen === 100 ? "✅ Tak" : "❌ Nie"}`
    );
    console.log(
      `   Optymalizacja obrazów: ${
        data.imageOptimization === 100 ? "✅ Tak" : "❌ Nie"
      }`
    );
    console.log(`   CLS (średnia): ${data.cls.toFixed(3)}`);

    console.log("\n📄 WYNIKI POSZCZEGÓLNYCH STRON:");
    result.pages.forEach((page, i) => {
      console.log(`\n   ${i + 1}. ${page.url}`);
      console.log(`      Eco Score: ${page.ecoData.ecoScore}/100`);
      console.log(
        `      Wydajność: ${page.ecoData.performance.toFixed(1)}/100`
      );
    });

    if (result.errors && result.errors.length > 0) {
      console.log("\n⚠️  BŁĘDY:");
      result.errors.forEach((err) => {
        console.log(`   ❌ ${err.url}: ${err.error}`);
      });
    }

    console.log("\n✅ Raport zapisany w: reports/website-report-*.json");
    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Test nie powiódł się:", error.message);
  }
}

// Uruchomienie testu
testMultiPageAnalysis();
