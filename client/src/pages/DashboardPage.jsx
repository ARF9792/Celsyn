import { useState } from "react";
import {
  Activity,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  TriangleAlert,
  Truck,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import ConnectionBadge from "../components/ConnectionBadge.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";

const navigation = [
  { to: "/app/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/app/fleet", label: "Live fleet", icon: Truck },
  { to: "/app/incidents", label: "Incident center", icon: TriangleAlert },
  { to: "/app/compliance", label: "Compliance", icon: ClipboardCheck },
  { to: "/app/system", label: "System health", icon: Activity },
];

const titles = {
  overview: ["Fleet safety", "Live operating state across the refrigerated fleet."],
  fleet: ["Live fleet", "Vehicles, telemetry and selected asset details."],
  truck: ["Truck record", "Live safety state, telemetry history and compliance."],
  incidents: ["Incident center", "Warning and critical cold-chain events."],
  compliance: ["Compliance", "Temperature adherence and excursion history."],
  system: ["System health", "Ingestion, broadcast and persistence performance."],
};

export default function DashboardPage({ user, onLogout }) {
  const dashboard = useDashboardData();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const section = location.pathname.startsWith("/app/fleet/")
    ? "truck"
    : location.pathname.split("/").at(-1);
  const [title, description] = titles[section] || titles.overview;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#dashboard-content">Skip to dashboard content</a>

      <aside id="primary-navigation" className={`app-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <BrandLogo className="sidebar-logo" />
          <div><strong>Celsyn</strong><span>Cold-chain operations</span></div>
          <button className="sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <p className="sidebar-label">Operations</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="nav-icon" size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="operator-avatar" aria-hidden="true">{user.name.slice(0, 1)}</div>
          <div className="operator-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
          <button className="sidebar-logout" type="button" onClick={onLogout} aria-label="Log out of Celsyn">
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <div className="app-main">
        <header className="app-topbar">
          <button
            className="menu-button"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            aria-controls="primary-navigation"
          >
            <Menu size={21} />
          </button>
          <div className="page-title"><h1>{title}</h1><p>{description}</p></div>
          <ConnectionBadge status={dashboard.connectionStatus} />
        </header>

        <main id="dashboard-content" className="dashboard-shell" tabIndex="-1">
          {dashboard.error && <div className="error-banner" role="alert">{dashboard.error}</div>}
          <Outlet context={dashboard} />
        </main>
      </div>
    </div>
  );
}
