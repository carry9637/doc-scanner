// FileUpload.jsx
// Handles: file selection (PDF/TXT) + question input + submit button

function FileUpload({
  file,
  setFile,
  question,
  setQuestion,
  onSubmit,
  loading,
}) {
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  return (
    <section className="bg-slate-800/60 border border-blue-800/30 rounded-2xl p-7 space-y-5 shadow-xl">
      <h2 className="text-lg font-semibold text-blue-300">
        📤 Upload Document
      </h2>

      {/* File drop zone */}
      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-blue-600/50 rounded-xl cursor-pointer hover:border-blue-400 transition-colors bg-slate-900/40">
        <span className="text-3xl mb-2">📁</span>
        <span className="text-sm text-slate-400">
          {file ? file.name : "Click to upload PDF or TXT (max 10 MB)"}
        </span>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Selected file badge */}
      {file && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <span>✅</span>
          <span className="truncate max-w-xs">{file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="ml-auto text-red-400 hover:text-red-300 text-xs"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Question input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Your Question
        </label>
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is the total invoice amount and due date?"
          className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 rounded-xl text-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
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
            Analysing…
          </span>
        ) : (
          "🔍 Analyse Document"
        )}
      </button>
    </section>
  );
}

export default FileUpload;
