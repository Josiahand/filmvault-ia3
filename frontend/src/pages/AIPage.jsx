import { useState } from "react";
import { useMovies } from "../context/MovieContext";
import api from "../utils/api";

export default function AIPage() {
  const { movies }            = useMovies();
  const [recs,    setRecs]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const watched = movies.filter(m => m.status === "watched");

  const getRecs = async () => {
    setLoading(true);
    setError("");
    setRecs(null);
    try {
      const { data } = await api.post("/ai/recommendations", {
        watchedMovies: watched.map(m => ({
          title:  m.title,
          genre:  m.genre,
          rating: m.rating,
          type:   m.type || "movie",
        })),
      });
      setRecs(data.recommendations);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to get recommendations";
      setError(
        msg.includes("ANTHROPIC_API_KEY")
          ? "API key not configured. Add your Anthropic API key to the backend .env file."
          : msg
      );
    }
    setLoading(false);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-title">AI Picks</div>
        <div className="page-subtitle">Personalised recommendations by Claude AI</div>
      </div>

      <div className="ai-card">
        <div className="ai-top">
          <div className="ai-txt">
            <h3>Smart Recommendations</h3>
            <p>
              {watched.length > 0
                ? `Based on your ${watched.length} watched title${watched.length !== 1 ? "s" : ""}`
                : "No watched titles yet — will suggest popular picks"}
            </p>
          </div>
          <button
            className="btn btn-purple"
            style={{ marginLeft:"auto" }}
            onClick={getRecs}
            disabled={loading}
          >
            {loading
              ? <><span className="dots"><span className="dot" /><span className="dot" /><span className="dot" /></span>&nbsp;Thinking...</>
              : "Get Recommendations"}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="alert alert-error" style={{ marginTop:16 }}>{error}</div>
        )}

        {/* API key setup guide */}
        {error && error.includes("API key") && (
          <div style={{ marginTop:16, background:"var(--bg3)", borderRadius:10, padding:20, border:"1px solid var(--border)" }}>
            <div style={{ fontWeight:700, marginBottom:12, color:"var(--accent)" }}>How to add your Anthropic API key:</div>
            {[
              ["1", "Go to console.anthropic.com and sign up for free"],
              ["2", "Navigate to API Keys and create a new key"],
              ["3", "Copy the key and add it to your backend .env file:"],
            ].map(([num, text], i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
                <span style={{ background:"var(--accent)", color:"#000", borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700, flexShrink:0 }}>{num}</span>
                <span style={{ fontSize:"0.88rem", color:"var(--text2)" }}>{text}</span>
              </div>
            ))}
            <div style={{ marginTop:14, background:"var(--bg4)", borderRadius:8, padding:14, border:"1px solid var(--border)" }}>
              <code style={{ fontSize:"0.85rem", color:"var(--green)" }}>ANTHROPIC_API_KEY=sk-ant-your-key-here</code>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recs && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:"0.88rem", fontWeight:600, marginBottom:12, color:"var(--text)" }}>
              Based on your taste, you may enjoy:
            </div>
            <div className="rec-grid">
              {recs.map((rec, i) => (
                <div key={i} className="rec-card" style={{ animationDelay:`${i*0.08}s` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                    <div className="rec-title">
                      {rec.title}
                      {rec.year && <span style={{ color:"var(--text3)", fontWeight:400 }}> ({rec.year})</span>}
                    </div>
                  </div>
                  <div style={{ fontSize:"0.7rem", color:"var(--accent)", fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    {rec.type === "tv" ? "TV Show" : "Movie"}
                  </div>
                  <div className="rec-reason">{rec.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default state */}
        {!recs && !loading && !error && (
          <div style={{ marginTop:20, color:"var(--text2)", fontSize:"0.88rem", lineHeight:1.7 }}>
            Click <strong style={{ color:"var(--accent)" }}>Get Recommendations</strong> and Claude AI will analyse your viewing history and suggest movies and TV shows tailored to your taste.
          </div>
        )}
      </div>
    </div>
  );
}
