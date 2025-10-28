import si from "systeminformation";
import Config from "./config.js";

class Scenario {
  constructor(name, url) {
    this.name = name;
    this.url = url;
    this.metrics = {};
  }

  async run() {
    console.log(`=== ${this.name} ===`);

    const browser = await Config.getBrowser();
    const page = await browser.newPage();

    try {
      // Przejdź do URL
      await page.goto(this.url, { waitUntil: "networkidle2", timeout: 30000 });

      // Czekaj na załadowanie strony
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Pobierz metryki wydajności używając CDP
      const client = await page.target().createCDPSession();

      try {
        // Włącz domenę Performance
        await client.send("Performance.enable");

        // Czekaj na zebranie metryk
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Pobierz metryki wydajności używając CDP
        const performanceMetrics = await client.send("Performance.getMetrics");

        if (performanceMetrics && performanceMetrics.metrics) {
          performanceMetrics.metrics.forEach((metric) => {
            this.metrics[metric.name] = metric.value;
          });
        }
      } catch (err) {
        console.warn("Nie można pobrać metryk Performance:", err.message);
      }

      // Metryki systemowe
      const cpu = await si.cpu();
      const mem = await si.mem();
      const cpuLoad = await si.currentLoad();

      this.metrics.systemCpuPercent = cpuLoad.currentLoad || 0;
      this.metrics.systemTotalMemoryMB = Math.round(mem.total / (1024 * 1024));
      this.metrics.systemUsedMemoryMB = Math.round(mem.used / (1024 * 1024));

      // Pobierz pamięć procesu
      if (process.memoryUsage) {
        const memoryUsage = process.memoryUsage();
        this.metrics.jvmTotalMemoryMB = Math.round(
          memoryUsage.heapTotal / (1024 * 1024)
        );
        this.metrics.jvmUsedMemoryMB = Math.round(
          memoryUsage.heapUsed / (1024 * 1024)
        );
      }

      // Metryki związane z GPU
      this.metrics.gpuCompositorEnabled = await this.isGpuCompositorEnabled(
        page
      );

      // Dodaj metryki pamięci JS z konsoli przeglądarki
      try {
        const jsMetrics = await page.evaluate(() => {
          return {
            jsHeapUsedSize: performance.memory
              ? performance.memory.usedJSHeapSize
              : 0,
            jsHeapTotalSize: performance.memory
              ? performance.memory.totalJSHeapSize
              : 0,
            jsHeapLimit: performance.memory
              ? performance.memory.jsHeapSizeLimit
              : 0,
          };
        });

        this.metrics.JSHeapUsedSize = jsMetrics.jsHeapUsedSize || 0;
        this.metrics.JSHeapTotalSize = jsMetrics.jsHeapTotalSize || 0;
      } catch (err) {
        console.warn("Nie można pobrać metryk pamięci JS:", err.message);
        this.metrics.JSHeapUsedSize = 0;
        this.metrics.JSHeapTotalSize = 0;
      }

      // Dodaj CPUTime jako syntetyczną metrykę (używając ThreadTime jeśli dostępne)
      this.metrics.CPUTime =
        this.metrics.ThreadTime || this.metrics.TaskDuration || 0;

      await page.close();
    } catch (error) {
      console.error(`Błąd uruchamiania scenariusza ${this.name}:`, error);
      await page.close().catch(() => {});
      throw error;
    }
  }

  async isGpuCompositorEnabled(page) {
    try {
      const result = await page.evaluate(() => {
        return window.chrome && window.chrome.gpuBenchmarking !== undefined;
      });
      return result === true;
    } catch (e) {
      return false;
    }
  }
}

export default Scenario;
