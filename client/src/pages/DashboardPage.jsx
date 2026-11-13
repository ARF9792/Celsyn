import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import ConnectionBadge from "../components/ConnectionBadge.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";

const navigation = [
  { to: "/app/overview", label: "Overview", icon: "OV" },
  { to: "/app/fleet", label: "Live fleet", icon: "FL" },
  { to: "/app/incidents", label: "Incident center", icon: "IN" },
  { to: "/app/compliance", label: "Compliance", icon: "CO" },
  { to: "/app/system", label: "System health", icon: "SY" },
];

const titles = {
  overview: ["Overview", "Live operational summary across the cold-chain fleet."],
  fleet: ["Live fleet", "Monitor vehicles, telemetry and selected asset details."],
  incidents: ["Incident center", "Review warning and critical cold-chain events."],
  compliance: ["Compliance", "Measure temperature adherence and excursion history."],
  system: ["System health", "Inspect ingestion, broadcasting and persistence performance."],
};

export default function DashboardPage({ user, onLogout }) {
  const dashboard = useDashboardData();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const section = location.pathname.split("/").at(-1);
  const [title, description] = titles[section] || titles.overview;

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">CP</div>
          <div><strong>ChainPulse</strong><span>Operations</span></div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <p className="sidebar-label">Workspace</p>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="operator-avatar">{user.name.slice(0, 1)}</div>
          <div className="operator-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
          <button className="sidebar-logout" type="button" onClick={onLogout}>Log out</button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <div className="app-main">
        <header className="app-topbar">
          <button className="menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">☰</button>
          <div className="page-title"><h1>{title}</h1><p>{description}</p></div>
          <ConnectionBadge status={dashboard.connectionStatus} />
        </header>

        <main className="dashboard-shell">
          {dashboard.error && <div className="error-banner">{dashboard.error}</div>}
          <Outlet context={dashboard} />
        </main>
      </div>
    </div>
  );
}

