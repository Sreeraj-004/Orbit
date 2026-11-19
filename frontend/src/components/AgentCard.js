import React, { useEffect, useRef, useState } from "react";
import {
  Monitor,
  MoreHorizontal,
  Terminal,
  LoaderCircle,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function AgentCard({ agent, onPerformCommand }) {
  const isOnline = agent.status === "online";

  const [menuOpen, setMenuOpen] = useState(false);
  const [commands, setCommands] = useState([]);
  const [loadingCommands, setLoadingCommands] = useState(false);
  const [commandError, setCommandError] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const fetchCommands = async () => {
    setLoadingCommands(true);
    setCommandError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/commands/`);

      if (!response.ok) {
        throw new Error("Unable to fetch commands");
      }

      const data = await response.json();

      const activeCommands = data.filter(
        (command) => command.is_active
      );

      setCommands(activeCommands);
    } catch (error) {
      setCommandError(error.message);
    } finally {
      setLoadingCommands(false);
    }
  };

  const handleMenuToggle = async () => {
    const nextState = !menuOpen;

    setMenuOpen(nextState);

    if (nextState && commands.length === 0) {
      await fetchCommands();
    }
  };

  const handleCommandClick = (command) => {
    setMenuOpen(false);

    if (onPerformCommand) {
      onPerformCommand(agent, command);
    }
  };

  return (
    <div className="agent-card">
      <div className="agent-card-header">
        <div className="agent-icon">
          <Monitor size={20} />
        </div>

        <span className={`status-badge ${isOnline ? "online" : "offline"}`}>
          <span className="status-dot" />
          {isOnline ? "Online" : "Offline"}
        </span>

        <div className="agent-menu-container" ref={menuRef}>
          <button
            className="icon-button"
            aria-label="Perform an action"
            onClick={handleMenuToggle}
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="agent-action-menu">
              <div className="agent-action-menu-header">
                <Terminal size={15} />
                <span>Perform an action</span>
              </div>

              {loadingCommands && (
                <div className="agent-menu-loading">
                  <LoaderCircle size={16} className="spin" />
                  Loading commands...
                </div>
              )}

              {commandError && (
                <div className="agent-menu-error">
                  {commandError}
                  <button onClick={fetchCommands}>
                    Retry
                  </button>
                </div>
              )}

              {!loadingCommands &&
                !commandError &&
                commands.length === 0 && (
                  <div className="agent-menu-empty">
                    No available commands
                  </div>
                )}

              {!loadingCommands &&
                !commandError &&
                commands.map((command) => (
                  <button
                    key={command.command_id}
                    className="agent-action-item"
                    onClick={() => handleCommandClick(command)}
                  >
                    <div className="agent-action-icon">
                      <Terminal size={15} />
                    </div>

                    <div className="agent-action-details">
                      <span className="agent-action-name">
                        {command.name}
                      </span>

                      <span className="agent-action-description">
                        {command.description}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="agent-details">
        <h3>{agent.agent_name || "Unnamed Agent"}</h3>
        <p className="agent-id">{agent.agent_id}</p>
      </div>

      <div className="agent-meta">
        <div>
          <span className="meta-label">Platform</span>
          <span className="meta-value">
            {agent.platform || "Unknown"}
          </span>
        </div>

        <div>
          <span className="meta-label">Browser</span>
          <span className="meta-value">
            {agent.browser || "Chrome"}
            {agent.browserVersion
              ? ` ${agent.browserVersion}`
              : ""}
          </span>
        </div>
      </div>

      <div className="agent-card-footer">
        <span>
          {agent.last_seen
            ? new Date(agent.last_seen).toLocaleString()
            : "Never connected"}
        </span>

        <span className={isOnline ? "online-text" : "offline-text"}>
          {isOnline ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
}

export default AgentCard;