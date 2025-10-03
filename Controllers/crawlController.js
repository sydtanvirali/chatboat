import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// const crawlWebsite = async (url) => {
//   let browser;
//   try {
//     browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     const page = await browser.newPage();
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
//     );

//     await page.goto(url, {
//       waitUntil: "networkidle2",
//       timeout: 60000,
//     });

//     // Wait for content to load
//     await new Promise((resolve) => setTimeout(resolve, 2000));

//     // Extract comprehensive content
//     const result = await page.evaluate(() => {
//       // Helper function to get all text from multiple elements
//       const getAllText = (selector) => {
//         return Array.from(document.querySelectorAll(selector))
//           .map((el) => el.textContent.trim())
//           .filter((text) => text.length > 0);
//       };

//       // Helper function to get attributes
//       const getAttributes = (selector, attribute) => {
//         return Array.from(document.querySelectorAll(selector))
//           .map((el) => el.getAttribute(attribute))
//           .filter((attr) => attr);
//       };

//       // Extract metadata
//       const getMetaContent = (name) => {
//         const meta = document.querySelector(
//           `meta[name="${name}"], meta[property="${name}"]`,
//         );
//         return meta ? meta.getAttribute("content") : "";
//       };

//       // Extract navigation structure
//       const getNavigation = () => {
//         const navItems = Array.from(
//           document.querySelectorAll(
//             "nav a, .nav a, .navigation a, .menu a, header a",
//           ),
//         );
//         return navItems
//           .map((item) => ({
//             text: item.textContent.trim(),
//             href: item.getAttribute("href"),
//             class: item.className,
//           }))
//           .filter((item) => item.text.length > 0);
//       };

//       return {
//         // Basic info
//         url: window.location.href,
//         title: document.title,
//         description:
//           getMetaContent("description") || getMetaContent("og:description"),

//         // Content sections
//         headings: {
//           h1: getAllText("h1"),
//           h2: getAllText("h2"),
//           h3: getAllText("h3"),
//         },

//         // Text content
//         paragraphs: getAllText("p"),
//         lists: getAllText("li"),

//         // Links
//         links: {
//           internal: getAttributes(
//             'a[href^="/"], a[href*="' + window.location.hostname + '"]',
//             "href",
//           ),
//           external: getAttributes(
//             'a[href^="http"]:not([href*="' + window.location.hostname + '"])',
//             "href",
//           ),
//         },

//         // Media
//         images: getAttributes("img", "src").map((src) => ({
//           src: src,
//           alt:
//             document.querySelector(`img[src="${src}"]`)?.getAttribute("alt") ||
//             "",
//         })),

//         videos: getAttributes(
//           "video, iframe[src*='youtube'], iframe[src*='vimeo']",
//           "src",
//         ),

//         // Scripts and stylesheets
//         scripts: {
//           count: document.querySelectorAll("script").length,
//           sources: getAttributes("script[src]", "src"),
//         },

//         stylesheets: getAttributes("link[rel='stylesheet']", "href"),

//         // Navigation structure
//         navigation: getNavigation(),

//         // Word count
//         wordCount: document.body.innerText.trim().split(/\s+/).length,

//         // Full text content (limited to avoid huge files)
//         fullText: document.body.innerText.trim().substring(0, 10000),
//       };
//     });

//     // Save to file
//     fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
//     console.log("Data successfully extracted and saved to data.json");

//     return result;
//   } catch (err) {
//     console.error("Crawl error:", err);
//     return null;
//   } finally {
//     if (browser) await browser.close();
//   }
// };

// export default crawlWebsite;

const normalizeUrl = (link) => {
  try {
    const urlObj = new URL(link);
    urlObj.hash = ""; // remove #fragment
    let normalized = urlObj.href;

    // remove trailing slash (but keep root "/")
    if (normalized.endsWith("/") && urlObj.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }

    // convert /index.html -> /
    normalized = normalized.replace(/\/index\.html$/, "/");

    return normalized;
  } catch {
    return null;
  }
};

const visited = new Set();
const results = [];

const crawlPage = async (browser, url, baseDomain) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl || visited.has(normalizedUrl)) return; // ✅ normalized check
  visited.add(normalizedUrl);

  console.log("Crawling:", normalizedUrl);

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    );
    await page.goto(normalizedUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await new Promise((res) => setTimeout(res, 1500));

    const data = await page.evaluate((baseDomain) => {
      const getAllText = (selector) =>
        Array.from(document.querySelectorAll(selector))
          .map((el) => el.textContent.trim())
          .filter((t) => t.length > 0);

      const getAttributes = (selector, attribute) =>
        Array.from(document.querySelectorAll(selector))
          .map((el) => el.getAttribute(attribute))
          .filter((attr) => attr);

      const getMetaContent = (name) => {
        const meta = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`,
        );
        return meta ? meta.getAttribute("content") : "";
      };

      return {
        url: window.location.href,
        title: document.title,
        description:
          getMetaContent("description") || getMetaContent("og:description"),
        headings: {
          h1: getAllText("h1"),
          h2: getAllText("h2"),
          h3: getAllText("h3"),
        },
        paragraphs: getAllText("p"),
        lists: getAllText("li"),
        links: getAttributes("a[href]", "href"),
        wordCount: document.body.innerText.trim().split(/\s+/).length,
        fullText: document.body.innerText.trim().substring(0, 5000),
      };
    }, baseDomain);

    results.push(data);

    // 🔹 Normalize internal links
    const internalLinks = data.links
      .map((link) => {
        try {
          return normalizeUrl(new URL(link, url).href);
        } catch {
          return null;
        }
      })
      .filter(
        (link) =>
          link &&
          link.includes(baseDomain) &&
          !visited.has(link) &&
          (link.startsWith("http://") || link.startsWith("https://")),
      );

    for (const link of internalLinks) {
      await crawlPage(browser, link, baseDomain);
    }

    await page.close();
  } catch (err) {
    console.error("Error crawling:", normalizedUrl, err.message);
  }
};

const crawlWebsite = async (startUrl) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const baseDomain = new URL(startUrl).hostname;

    await crawlPage(browser, startUrl, baseDomain);

    const filePath = path.resolve(
      `./CrawlData/${baseDomain.replaceAll(".", "_")}.json`,
    );

    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(
        `Existing file ${baseDomain.replaceAll(".", "_")}.json deleted`,
      );
    }

    // Create new file with fresh data
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    console.log(
      `Crawling completed! Data saved to ${baseDomain.replaceAll(".", "_")}.json`,
    );

    return { success: true, file: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    if (browser) await browser.close();
  }
};

export default crawlWebsite;
