import React from "react";

function History() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">ACTIVITY LOG</div>
          <h1>History</h1>
          <p className="page-description">
            Review previous command executions and results.
          </p>
        </div>
      </header>

      <div className="empty-state">
        <h2>Execution History</h2>
        <p>Command history will be displayed here.</p>
      </div>
    </div>
  );
}

export default History;