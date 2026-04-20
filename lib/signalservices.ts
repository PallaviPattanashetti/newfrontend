import { HubConnectionBuilder, HubConnection, LogLevel } from "@microsoft/signalr";

let connection: HubConnection | null = null;

export const startConnection = async (onReceivePrivate: (from: string, message: string) => void) => {
  if (connection) return;

  connection = new HubConnectionBuilder()
    .withUrl("https://testsignalrdor-aredgsa5hshwebdx.westus3-01.azurewebsites.net/hubs/Message")
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  connection.on("ReceivePrivateMessage", (data: { from: string, message: string }) => onReceivePrivate(data.from, data.message));

  await connection.start();
};

export const registerUser = async (username: string) => {
  if (!connection) throw new Error("Connection not started.");
  await connection.invoke("Register", username);
};

export const sendPrivateMessage = async (to: string, from: string, message: string) => {
  if (!connection) throw new Error("Connection not started.");
  await connection.invoke("SendPrivateMessage", to, from, message);
};

export const stopConnection = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
  }
};
