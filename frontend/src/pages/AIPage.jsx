import { useState } from "react";
import { useMovies } from "../context/MovieContext";

export default function AIPage() {
  const { movies } = useMovies();
  const [recs, setRecs]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const watched = movies.filter((m) => m.status === "watched");

  const getRecs = async () => {
    setLoading(true);
    setError("");
    setRecs(null);

    const titles = watched
      .map((m) => `${m.title} (${m.genre}, ${m.rating}/5 stars)`)
      .join(", ");

    const prompt = watched.length
      ? `Based on these movies I've watched: ${titles} — suggest 4 movies I would enjoy next. For each, respond ONLY with a JSON array: [{"title":"...","year":"...","reason":"..."}]. No other text, no markdown.`
      : `Suggest 4 great movies to start a movie collection with. Respond ONLY with a JSON array: [{"title":"...","year":"...","reason":"..."}]. No other text.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((c) => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRecs(parsed);
    } catch (e) {
      setError("Could not fetch recommendations. This feature works inside Claude's interface. Make sure the app is embedded there.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">AI Picks</div>
        <div className="page-subtitle">Personalised recommendations powered by Claude AI</div>
      </div>

      <div className="ai-card">
        <div className="ai-top">
          <div className="ai-icon-wrap">🤖</div>
          <div className="ai-txt">
            <h3>Smart Movie Recommendations</h3>
            <p>
              {watched.length > 0
                ? `Based on your ${watched.length} watched movie${watched.length !== 1 ? "s" : ""}`
                : "No watched movies yet — will suggest popular picks instead"}
            </p>
          </div>
          <button
            className="btn btn-purple"
            style={{ marginLeft: "auto" }}
            onClick={getRecs}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="dots">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </span>
                &nbsp;Thinking…
              </>
            ) : "✨ Get Recommendations"}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>⚠️ {error}</div>
        )}

        {recs && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>
              🎯 Here's what you'd love next:
            </div>
            <div className="rec-grid">
              {recs.map((rec, i) => (
                <div key={i} className="rec-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="rec-title">🎬 {rec.title}{rec.year ? ` (${rec.year})` : ""}</div>
                  <div className="rec-reason">{rec.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!recs && !loading && !error && (
          <div style={{ marginTop: 20, color: "var(--text2)", fontSize: "0.88rem", lineHeight: 1.7 }}>
            Click <strong style={{ color: "var(--purple)" }}>Get Recommendations</strong> and Claude AI will analyse your taste and suggest movies tailored to you.
          </div>
        )}
      </div>
    </>
  );
}
