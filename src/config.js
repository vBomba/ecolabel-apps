import { Builder } from "selenium-webdriver";
import { Options as ChromeOptions } from "selenium-webdriver/chrome.js";
import { getBrowserPath } from "../utils.js";

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
      if (browserPath) {
        options.setChromeBinaryPath(browserPath);
      }

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

      this.driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

      return this.driver;
    } catch (error) {
      console.error("Error initializing WebDriver:", error);
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
