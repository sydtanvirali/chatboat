import fs from "fs";
import dotenv from "dotenv";
import collectText from "./collectText.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const askAI = async (question) => {
  try {
    if (!fs.existsSync("CrawlData/7techitservices_com.json")) {
      throw new Error(
        "data.json file not found. Please crawl a website first.",
      );
    }

    const rawData = JSON.parse(
      fs.readFileSync("CrawlData/7techitservices_com.json", "utf8"),
    );

    let websiteText = "";
    const allPagesText = rawData
      .map(collectText)
      .join("\n\n-- PAGE SEPARATOR --\n\n");
    websiteText = allPagesText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    if (websiteText.length === 0) {
      throw new Error("No readable content found in the crawled data.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
   You are an AI assistant that answers user questions based ONLY on the provided website content.
   Do NOT use outside knowledge.
   Guidelines:
   - Always respond strictly in the same language as the user's question.
   - Give clear, natural, and helpful answers based strictly on the website text.
   - If the website does not contain enough information to answer, politely respond in a conversational way (like a human would).
   - Keep responses concise, friendly, and user-oriented.
   - If the information is not found in the website text, politely say you don’t have that information (like a human would).
     Example:"Sorry, I don’t have details about that."
   - When sharing any numeric information (such as counts of clients, projects, years, employees, offices, countries, or any other records),
     always add a safe qualifier like **"over," "more than,"** or **"+"** to suggest the number may be a minimum or historic figure.
     Example: If the text says "15 clients," respond with "more than 15 clients."
   - Do NOT mention the website or content availability in your answers.
   - Do not mention the website or crawling process in your answers.
   - Keep responses concise, friendly, and user-oriented.

   Website Content:${websiteText}
   User Question:${question}
   Answer (based only on the website content, in the user's language)`;

    const result = await model.generateContent(prompt);
    return result.response
      .text()
      .replace(/\\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (error) {
    console.error("Error in askAI:", error.message);
    return `Sorry, I encountered an error: ${error.message}`;
  }
};
export default askAI;
