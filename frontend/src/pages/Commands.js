import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Terminal,
  ChevronDown,
} from "lucide-react";

import CreateCommand from "../components/CreateCommand";
import ViewCommand from "../components/ViewCommand";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Commands() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(null);

  const fetchCommands = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/commands/`);

      if (!response.ok) {
        throw new Error("Failed to fetch commands");
      }

      const data = await response.json();
      setCommands(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommands();
  }, []);

  const filteredCommands = commands.filter((command) =>
    `${command.name} ${command.description} ${command.command_type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCommands = commands.filter(
    (command) => command.is_active
  ).length;

  const commandTypes = new Set(
    commands.map((command) => command.command_type)
  ).size;

  return (
    <div className="commands-page">
      {/* Header */}
      <div className="commands-header">
        <div>
          <h1>Commands</h1>
          <p>Manage reusable commands for your browser agents.</p>
        </div>

        <button
          className="create-command-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={18} />
          Create Command
        </button>
      </div>

      {/* Search and Refresh */}
      <div className="commands-toolbar">
        <div className="commands-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          className="refresh-btn"
          onClick={fetchCommands}
          title="Refresh commands"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* Statistics */}
      <div className="commands-stats">
        <div className="command-stat">
          <span>Total Commands</span>
          <strong>{commands.length}</strong>
        </div>

        <div className="command-stat">
          <span>Active Commands</span>
          <strong>{activeCommands}</strong>
        </div>

        <div className="command-stat">
          <span>Command Types</span>
          <strong>{commandTypes}</strong>
        </div>
      </div>

      {/* Command Library */}
      <div className="commands-table-container">
        <div className="commands-table-header">
          <h3>Command Library</h3>
          <span>{filteredCommands.length} commands</span>
        </div>

        {loading ? (
          <div className="commands-empty">
            <RefreshCw className="loading-icon" size={24} />
            <p>Loading commands...</p>
          </div>
        ) : error ? (
          <div className="commands-error">
            <p>{error}</p>

            <button onClick={fetchCommands}>
              Retry
            </button>
          </div>
        ) : filteredCommands.length === 0 ? (
          <div className="commands-empty">
            <Terminal size={32} />
            <p>No commands found</p>
            <span>
              {search
                ? "Try another search term."
                : "Create your first command to get started."}
            </span>
          </div>
        ) : (
          <div className="commands-list">
            {filteredCommands.map((command) => (
              <div
                className="command-row"
                key={command.command_id}
              >
                <div className="command-icon">
                  <Terminal size={19} />
                </div>

                <div className="command-info">
                  <div className="command-title-row">
                    <h4>{command.name}</h4>

                    <span
                      className={`command-status ${
                        command.is_active ? "active" : "inactive"
                      }`}
                    >
                      {command.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p>{command.description}</p>

                  <div className="command-meta">
                    <span>{command.command_id}</span>

                    <span className="command-type">
                      {command.command_type}
                    </span>

                    <span>
                      Created by {command.created_by || "admin"}
                    </span>
                  </div>
                </div>

                <button
                  className="command-more-btn"
                  title="View command details"
                  onClick={() => setSelectedCommand(command)}
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Command Component */}
      {showCreateForm && (
        <CreateCommand
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false);
            fetchCommands();
          }}
        />
      )}

      {/* View Command Component */}
      {selectedCommand && (
        <ViewCommand
          command={selectedCommand}
          onClose={() => setSelectedCommand(null)}
        />
      )}
    </div>
  );
}