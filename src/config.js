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
      options.addArguments("--enable-gpu");
      options.addArguments("--enable-gpu-rasterization");
      options.addArguments("--enable-features=VaapiVideoDecoder");
      options.addArguments("--disable-software-rasterizer");
      options.addArguments("--enable-memory-info");
      options.addArguments("--enable-logging", "--v=1");

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
