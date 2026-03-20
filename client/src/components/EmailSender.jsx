// EmailSender.jsx
// Handles: recipient email input + "Send Alert Mail" button

function EmailSender({
  recipientEmail,
  setRecipientEmail,
  onSend,
  loading,
  sent,
}) {
  return (
    <section className="bg-slate-800/60 border border-blue-800/30 rounded-2xl p-7 space-y-5 shadow-xl">
      <h2 className="text-lg font-semibold text-blue-300">
        📬 Send Alert Email
      </h2>
      <p className="text-xs text-slate-400">
        Triggers your n8n workflow: generates an AI analytical answer, builds an
        email, and delivers it to the recipient.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="recipient@example.com"
          className="flex-1 bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={onSend}
          disabled={loading || sent}
          className="sm:w-48 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 px-6 rounded-xl text-sm whitespace-nowrap"
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
              Sending…
            </span>
          ) : sent ? (
            "✅ Sent!"
          ) : (
            "📨 Send Alert Mail"
          )}
        </button>
      </div>

      {sent && (
        <p className="text-xs text-green-400">
          ✅ n8n workflow triggered successfully. Check the results panel above.
        </p>
      )}
    </section>
  );
}

export default EmailSender;
