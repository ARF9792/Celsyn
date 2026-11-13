import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("demo@chainpulse.dev");
  const [password, setPassword] = useState("chainpulse-demo");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onLogin({ email, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark">CP</div>
        <p className="section-kicker">Cold-chain command center</p>
        <h1>Welcome to ChainPulse</h1>
        <p className="login-copy">Sign in with the seeded hackathon demo operator account.</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in to dashboard"}</button>
        </form>
        <p className="demo-credentials">Demo: demo@chainpulse.dev / chainpulse-demo</p>
      </section>
    </main>
  );
}

