const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const statusDescription = document.getElementById("statusDescription");
const agentIdElement = document.getElementById("agentId");
const agentNameElement = document.getElementById("agentName");
const backendStatusElement = document.getElementById("backendStatus");
const refreshButton = document.getElementById("refreshButton");

async function loadAgentStatus() {
  const response = await chrome.runtime.sendMessage({
    type: "GET_AGENT_STATUS"
  });

  agentIdElement.textContent = response.agentId || "Unavailable";
  agentNameElement.textContent = response.agentName || "Orbit Agent";

  if (response.backendConnected) {
    statusIndicator.className = "status-indicator connected";
    statusText.textContent = "Connected";
    statusDescription.textContent = "Orbit backend is reachable";
    backendStatusElement.textContent = "Online";
    backendStatusElement.className = "online";
  } else {
    statusIndicator.className = "status-indicator disconnected";
    statusText.textContent = "Disconnected";
    statusDescription.textContent = "Unable to reach Orbit backend";
    backendStatusElement.textContent = "Offline";
    backendStatusElement.className = "offline";
  }
}

refreshButton.addEventListener("click", async () => {
  refreshButton.disabled = true;
  refreshButton.textContent = "Checking...";

  await chrome.runtime.sendMessage({
    type: "CHECK_CONNECTION"
  });

  await loadAgentStatus();

  refreshButton.disabled = false;
  refreshButton.textContent = "Refresh Connection";
});

loadAgentStatus();