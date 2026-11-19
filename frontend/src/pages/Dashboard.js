import React, { useEffect, useState } from "react";
import {
  Monitor,
  Wifi,
  WifiOff,
  Terminal,
  ArrowUpRight,
  Plus,
  Activity,
} from "lucide-react";

import StatCard from "../components/StatCard";
import AgentCard from "../components/AgentCard";

const API_BASE_URL = "http://127.0.0.1:8000";

const recentCommands = [
  {
    command: "DELETE_SITE_DATA",
    target: "DESKTOP-DEV01",
    site: "chatgpt.com",
    status: "success",
    time: "2 minutes ago",
  },
  {
    command: "CLEAR_CACHE",
    target: "WORKSTATION-02",
    site: "All websites",
    status: "success",
    time: "8 minutes ago",
  },
  {
    command: "DELETE_SITE_DATA",
    target: "LAPTOP-ADMIN",
    site: "github.com",
    status: "success",
    time: "15 minutes ago",
  },
  {
    command: "DELETE_SITE_DATA",
    target: "OFFICE-PC-04",
    site: "google.com",
    status: "failed",
    time: "32 minutes ago",
  },
];

function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  const handlePerformCommand = async (agent, command) => {
  const confirmed = window.confirm(
    `Execute "${command.name}" on ${agent.agent_name}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/agents/${agent.agent_id}/execute/${command.command_id}`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Command execution failed");
    }

    alert(
      `Command dispatched successfully!\n\n` +
      `Command: ${command.name}\n` +
      `Agent: ${agent.agent_name}`
    );

  } catch (error) {
    alert(`Execution failed: ${error.message}`);
  }
};

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/`);

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    const interval = setInterval(fetchAgents, 10000);

    return () => clearInterval(interval);
  }, []);

  const onlineAgents = agents.filter(
    (agent) => agent.status === "online"
  ).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">CONTROL CENTER</div>
          <h1>Dashboard</h1>
          <p className="page-description">
            Monitor agents and manage your distributed browser environment.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={17} />
          New Command
        </button>
      </header>

      <section className="stats-grid">
        <StatCard
          title="Total Agents"
          value={agents.length}
          subtitle="Registered devices"
          icon={Monitor}
          accent="blue"
        />

        <StatCard
          title="Online Agents"
          value={onlineAgents}
          subtitle="Currently connected"
          icon={Wifi}
          accent="green"
        />

        <StatCard
          title="Offline Agents"
          value={agents.length - onlineAgents}
          subtitle="Awaiting connection"
          icon={WifiOff}
          accent="red"
        />

        <StatCard
          title="Commands Today"
          value="24"
          subtitle="Across all agents"
          icon={Terminal}
          accent="purple"
        />
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Connected Agents</h2>
            <p>Devices registered with Orbit</p>
          </div>

          <button className="secondary-button">
            View all devices
            <ArrowUpRight size={16} />
          </button>
        </div>

        {loadingAgents ? (
          <div className="agents-loading">
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="agents-empty">
            No agents registered yet.
          </div>
        ) : (
          <div className="agents-grid">
            {agents.map((agent) => (
                <AgentCard
                key={agent.agent_id}
                agent={agent}
                onPerformCommand={handlePerformCommand}
                />
            ))}
            </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Recent Commands</h2>
            <p>Latest execution activity</p>
          </div>

          <button className="secondary-button">
            View history
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="command-table-wrapper">
          <table className="command-table">
            <thead>
              <tr>
                <th>COMMAND</th>
                <th>DEVICE</th>
                <th>TARGET</th>
                <th>STATUS</th>
                <th>TIME</th>
              </tr>
            </thead>

            <tbody>
              {recentCommands.map((command, index) => (
                <tr key={index}>
                  <td>
                    <span className="command-name">
                      <Terminal size={15} />
                      {command.command}
                    </span>
                  </td>

                  <td>{command.target}</td>

                  <td>
                    <span className="target-badge">
                      {command.site}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`execution-status ${command.status}`}
                    >
                      {command.status === "success"
                        ? "Completed"
                        : "Failed"}
                    </span>
                  </td>

                  <td className="time-cell">
                    {command.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="quick-actions">
        <div className="quick-action">
          <div className="quick-action-icon">
            <Terminal size={20} />
          </div>

          <div>
            <h3>Execute Command</h3>
            <p>Run an operation on one or multiple agents.</p>
          </div>

          <ArrowUpRight size={17} />
        </div>

        <div className="quick-action">
          <div className="quick-action-icon">
            <Monitor size={20} />
          </div>

          <div>
            <h3>Manage Devices</h3>
            <p>View and manage connected browser agents.</p>
          </div>

          <ArrowUpRight size={17} />
        </div>

        <div className="quick-action">
          <div className="quick-action-icon">
            <Activity size={20} />
          </div>

          <div>
            <h3>Agent Health</h3>
            <p>Monitor connectivity and agent status.</p>
          </div>

          <ArrowUpRight size={17} />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;