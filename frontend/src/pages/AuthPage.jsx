import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const GENRES = ["Action","Animation","Comedy","Crime","Documentary","Drama","Fantasy","Horror","Romance","Sci-Fi","Thriller","Other"];

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); setServerError(""); };

  const validate = () => {
    const errs = {};
    if (tab === "signup" && !form.username.trim()) errs.username = "Username is required";
    else if (tab === "signup" && form.username.length < 3) errs.username = "At least 3 characters";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "At least 6 characters";
    if (tab === "signup" && form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerError("");
    try {
      if (tab === "login") await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Something went wrong";
      setServerError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎬 FilmVault</div>
        <div className="auth-tagline">Your personal movie universe</div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setErrors({}); setServerError(""); }}>Sign In</button>
          <button className={`auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setErrors({}); setServerError(""); }}>Sign Up</button>
        </div>

        {serverError && <div className="alert alert-error">⚠️ {serverError}</div>}

        {tab === "signup" && (
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className={`form-input${errors.username ? " error" : ""}`} placeholder="e.g. cinephile_99" value={form.username} onChange={e => set("username", e.target.value)} />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className={`form-input${errors.email ? " error" : ""}`} type="email" placeholder="you@email.com" value={form.email} onChange={e => set("email", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className={`form-input${errors.password ? " error" : ""}`} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        {tab === "signup" && (
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Confirm Password</label>
            <input className={`form-input${errors.confirmPassword ? " error" : ""}`} type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>
        )}

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading} style={{ marginTop: tab === "login" ? 8 : 0 }}>
          {loading ? <><span className="spinner" /> {tab === "login" ? "Signing in..." : "Creating account..."}</> : tab === "login" ? "🚀 Sign In" : "✨ Create Account"}
        </button>
      </div>
    </div>
  );
}
