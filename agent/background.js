const API_BASE_URL = "http://127.0.0.1:8000";
const WS_BASE_URL = "ws://127.0.0.1:8000";

let socket = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let isConnecting = false;

async function getAgentId() {
  const data = await chrome.storage.local.get(["agentId"]);

  if (data.agentId) {
    return data.agentId;
  }

  const agentId = `AGENT-${crypto.randomUUID()}`;

  await chrome.storage.local.set({
    agentId,
    agentName: "Local Chrome Agent"
  });

  return agentId;
}

// ============================================================
// CONNECTION MANAGEMENT
// ============================================================

async function connectAgent() {
  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    const agentId = await getAgentId();

    const ws = new WebSocket(
      `${WS_BASE_URL}/agents/ws/${agentId}`
    );

    socket = ws;

    ws.onopen = async () => {
      if (socket !== ws) return;

      isConnecting = false;

      console.log("Orbit connected:", agentId);

      await chrome.storage.local.set({
        backendConnected: true
      });

      sendHeartbeat(ws);
      startHeartbeat();
    };

    ws.onmessage = async (event) => {
      if (socket !== ws) return;

      try {
        const message = JSON.parse(event.data);

        console.log("Received WebSocket message:", message);

        if (message.type === "execute_command") {
          await executeCommand(message.command, ws);
        }
      } catch (error) {
        console.error(
          "Failed to process WebSocket message:",
          error
        );
      }
    };

    ws.onclose = async () => {
      if (socket !== ws) return;

      console.warn("Orbit WebSocket disconnected");

      socket = null;
      isConnecting = false;

      stopHeartbeat();

      await chrome.storage.local.set({
        backendConnected: false
      });

      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error("Orbit WebSocket error:", error);

      if (socket === ws) {
        ws.close();
      }
    };
  } catch (error) {
    console.error("Failed to connect Orbit agent:", error);

    socket = null;
    isConnecting = false;

    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectAgent();
  }, 5000);
}

// ============================================================
// HEARTBEAT
// ============================================================

function startHeartbeat() {
  stopHeartbeat();

  heartbeatTimer = setInterval(() => {
    sendHeartbeat();
  }, 20000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function sendHeartbeat(ws = socket) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(JSON.stringify({
    type: "heartbeat",
    timestamp: new Date().toISOString()
  }));
}

// ============================================================
// COMMAND EXECUTION
// ============================================================

async function executeCommand(command, ws) {
  const commandId = command.command_id || crypto.randomUUID();

  console.log("Executing command:", command);

  let resultMessage;

  try {
    const result = await executeBrowserOperation(command);

    resultMessage = {
      type: "command_result",
      command_id: commandId,
      status: "success",
      result,
      completed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error("Command execution failed:", error);

    resultMessage = {
      type: "command_result",
      command_id: commandId,
      status: "failed",
      error: error.message,
      completed_at: new Date().toISOString()
    };
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(resultMessage));
  } else {
    console.error(
      "Unable to report command result. WebSocket disconnected.",
      commandId
    );
  }
}

// ============================================================
// ORIGIN HANDLING
// ============================================================

function getOriginsForDomain(scope) {
  if (!scope || scope.trim().toLowerCase() === "all") {
    return undefined;
  }

  let url;

  try {
    const normalizedScope = scope.includes("://")
      ? scope
      : `https://${scope}`;

    url = new URL(normalizedScope);
  } catch {
    throw new Error(`Invalid website scope: ${scope}`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(
      "Only HTTP and HTTPS websites are supported."
    );
  }

  const hostname = url.hostname.toLowerCase();

  const origins = new Set([url.origin]);

  if (!hostname.startsWith("www.")) {
    origins.add(`https://www.${hostname}`);
  }

  // Canva-specific origins.
  if (
    hostname === "canva.com" ||
    hostname.endsWith(".canva.com")
  ) {
    origins.add("https://canva.com");
    origins.add("https://www.canva.com");
    origins.add("https://ct.canva.com");
  }

  return [...origins];
}

// ============================================================
// BROWSER OPERATIONS
// ============================================================

async function executeBrowserOperation(command) {
  const payload = command.payload || command;

  const operation = payload.operation;
  const scope = payload.scope || "all";

  const origins = getOriginsForDomain(scope);

  const removalOptions = {
    since: 0
  };

  if (origins) {
    removalOptions.origins = origins;
  }

  console.log("Browser operation:", {
    operation,
    scope,
    origins
  });

  switch (operation) {
    case "clear_cache":
      await chrome.browsingData.remove(
        removalOptions,
        {
          cache: true,
          cacheStorage: true
        }
      );

      return {
        operation,
        scope,
        origins: origins || "all",
        message: "Browser cache cleared"
      };

    case "clear_cookies":
      await chrome.browsingData.remove(
        removalOptions,
        {
          cookies: true
        }
      );

      return {
        operation,
        scope,
        origins: origins || "all",
        message: "Cookies cleared"
      };

    case "clear_site_data":
      await chrome.browsingData.remove(
        removalOptions,
        {
          cache: true,
          cacheStorage: true,
          cookies: true,
          localStorage: true,
          indexedDB: true,
          serviceWorkers: true,
          webSQL: true
        }
      );

      return {
        operation,
        scope,
        origins: origins || "all",
        message: "Site data cleared"
      };

    default:
      throw new Error(
        `Unsupported operation: ${operation}`
      );
  }
}

// ============================================================
// CHROME EVENTS
// ============================================================

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Orbit extension installed or updated");

  await getAgentId();

  connectAgent();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome startup detected");

  connectAgent();
});

// ============================================================
// PERIODIC CONNECTION CHECK
// ============================================================

chrome.alarms.create("orbit-heartbeat", {
  periodInMinutes: 0.5
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "orbit-heartbeat") {
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectAgent();
  } else {
    sendHeartbeat();
  }
});

// ============================================================
// POPUP COMMUNICATION
// ============================================================

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === "GET_AGENT_STATUS") {
      chrome.storage.local.get(
        [
          "agentId",
          "agentName",
          "backendConnected"
        ],
        sendResponse
      );

      return true;
    }
  }
);

// ============================================================
// INITIALIZATION
// ============================================================

connectAgent();