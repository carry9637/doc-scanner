import { useState, useEffect } from "react";
import axios from "axios";
import FileUpload from "./components/FileUpload";
import ResultPanel from "./components/ResultPanel";
import EmailSender from "./components/EmailSender";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  // ── Upload / Analysis state ──────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serverReady, setServerReady] = useState(false);

  // ── Results state ────────────────────────────────────────────────────────
  const [result, setResult] = useState(null);
  // result shape: { structuredJson, extractedText, question }

  // ── Email state ──────────────────────────────────────────────────────────
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  // emailResult shape: { answer, email_body, status }

  // ── Wake up Render server on page load ───────────────────────────────────
  useEffect(() => {
    axios
      .get(`${API}/health`, { timeout: 90000 })
      .then(() => setServerReady(true))
      .catch(() => {
        // Retry once more after 3 seconds
        setTimeout(() => {
          axios
            .get(`${API}/health`, { timeout: 90000 })
            .then(() => setServerReady(true))
            .catch(() => setServerReady(false));
        }, 3000);
      });
  }, []);

  // ── Handler: analyse document ────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!file) return setError("Please select a file.");
    if (!question.trim()) return setError("Please enter a question.");

    setError("");
    setResult(null);
    setEmailResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("question", question);

      const response = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`[${API}] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: send alert email via n8n ────────────────────────────────────
  const handleSendEmail = async () => {
    if (!recipientEmail.trim())
      return setError("Please enter recipient email.");
    if (!result) return setError("No analysis result to send.");

    setError("");
    setEmailLoading(true);

    try {
      const { data } = await axios.post(`${API}/send-email`, {
        structuredJson: result.structuredJson,
        extractedText: result.extractedText,
        question: result.question,
        recipientEmail,
      });

      setEmailResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send email.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* ── Navbar ── */}
      <nav className="border-b border-blue-800/40 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <h1 className="text-xl font-bold tracking-tight">DocScanner AI</h1>
          <span className="ml-auto text-xs text-blue-400 font-medium">
            Powered by Groq + n8n
          </span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* ── Server Status ── */}
        {!serverReady && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded-xl px-5 py-3 text-sm flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Waking up server… This may take up to 60 seconds on first visit.
          </div>
        )}

        {/* ── Upload Section ── */}
        <FileUpload
          file={file}
          setFile={setFile}
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleAnalyse}
          loading={loading}
          serverReady={serverReady}
        />

        {/* ── Error Banner ── */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-5 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <>
            <ResultPanel result={result} emailResult={emailResult} />

            {/* ── Email Sender ── */}
            <EmailSender
              recipientEmail={recipientEmail}
              setRecipientEmail={setRecipientEmail}
              onSend={handleSendEmail}
              loading={emailLoading}
              sent={!!emailResult}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
