import { Builder } from "selenium-webdriver";
import {
  Options as ChromeOptions,
  ServiceBuilder,
} from "selenium-webdriver/chrome.js";
import { getBrowserPath } from "../utils.js";
import chromedriver from "chromedriver";

class Config {
  static driver = null;

  static async initDriver() {
    if (this.driver) {
      return this.driver;
    }

    try {
      const options = new ChromeOptions();

      // Ustaw ścieżkę do Chrome
      const browserPath = getBrowserPath();
      console.log(`📍 Browser path: ${browserPath}`);

      if (browserPath) {
        options.setChromeBinaryPath(browserPath);
        console.log(`✅ Chrome binary path set successfully`);
      } else {
        console.warn(`⚠️ Chrome path not found! Trying to continue...`);
      }

      // Dodaj flagę, żeby okno było widoczne
      options.addArguments("--start-maximized");
      options.addArguments("--disable-infobars");

      options.addArguments("--no-sandbox");
      options.addArguments("--disable-dev-shm-usage");
      options.addArguments("--disable-gpu");
      options.addArguments("--disable-background-networking");
      options.addArguments("--disable-background-timer-throttling");
      options.addArguments("--disable-backgrounding-occluded-windows");
      options.addArguments("--disable-breakpad");
      options.addArguments("--disable-client-side-phishing-detection");
      options.addArguments("--disable-component-update");
      options.addArguments("--disable-default-apps");
      options.addArguments("--disable-features=TranslateUI");
      options.addArguments("--disable-hang-monitor");
      options.addArguments("--disable-ipc-flooding-protection");
      options.addArguments("--disable-popup-blocking");
      options.addArguments("--disable-prompt-on-repost");
      options.addArguments("--disable-renderer-backgrounding");
      options.addArguments("--disable-sync");
      options.addArguments("--disable-translate");
      options.addArguments("--metrics-recording-only");
      options.addArguments("--mute-audio");
      options.addArguments("--no-first-run");
      options.addArguments("--safebrowsing-disable-auto-update");
      options.addArguments("--enable-automation");
      options.addArguments("--password-store=basic");
      options.addArguments("--use-mock-keychain");
      options.addArguments("--enable-memory-info");
      options.addArguments("--disable-infobars");
      options.addArguments("--disable-logging");
      options.addArguments("--hide-scrollbars");
      options.addArguments("--disable-extensions");
      options.addArguments("--disable-plugins-discovery");
      options.addArguments(
        "--disable-component-extensions-with-background-pages"
      );
      options.addArguments("--disable-extensions-file-access-check");
      options.addArguments("--disable-gcm");
      options.addArguments("--disable-service-worker-autostart");

      console.log(`🚀 Building WebDriver with Chrome options...`);

      // Konfiguracja ChromeDriver Service
      let service = undefined;
      try {
        const chromeDriverPath = chromedriver.path;
        if (chromeDriverPath) {
          console.log(`📦 ChromeDriver path: ${chromeDriverPath}`);
          service = new ServiceBuilder(chromeDriverPath);
        } else {
          console.log(`⚠️ ChromeDriver path not found in package`);
        }
      } catch (serviceError) {
        console.warn(
          `⚠️ Could not setup ChromeDriver Service: ${serviceError.message}`
        );
        console.log(
          `   Trying to use Selenium's automatic driver management...`
        );
      }

      const builder = new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options);

      if (service) {
        console.log(`🔧 Using custom ChromeDriver Service`);
        builder.setChromeService(service);
      }

      this.driver = await builder.build();

      console.log(`✅ WebDriver initialized successfully`);
      return this.driver;
    } catch (error) {
      console.error("❌ Error initializing WebDriver:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  static async getDriver() {
    if (!this.driver) {
      await this.initDriver();
    }
    return this.driver;
  }

  static async quitDriver() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }
}

export default Config;
