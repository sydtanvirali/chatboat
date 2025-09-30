import puppeteer from "puppeteer";
import fs from "fs";

const crawlWebsite = async (url) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract comprehensive content
    const result = await page.evaluate(() => {
      // Helper function to get all text from multiple elements
      const getAllText = (selector) => {
        return Array.from(document.querySelectorAll(selector))
          .map((el) => el.textContent.trim())
          .filter((text) => text.length > 0);
      };

      // Helper function to get attributes
      const getAttributes = (selector, attribute) => {
        return Array.from(document.querySelectorAll(selector))
          .map((el) => el.getAttribute(attribute))
          .filter((attr) => attr);
      };

      // Extract metadata
      const getMetaContent = (name) => {
        const meta = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`,
        );
        return meta ? meta.getAttribute("content") : "";
      };

      // Extract navigation structure
      const getNavigation = () => {
        const navItems = Array.from(
          document.querySelectorAll(
            "nav a, .nav a, .navigation a, .menu a, header a",
          ),
        );
        return navItems
          .map((item) => ({
            text: item.textContent.trim(),
            href: item.getAttribute("href"),
            class: item.className,
          }))
          .filter((item) => item.text.length > 0);
      };

      return {
        // Basic info
        url: window.location.href,
        title: document.title,
        description:
          getMetaContent("description") || getMetaContent("og:description"),

        // Content sections
        headings: {
          h1: getAllText("h1"),
          h2: getAllText("h2"),
          h3: getAllText("h3"),
        },

        // Text content
        paragraphs: getAllText("p"),
        lists: getAllText("li"),

        // Links
        links: {
          internal: getAttributes(
            'a[href^="/"], a[href*="' + window.location.hostname + '"]',
            "href",
          ),
          external: getAttributes(
            'a[href^="http"]:not([href*="' + window.location.hostname + '"])',
            "href",
          ),
        },

        // Media
        images: getAttributes("img", "src").map((src) => ({
          src: src,
          alt:
            document.querySelector(`img[src="${src}"]`)?.getAttribute("alt") ||
            "",
        })),

        videos: getAttributes(
          "video, iframe[src*='youtube'], iframe[src*='vimeo']",
          "src",
        ),

        // Scripts and stylesheets
        scripts: {
          count: document.querySelectorAll("script").length,
          sources: getAttributes("script[src]", "src"),
        },

        stylesheets: getAttributes("link[rel='stylesheet']", "href"),

        // Navigation structure
        navigation: getNavigation(),

        // Word count
        wordCount: document.body.innerText.trim().split(/\s+/).length,

        // Full text content (limited to avoid huge files)
        fullText: document.body.innerText.trim().substring(0, 10000),
      };
    });

    // Save to file
    fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
    console.log("Data successfully extracted and saved to data.json");

    return result;
  } catch (err) {
    console.error("Crawl error:", err);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};

export default crawlWebsite;
