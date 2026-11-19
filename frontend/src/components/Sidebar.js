import React from "react";
import {
  LayoutDashboard,
  Monitor,
  Terminal,
  History,
  Settings,
  Orbit,
  Circle,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Devices", icon: Monitor },
  { name: "Commands", icon: Terminal },
  { name: "History", icon: History },
  { name: "Settings", icon: Settings },
];

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Orbit size={22} />
        </div>

        <div className="brand-text">
          <h1>orbit</h1>
          <span>AGENT CONTROL PLATFORM</span>
        </div>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="navigation">
        {navigationItems.map(({ name, icon: Icon }) => {
          const isActive = activePage === name;

          return (
            <button
              key={name}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onNavigate(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="connection-status">
          <Circle size={8} fill="currentColor" />
          <span>System operational</span>
        </div>

        <div className="sidebar-footer">
          <span>ORBIT</span>
          <span>v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;