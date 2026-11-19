import { useState } from "react";
import { X, Terminal, Pencil, Trash2, Save, Ban } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function ViewCommand({ command, onClose, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: command?.name || "",
    description: command?.description || "",
    command_type: command?.command_type || "",
    payload: JSON.stringify(command?.payload || {}, null, 2),
  });

  if (!command) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError("");

    let parsedPayload;

    try {
      parsedPayload = JSON.parse(formData.payload);
    } catch {
      setError("Payload must contain valid JSON.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/commands/${command.command_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            command_type: formData.command_type,
            payload: parsedPayload,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to update command.");
      }

      onUpdated?.(result);
      setIsEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${command.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/commands/${command.command_id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to delete command.");
      }

      onDeleted?.(command.command_id);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: command.name || "",
      description: command.description || "",
      command_type: command.command_type || "",
      payload: JSON.stringify(command.payload || {}, null, 2),
    });

    setError("");
    setIsEditing(false);
  };

  return (
    <div className="command-modal-overlay" onClick={onClose}>
      <div
        className="command-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="command-modal-header">
          <div>
            <h2>{isEditing ? "Edit Command" : "Command Details"}</h2>
            <p>
              {isEditing
                ? "Update command configuration."
                : "View command configuration and metadata."}
            </p>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="command-view-content">
          <div className="command-view-title">
            <div className="command-icon">
              <Terminal size={20} />
            </div>

            <div>
              {isEditing ? (
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="command-edit-input command-name-input"
                  placeholder="Command name"
                />
              ) : (
                <h3>{command.name}</h3>
              )}

              <span
                className={`command-status ${
                  command.is_active ? "active" : "inactive"
                }`}
              >
                {command.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="command-detail-group">
            <label>Command ID</label>
            <div>{command.command_id}</div>
          </div>

          <div className="command-detail-group">
            <label>Description</label>

            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="command-edit-input"
                rows={3}
              />
            ) : (
              <div>{command.description || "No description"}</div>
            )}
          </div>

          <div className="command-detail-group">
            <label>Command Type</label>

            {isEditing ? (
              <input
                name="command_type"
                value={formData.command_type}
                onChange={handleChange}
                className="command-edit-input"
              />
            ) : (
              <div>{command.command_type}</div>
            )}
          </div>

          <div className="command-detail-group">
            <label>Created By</label>
            <div>{command.created_by || "admin"}</div>
          </div>

          <div className="command-detail-group">
            <label>Created At</label>
            <div>
              {command.created_at
                ? new Date(command.created_at).toLocaleString()
                : "Unknown"}
            </div>
          </div>

          <div className="command-detail-group">
            <label>Payload</label>

            {isEditing ? (
              <textarea
                name="payload"
                value={formData.payload}
                onChange={handleChange}
                className="command-payload-edit"
                rows={10}
                spellCheck={false}
              />
            ) : (
              <pre className="command-payload">
                {JSON.stringify(command.payload, null, 2)}
              </pre>
            )}
          </div>

          {error && <div className="command-form-error">{error}</div>}
        </div>

        <div className="command-modal-footer">
          {isEditing ? (
            <>
              <button
                className="command-secondary-btn"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <Ban size={16} />
                Cancel
              </button>

              <button
                className="command-primary-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save size={16} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button
                className="command-delete-btn"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>

              <button
                className="command-primary-btn"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} />
                Edit Command
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}