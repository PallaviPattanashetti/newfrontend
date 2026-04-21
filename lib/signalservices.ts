import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { getApiBaseUrl } from "@/lib/user-services";

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let stopPromise: Promise<void> | null = null;
let activeConsumers = 0;
let stopTimeout: ReturnType<typeof setTimeout> | null = null;

const LEGACY_HUB_URL = "https://testsignalrdor-aredgsa5hshwebdx.westus3-01.azurewebsites.net/hubs/Message";

const getHubUrlCandidates = () => {
  const explicitHubUrl = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL?.trim() ?? "";
  const candidates = [explicitHubUrl, `${getApiBaseUrl()}/chatHub`, LEGACY_HUB_URL];

  return [...new Set(candidates.map((value) => value.trim()).filter(Boolean))];
};

const buildConnection = (hubUrl: string, onReceivePrivate: (from: string, message: string) => void) => {
  const hubConnection = new HubConnectionBuilder()
    .withUrl(hubUrl)
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  hubConnection.on("ReceivePrivateMessage", (data: { from: string, message: string }) => onReceivePrivate(data.from, data.message));

  return hubConnection;
};

const cancelScheduledStop = () => {
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
};

const finalizeStop = async (targetConnection: HubConnection) => {
  if (startPromise) {
    try {
      await startPromise;
    } catch {
      // Ignore startup failure and continue cleanup.
    }
  }

  if (!connection || connection !== targetConnection || activeConsumers > 0) {
    return;
  }

  startPromise = null;
  stopPromise = targetConnection.stop().finally(() => {
    stopPromise = null;
  });

  await stopPromise;

  if (connection === targetConnection) {
    connection = null;
  }
};

const waitForConnectedState = async () => {
  if (!connection) {
    throw new Error("Connection not created.");
  }

  const startedAt = Date.now();

  while (
    connection.state === HubConnectionState.Connecting ||
    connection.state === HubConnectionState.Reconnecting ||
    connection.state === HubConnectionState.Disconnecting
  ) {
    if (Date.now() - startedAt > 10000) {
      throw new Error("Timed out waiting for SignalR connection.");
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (connection.state !== HubConnectionState.Connected) {
    throw new Error(`SignalR connection is ${connection.state.toLowerCase()}.`);
  }
};

const ensureConnectionStarted = async () => {
  if (!connection) {
    throw new Error("Connection not created.");
  }

  if (stopPromise) {
    await stopPromise;
  }

  if (connection.state === HubConnectionState.Connected) {
    return;
  }

  if (
    connection.state === HubConnectionState.Connecting ||
    connection.state === HubConnectionState.Reconnecting ||
    connection.state === HubConnectionState.Disconnecting
  ) {
    await waitForConnectedState();
    return;
  }

  if (!startPromise) {
    startPromise = connection
      .start()
      .finally(() => {
        startPromise = null;
      });
  }

  await startPromise;
  await waitForConnectedState();
};

export const startConnection = async (onReceivePrivate: (from: string, message: string) => void) => {
  activeConsumers += 1;
  cancelScheduledStop();

  if (connection) {
    connection.off("ReceivePrivateMessage");
    connection.on("ReceivePrivateMessage", (data: { from: string, message: string }) => onReceivePrivate(data.from, data.message));

    try {
      await ensureConnectionStarted();
      return;
    } catch {
      activeConsumers = Math.max(0, activeConsumers - 1);
      await stopConnection();
    }
  }

  let lastError: unknown = null;

  for (const hubUrl of getHubUrlCandidates()) {
    const candidateConnection = buildConnection(hubUrl, onReceivePrivate);
    connection = candidateConnection;

    try {
      await ensureConnectionStarted();
      return;
    } catch (error) {
      lastError = error;
      startPromise = null;
      connection = null;

      try {
        await candidateConnection.stop();
      } catch {
        // Ignore cleanup failure and continue to the next candidate.
      }
    }
  }

  activeConsumers = Math.max(0, activeConsumers - 1);
  throw lastError instanceof Error ? lastError : new Error("Unable to connect to SignalR hub.");
};

export const registerUser = async (username: string) => {
  if (!connection) throw new Error("Connection not started.");
  await ensureConnectionStarted();
  await connection.invoke("Register", username);
};

export const sendPrivateMessage = async (to: string, from: string, message: string) => {
  if (!connection) throw new Error("Connection not started.");
  await ensureConnectionStarted();
  await connection.invoke("SendPrivateMessage", to, from, message);
};

export const stopConnection = async () => {
  activeConsumers = Math.max(0, activeConsumers - 1);

  if (!connection) {
    return;
  }

  cancelScheduledStop();

  if (activeConsumers > 0) {
    return;
  }

  stopTimeout = setTimeout(() => {
    if (!connection || activeConsumers > 0) {
      stopTimeout = null;
      return;
    }

    const targetConnection = connection;

    void finalizeStop(targetConnection).finally(() => {
      stopTimeout = null;
    });
  }, 250);
};
