import React from "react";

function StatCard({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>

        <div className={`stat-icon ${accent || ""}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
}

export default StatCard;