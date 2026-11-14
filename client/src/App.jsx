import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.jsx";
import CompliancePage from "./pages/CompliancePage.jsx";
import FleetPage from "./pages/FleetPage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import SystemHealthPage from "./pages/SystemHealthPage.jsx";
import TruckRecordPage from "./pages/TruckRecordPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage authenticated={Boolean(user)} />} />
        <Route
          path="/login"
          element={checkingSession
            ? <div className="session-loading">Restoring Celsyn session…</div>
            : user
              ? <Navigate to="/app/overview" replace />
              : <LoginPage onLogin={login} />}
        />
        <Route
          path="/app"
          element={checkingSession
            ? <div className="session-loading">Restoring Celsyn session…</div>
            : user
              ? <DashboardPage user={user} onLogout={logout} />
              : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="fleet/:truckId" element={<TruckRecordPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="system" element={<SystemHealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

