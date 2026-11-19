import React from "react";

function Devices() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">AGENT MANAGEMENT</div>
          <h1>Devices</h1>
          <p className="page-description">
            Manage registered agents and monitor device connectivity.
          </p>
        </div>
      </header>

      <div className="empty-state">
        <h2>Device Management</h2>
        <p>Registered agents will appear here.</p>
      </div>
    </div>
  );
}

export default Devices;