import { Activity, MapPinned, Snowflake, Thermometer } from "lucide-react";
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
      <div className="login-layout" data-enter>
        <section className="login-brand-panel">
          <div className="login-brand"><span className="brand-mark"><Snowflake size={19} /></span><div><strong>ChainPulse</strong><span>Cold-chain operations</span></div></div>
          <div className="login-brand-copy">
            <p className="section-kicker">Fleet monitoring for operators</p>
            <h1>See which refrigerated truck needs attention now.</h1>
            <p>ChainPulse tracks live temperature, location and refrigeration state across 25 simulated trucks.</p>
          </div>
          <div className="login-capabilities" aria-label="Platform capabilities">
            <span><MapPinned size={17} />Live fleet positions</span>
            <span><Thermometer size={17} />Temperature excursions</span>
            <span><Activity size={17} />Pipeline health</span>
          </div>
        </section>
        <section className="login-card">
          <p className="section-kicker">Demo operator access</p>
          <h2>Sign in to ChainPulse</h2>
          <p className="login-copy">The seeded account is already entered for the hackathon demonstration.</p>
          {error && <div className="error-banner" role="alert">{error}</div>}
          <form onSubmit={submit}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in to dashboard"}</button>
          </form>
          <p className="demo-credentials"><span>Demo account</span>demo@chainpulse.dev / chainpulse-demo</p>
        </section>
      </div>
    </main>
  );
}

