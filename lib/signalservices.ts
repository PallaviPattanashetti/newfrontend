import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { getApiBaseUrl, getToken } from "@/lib/user-services";

import type { LiveDmPayload } from "@/lib/dm-services";

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let stopPromise: Promise<void> | null = null;
let activeConsumers = 0;
let stopTimeout: ReturnType<typeof setTimeout> | null = null;
let registeredUsername = "";

const normalizeLivePayloadFromObject = (value: Record<string, unknown>) => {
  const from = value.from ?? value.From;
  const to = value.to ?? value.To;
  const message = value.message ?? value.Message;
  const sentAtUtc = value.sentAtUtc ?? value.SentAtUtc ?? new Date().toISOString();
  const readAtUtc = value.readAtUtc ?? value.ReadAtUtc ?? null;

  if (typeof from !== "string" || typeof to !== "string" || typeof message !== "string") {
    return null;
  }

  return {
    from,
    to,
    message,
    sentAtUtc: typeof sentAtUtc === "string" && sentAtUtc.trim() ? sentAtUtc : new Date().toISOString(),
    readAtUtc: typeof readAtUtc === "string" ? readAtUtc : null,
  } as LiveDmPayload;
};

const normalizeReceivePrivateMessageArgs = (args: unknown[]): LiveDmPayload | null => {
  if (args.length === 0) {
    return null;
  }

  const firstArg = args[0];

  if (firstArg && typeof firstArg === "object") {
    return normalizeLivePayloadFromObject(firstArg as Record<string, unknown>);
  }

  if (typeof firstArg === "string") {
    const from = firstArg;
    const to = args[1];
    const message = args[2];
    const sentAtUtc = args[3];
    const readAtUtc = args[4];

    if (typeof to !== "string" || typeof message !== "string") {
      return null;
    }

    return {
      from,
      to,
      message,
      sentAtUtc: typeof sentAtUtc === "string" && sentAtUtc.trim() ? sentAtUtc : new Date().toISOString(),
      readAtUtc: typeof readAtUtc === "string" ? readAtUtc : null,
    };
  }

  return null;
};

const getHubUrlCandidates = () => {
  const explicitHubUrl = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL?.trim() ?? "";
  const candidates = [explicitHubUrl, `${getApiBaseUrl()}/chatHub`];

  return [...new Set(candidates.map((value) => value.trim()).filter(Boolean))];
};

const buildConnection = (hubUrl: string, onReceivePrivate: (payload: LiveDmPayload) => void) => {
  const hubConnection = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getToken(),
    })
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  hubConnection.on("ReceivePrivateMessage", (...args: unknown[]) => {
    const payload = normalizeReceivePrivateMessageArgs(args);
    if (!payload) {
      return;
    }

    onReceivePrivate(payload);
  });

  hubConnection.onreconnected(async () => {
    if (!registeredUsername) {
      return;
    }

    try {
      await hubConnection.invoke("Register", registeredUsername);
    } catch (error) {
      console.error("SignalR re-register failed", error);
    }
  });

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
    registeredUsername = "";
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

export const startConnection = async (onReceivePrivate: (payload: LiveDmPayload) => void) => {
  activeConsumers += 1;
  cancelScheduledStop();

  if (connection) {
    connection.off("ReceivePrivateMessage");
    connection.on("ReceivePrivateMessage", (...args: unknown[]) => {
      const payload = normalizeReceivePrivateMessageArgs(args);
      if (!payload) {
        return;
      }

      onReceivePrivate(payload);
    });

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
  registeredUsername = username;
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
