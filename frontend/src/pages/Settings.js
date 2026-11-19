import React from "react";

function Settings() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">CONFIGURATION</div>
          <h1>Settings</h1>
          <p className="page-description">
            Configure Orbit and manage platform preferences.
          </p>
        </div>
      </header>

      <div className="empty-state">
        <h2>Platform Settings</h2>
        <p>Application settings will be available here.</p>
      </div>
    </div>
  );
}

export default Settings;