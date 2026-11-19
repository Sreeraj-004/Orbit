import { useState } from "react";
import { X } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const commandOptions = {
  clear_cache: {
    name: "Clear Browser Cache",
    description: "Clears cached browser resources.",
    command_type: "browser",
    payload: {
      operation: "clear_cache",
      browser: "chrome",
      scope: "all",
      cache_types: ["http_cache"],
    },
  },
  clear_cookies: {
    name: "Clear Cookies",
    description: "Removes browser cookies.",
    command_type: "browser",
    payload: {
      operation: "clear_cookies",
      browser: "chrome",
      scope: "all",
    },
  },
  clear_site_data: {
    name: "Clear Site Data",
    description:
      "Clears cookies, cache, local storage, and other site data.",
    command_type: "browser",
    payload: {
      operation: "clear_site_data",
      browser: "chrome",
      scope: "all",
    },
  },
};

export default function CreateCommand({ onClose, onCreated }) {
  const [selectedCommand, setSelectedCommand] = useState("clear_cache");
  const [commandName, setCommandName] = useState(
    commandOptions.clear_cache.name
  );

  const [browser, setBrowser] = useState("chrome");
  const [scope, setScope] = useState("all");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const command = commandOptions[selectedCommand];

  const handleCommandChange = (event) => {
    const selected = event.target.value;

    setSelectedCommand(selected);
    setCommandName(commandOptions[selected].name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!commandName.trim()) {
      setError("Command name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        ...command.payload,
        browser,
        scope: scope.trim() || "all",
      };

      const response = await fetch(`${API_BASE_URL}/commands/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: commandName.trim(),
          description: command.description,
          command_type: command.command_type,
          payload,
          created_by: "admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create command");
      }

      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="command-modal-overlay" onClick={onClose}>
      <div
        className="command-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="command-modal-header">
          <div>
            <h2>Create Command</h2>
            <p>Create a reusable command for Orbit agents.</p>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Command</label>

            <select
              value={selectedCommand}
              onChange={handleCommandChange}
            >
              {Object.entries(commandOptions).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="commandName">Command Name</label>

            <input
              id="commandName"
              type="text"
              value={commandName}
              onChange={(event) => setCommandName(event.target.value)}
              placeholder="Enter command name"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <div className="command-description">
              {command.description}
            </div>
          </div>

          <div className="form-group">
            <label>Browser</label>

            <select
              value={browser}
              onChange={(event) => setBrowser(event.target.value)}
            >
              <option value="chrome">Google Chrome</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scope">Scope</label>

            <input
              id="scope"
              type="text"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              placeholder="e.g. https://example.com or all"
            />
          </div>

          <div className="command-config-preview">
            <div className="config-preview-header">
              <span>Command Preview</span>
              <span className="command-type">
                {command.command_type}
              </span>
            </div>

            <div className="config-preview-content">
              <div>
                <span>Name</span>
                <strong>{commandName || "Untitled Command"}</strong>
              </div>

              <div>
                <span>Operation</span>
                <strong>{command.payload.operation}</strong>
              </div>

              <div>
                <span>Browser</span>
                <strong>{browser}</strong>
              </div>

              <div>
                <span>Scope</span>
                <strong>{scope || "all"}</strong>
              </div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="command-modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-command-btn"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Command"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}