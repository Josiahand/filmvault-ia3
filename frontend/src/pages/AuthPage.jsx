import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function AuthPage() {
  const { login, register, googleLogin } = useAuth();
  const [tab,         setTab]         = useState("login");
  const [form,        setForm]        = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false); // Google button loading

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
    setServerError("");
  };

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

  // ── Google Sign-In using implicit (token) flow ───────────────
  // useGoogleLogin gives us an access_token; we exchange it for user info
  // then send to our backend. Alternatively we use credential flow via GoogleLogin component.
  // We'll use the credential/code flow via a direct ID-token approach:
  const handleGoogleSuccess = async (tokenResponse) => {
    setGLoading(true);
    setServerError("");
    try {
      // Exchange the access_token for profile info from Google
      const profileRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      );
      if (!profileRes.ok) throw new Error("Failed to fetch Google profile");
      const profile = await profileRes.json();

      // Build a synthetic credential payload and send to our backend
      // Since we're using implicit flow we send profile data directly
      const { data } = await api.post("/auth/google-profile", {
        googleId: profile.sub,
        email:    profile.email,
        name:     profile.name,
        picture:  profile.picture,
      });
      // Persist exactly like normal login
      localStorage.setItem("filmvault_token", data.token);
      localStorage.setItem("filmvault_user",  JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Google sign-in failed";
      setServerError(msg);
    }
    setGLoading(false);
  };

  const triggerGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   () => setServerError("Google sign-in was cancelled or failed"),
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎬 FilmVault</div>
        <div className="auth-tagline">Your personal movie universe</div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login"  ? "active" : ""}`} onClick={() => { setTab("login");  setErrors({}); setServerError(""); }}>Sign In</button>
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
          {loading
            ? <><span className="spinner" /> {tab === "login" ? "Signing in..." : "Creating account..."}</>
            : tab === "login" ? "🚀 Sign In" : "✨ Create Account"
          }
        </button>

        {/* ── Divider ── */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* ── Google button ── */}
        <button
          className="btn-google"
          onClick={() => triggerGoogle()}
          disabled={gLoading}
        >
          {gLoading ? (
            <><span className="spinner" /> Signing in with Google...</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
