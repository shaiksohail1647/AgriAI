 "use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"register"|"forgot"|"reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : mode === "forgot" ? "/api/auth/forgot-password" : mode === "reset" ? "/api/auth/reset-password" : "/api/auth/login";
      const body = mode === "register" ? { name, email, password } : mode === "reset" ? { email, code, password } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      if (mode === "forgot") {
        setNotice(data.developmentCode ? `${data.message} Your code: ${data.developmentCode}` : data.message);
        setMode("reset");
        return;
      }
      if (mode === "reset") {
        setNotice("Password updated. You can now sign in.");
        setPassword(""); setCode(""); setMode("login");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand"><span className="brand-mark">⌁</span><div><b>AgriAI</b><small>INTELLIGENT AGRICULTURE</small></div></div>
        <p className="eyebrow">SECURE ACCESS</p>
        <h1>{mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : mode === "reset" ? "Enter verification code" : "Welcome back"}</h1>
        <p className="muted">{mode === "register" ? "Create an account to save your farm workspace." : mode === "forgot" ? "We will send a 6-digit verification code to your email." : mode === "reset" ? "Enter the code and choose a new password." : "Sign in to access your saved crop intelligence workspace."}</p>
        <form onSubmit={submit} className="stack">
          {mode === "register" && <label>Name<input value={name} onChange={e => setName(e.target.value)} type="text" autoComplete="name" required minLength={2} maxLength={80} /></label>}
          <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" /></label>
          {mode === "reset" && <label>Verification code<input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required /></label>}
          {mode !== "forgot" && <label>{mode === "reset" ? "New password" : "Password"}<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} /></label>}
          {error && <div className="error">{error}</div>}
          {notice && <div className="voice-notice">{notice}</div>}
          <button className="primary" disabled={loading}>{loading ? "Please wait…" : mode === "register" ? "Create account →" : mode === "forgot" ? "Send code →" : mode === "reset" ? "Set new password →" : "Sign in →"}</button>
        </form>
        <div className="stack" style={{ marginTop: 18 }}>
          {mode === "login" && <><button className="ghost" type="button" onClick={() => { setMode("register"); setError(""); setNotice(""); }}>Create a new account</button><button className="ghost" type="button" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}>Forgot password?</button></>}
          {mode !== "login" && <button className="ghost" type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>← Back to sign in</button>}
        </div>
      </section>
    </main>
  );
}
