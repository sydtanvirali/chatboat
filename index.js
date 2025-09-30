import express from "express";
import crawlWebsite from "./Controllers/crawlController.js";
import askAI from "./Controllers/askAIController.js";

const app = express();
const PORT = 3000;

// 🔹 API Endpoints
app.get("/crawl", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const data = await crawlWebsite(url);
  if (!data) return res.status(500).json({ error: "Failed to crawl website" });

  res.json({ message: "Crawled successfully", data });
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
