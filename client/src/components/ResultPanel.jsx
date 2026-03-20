// ResultPanel.jsx
// Displays: structured JSON key-value pairs, AI answer, email body, automation status

function Badge({ status }) {
  const styles =
    status === "sent"
      ? "bg-green-500/20 text-green-400 border-green-500/40"
      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return (
    <span
      className={`border rounded-full px-3 py-0.5 text-xs font-medium ${styles}`}
    >
      {status === "sent" ? "✅ Email Sent" : "⏭️ Skipped"}
    </span>
  );
}

function KVTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-2 px-3 text-slate-400 font-medium w-1/3">
              Field
            </th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, val]) => (
            <tr
              key={key}
              className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-2 px-3 text-blue-300 font-mono text-xs capitalize">
                {key.replace(/_/g, " ")}
              </td>
              <td className="py-2 px-3 text-white">{String(val)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-blue-300">{title}</h3>
      {children}
    </div>
  );
}

function ResultPanel({ result, emailResult }) {
  return (
    <section className="bg-slate-800/60 border border-blue-800/30 rounded-2xl p-7 space-y-5 shadow-xl">
      <h2 className="text-lg font-semibold text-blue-300">
        📊 Analysis Results
      </h2>

      {/* Structured JSON */}
      <Section title="🗂️ Extracted Key-Value Pairs">
        {result.structuredJson &&
        Object.keys(result.structuredJson).length > 0 ? (
          <KVTable data={result.structuredJson} />
        ) : (
          <p className="text-slate-400 text-sm">
            No structured data extracted.
          </p>
        )}
      </Section>

      {/* Raw JSON (collapsible) */}
      <details className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-4">
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-white select-none">
          View raw JSON response
        </summary>
        <pre className="mt-3 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(result.structuredJson, null, 2)}
        </pre>
      </details>

      {/* n8n / email results */}
      {emailResult && (
        <>
          {/* Status badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              Email Automation Status:
            </span>
            <Badge status={emailResult.status} />
          </div>

          {/* AI Answer */}
          {emailResult.answer && (
            <Section title="🤖 AI Analytical Answer">
              <p className="text-slate-200 text-sm leading-relaxed">
                {emailResult.answer}
              </p>
            </Section>
          )}

          {/* Email Body */}
          {emailResult.email_body && (
            <Section title="📧 Generated Email Body">
              <pre className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed font-sans">
                {emailResult.email_body}
              </pre>
            </Section>
          )}
        </>
      )}
    </section>
  );
}

export default ResultPanel;
