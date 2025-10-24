import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Finds the Chrome/Chromium executable path based on the operating system
 * Works on Windows, macOS, and Linux
 */
export function getBrowserPath() {
  const platform = process.platform;

  if (platform === "win32") {
    // Windows
    const possiblePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Chromium\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe",
      path.join(
        process.env.LOCALAPPDATA,
        "Google\\Chrome\\Application\\chrome.exe"
      ),
      path.join(
        process.env.PROGRAMFILES,
        "Google\\Chrome\\Application\\chrome.exe"
      ),
      path.join(
        process.env["PROGRAMFILES(x86)"],
        "Google\\Chrome\\Application\\chrome.exe"
      ),
    ];

    for (const chromePath of possiblePaths) {
      if (chromePath && fs.existsSync(chromePath)) {
        console.log(`✅ Chrome found at: ${chromePath}`);
        return chromePath;
      }
    }

    throw new Error(
      "❌ Chrome/Chromium not found on Windows. Please install Google Chrome from https://www.google.com/chrome or Chromium from https://www.chromium.org"
    );
  } else if (platform === "darwin") {
    // macOS
    const possiblePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`✅ Chrome found at: ${chromePath}`);
        return chromePath;
      }
    }

    throw new Error(
      "❌ Chrome/Chromium not found on macOS. Please install Google Chrome from https://www.google.com/chrome"
    );
  } else {
    // Linux
    try {
      const chromePath = execSync(
        "which google-chrome || which chromium || which chromium-browser",
        {
          encoding: "utf8",
        }
      ).trim();

      if (chromePath) {
        console.log(`✅ Chrome found at: ${chromePath}`);
        return chromePath;
      }
    } catch (e) {
      // Command failed
    }

    throw new Error(
      "❌ Chrome/Chromium not found on Linux. Please install it using: sudo apt-get install chromium-browser"
    );
  }
}
