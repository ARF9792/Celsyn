import { useEffect, useState } from "react";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { api, clearAccessToken, getAccessToken, setAccessToken } from "./services/api.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(getAccessToken()));

  useEffect(() => {
    if (!getAccessToken()) return;
    api.getCurrentUser()
      .then((payload) => setUser(payload.user))
      .catch(() => clearAccessToken())
      .finally(() => setCheckingSession(false));
  }, []);

  const login = async (credentials) => {
    const payload = await api.login(credentials);
    setAccessToken(payload.token);
    setUser(payload.user);
  };

  const logout = () => {
    clearAccessToken();
    setUser(null);
  };

  if (checkingSession) return <div className="session-loading">Restoring ChainPulse session…</div>;
  if (!user) return <LoginPage onLogin={login} />;
  return <DashboardPage user={user} onLogout={logout} />;
}

