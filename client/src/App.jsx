import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.jsx";
import CompliancePage from "./pages/CompliancePage.jsx";
import FleetPage from "./pages/FleetPage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import SystemHealthPage from "./pages/SystemHealthPage.jsx";
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/app" element={<DashboardPage user={user} onLogout={logout} />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="system" element={<SystemHealthPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

