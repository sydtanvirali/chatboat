import express from "express";
import crawlWebsite from "./Controllers/crawlController.js";
import askAI from "./Controllers/askAIController.js";

const app = express();
const PORT = 3000;

// 🔹 API Endpoints
app.get("/crawl", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const data = await crawlWebsite(url);
    if (!data.success) {
      return res.status(500).json({
        message: "Crawling failed",
        error: data.error,
      });
    }

    return res.json({
      message: "Crawled successfully",
      file: data.file,
      crawledPages: data.crawledPages,
    });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Chatbot endpoint
app.get("/ask", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Question is required" });

  try {
    const answer = await askAI(q);
    res.json({ question: q, answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running.....`);
});
