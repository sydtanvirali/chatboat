import fs from "fs";
import dotenv from "dotenv";
import collectText from "./collectText.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config();

// Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const askAI = async (question) => {
  try {
    if (!fs.existsSync("data.json")) {
      throw new Error(
        "data.json file not found. Please crawl a website first.",
      );
    }

    const rawData = JSON.parse(fs.readFileSync("data.json", "utf8"));

    let websiteText = "";
    // Merge everything into websiteText
    websiteText = collectText(rawData);
    // Remove \n and extra spaces
    websiteText = websiteText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    if (websiteText.length === 0) {
      throw new Error("No readable content found in the crawled data.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
   You are an AI assistant that answers user questions based ONLY on the provided website content.
   Do NOT use outside knowledge.
   Guidelines:
   - Always respond in the same language as the user's question.
   - Give clear, natural, and helpful answers based strictly on the website text.
   - If the website does not contain enough information to answer, politely respond in a conversational way (like a human would).
   - Keep responses concise, friendly, and user-oriented.
   - If the information is not found in the website text, politely say you don’t have that information (like a human would).
     Example: "मला माफ करा, याबद्दल माझ्याकडे माहिती नाही." / "Sorry, I don’t have details about that."
   - Do NOT mention the website or content availability in your answers.
   - Do not mention the website or crawling process in your answers.
   - Keep responses concise, friendly, and user-oriented.

   Website Content:${websiteText}
   User Question:${question}
   Answer (based only on the website content, in the user's language)`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error in askAI:", error.message);
    return `Sorry, I encountered an error: ${error.message}`;
  }
};
export default askAI;
