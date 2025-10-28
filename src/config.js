import puppeteer from "puppeteer-core";
import { getBrowserPath } from "../utils.js";

class Config {
  static browser = null;

  static async initBrowser() {
    if (this.browser) {
      return this.browser;
    }

    try {
      const browserPath = getBrowserPath();

      this.browser = await puppeteer.launch({
        executablePath: browserPath || puppeteer.executablePath(),
        headless: false, // Pokaż przeglądarkę podczas testów
        slowMo: 100, // Zwolnij akcje o 100ms dla lepszej widoczności
        devtools: false, // Otwórz DevTools (opcjonalne)
        defaultViewport: { width: 1920, height: 1080 }, // Ustaw rozmiar okna
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-background-networking",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-client-side-phishing-detection",
          "--disable-component-update",
          "--disable-default-apps",
          "--disable-features=TranslateUI",
          "--disable-hang-monitor",
          "--disable-ipc-flooding-protection",
          "--disable-popup-blocking",
          "--disable-prompt-on-repost",
          "--disable-renderer-backgrounding",
          "--disable-sync",
          "--disable-translate",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-first-run",
          "--safebrowsing-disable-auto-update",
          "--enable-automation",
          "--password-store=basic",
          "--use-mock-keychain",
          "--enable-memory-info",
          "--disable-infobars",
          "--disable-logging",
          "--hide-scrollbars",
          "--disable-extensions",
          "--disable-plugins-discovery",
          "--disable-component-extensions-with-background-pages",
          "--disable-extensions-file-access-check",
          "--disable-gcm",
          "--disable-service-worker-autostart",
        ],
      });

      return this.browser;
    } catch (error) {
      console.error("Błąd inicjalizacji przeglądarki:", error);
      throw error;
    }
  }

  static async getBrowser() {
    if (!this.browser) {
      await this.initBrowser();
    }
    return this.browser;
  }

  static async quitBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default Config;
