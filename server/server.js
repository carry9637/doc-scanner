import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
// pdf-parse v1 – loaded via createRequire (CJS-compatible)
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

// ─── ESM __dirname workaround ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// ─── Multer – file upload to /uploads folder ───────────────────────────────
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["application/pdf", "text/plain"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only PDF and TXT files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── Helper: extract raw text from PDF or TXT ─────────────────────────────
async function extractText(file) {
  try {
    console.log(
      "📄 Processing file:",
      file.originalname,
      "Type:",
      file.mimetype,
    );

    if (file.mimetype === "text/plain") {
      return fs.readFileSync(file.path, "utf-8");
    }

    const buffer = fs.readFileSync(file.path);
    console.log("📄 PDF buffer size:", buffer.length);

    const data = await pdfParse(buffer);
    console.log("📄 Extracted text length:", data.text?.length || 0);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error(
        "Could not extract text from PDF. The PDF might be image-based or encrypted.",
      );
    }

    return data.text;
  } catch (err) {
    console.error("❌ extractText error:", err.message);
    throw new Error(`Failed to extract text from document: ${err.message}`);
  }
}

// ─── Groq AI helper ────────────────────────────────────────────────────
async function callAI(text, question) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = "llama-3.3-70b-versatile";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const prompt = `You are a document analysis AI.
Given the document text and a user question, extract the most relevant information.
Return STRICTLY a valid JSON object with 5-8 key-value string pairs.
No markdown fences, no explanation—only raw JSON.

User Question: "${question}"

Document Text:
"""
${text.slice(0, 8000)}
"""

Example output:
{"name": "John Doe", "date": "2024-01-15", "amount": "$1200"}`;

  const response = await axios.post(
    url,
    {
      model: model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const raw = response.data.choices[0].message.content.trim();
  const jsonStr = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(jsonStr);
}

// ─────────────────────────────────────────────────────────────────────────────
// Route: POST /upload
// Accepts: multipart/form-data  { file, question }
// Returns: { structuredJson, extractedText, question }
// ─────────────────────────────────────────────────────────────────────────────
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const question = req.body.question?.trim();
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    // 1. Extract text from the uploaded document
    const text = await extractText(req.file);

    // 2. Send to Groq AI and get structured JSON
    const structuredJson = await callAI(text, question);

    // 3. Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      extractedText: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
      structuredJson,
      question,
    });
  } catch (err) {
    console.error("❌ /upload error:", err.message);
    console.error("Stack:", err.stack);
    console.error("Full error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Route: POST /send-email
// Accepts: { structuredJson, extractedText, question, recipientEmail }
// Triggers n8n webhook → returns { answer, email_body, status }
// ─────────────────────────────────────────────────────────────────────────────
app.post("/send-email", async (req, res) => {
  try {
    const { structuredJson, extractedText, question, recipientEmail } =
      req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: "Recipient email is required." });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return res
        .status(500)
        .json({ error: "N8N_WEBHOOK_URL is not set in .env" });
    }

    console.log("📧 Triggering n8n webhook:", webhookUrl);
    console.log(
      "📧 Payload:",
      JSON.stringify({
        structuredJson,
        extractedText: extractedText?.slice(0, 100),
        question,
        recipientEmail,
      }),
    );

    const n8nResponse = await axios.post(
      webhookUrl,
      { structuredJson, extractedText, question, recipientEmail },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 },
    );

    console.log("📧 n8n response status:", n8nResponse.status);
    console.log("📧 n8n response data:", JSON.stringify(n8nResponse.data));

    // Check if n8n returned an error in its response body
    if (
      n8nResponse.data?.error ||
      n8nResponse.data?.message?.toLowerCase().includes("error")
    ) {
      return res.status(502).json({
        error:
          "n8n workflow failed: " +
          (n8nResponse.data.error || n8nResponse.data.message),
      });
    }

    res.json({
      success: true,
      answer: n8nResponse.data?.answer || "Analysis complete.",
      email_body: n8nResponse.data?.email_body || "",
      status: n8nResponse.data?.status || "sent",
    });
  } catch (err) {
    console.error("❌ /send-email error:", err.message);
    res
      .status(500)
      .json({ error: err.message || "Failed to contact n8n webhook." });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

// ─── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`✅ DocScanner server running → http://localhost:${PORT}`),
);
