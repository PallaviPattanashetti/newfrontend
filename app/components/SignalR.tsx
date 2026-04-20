"use client";
import { useEffect, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { UserLogin } from "@/interfaces/userinterfaces";

type Message = {
  senderId: string;
  recipientId: string;
  content: string;
  sentTime: string;
};

const contacts = [
  { id: "alice", name: "Alice", avatar: "A", status: "Online" },
  { id: "bob", name: "Bob", avatar: "B", status: "Offline" },
];

export default function ChatUI({user} : {user: UserLogin}) {
  // 🔑 simulate logged-in user
  const userId = user?.usernameOrEmail; 

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [selectedPerson, setSelectedPerson] = useState("bob");
  

  useEffect(() => {
    const connect = new HubConnectionBuilder()
      .withUrl(
        "https://testsignalrdor-aredgsa5hshwebdx.westus3-01.azurewebsites.net/hub"
      )
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(connect);

    connect
      .start()
      .then(() => {
        console.log("Connected!");

        // 🔑 receive strongly-typed message object
        connect.on("ReceiveMessage", (message: Message) => {
          console.log("RECEIVED:", message);
          setMessages((prev) => [...prev, message]);
        });

        connect.invoke("RetrieveMessageHistory", userId);
      })
      .catch((err) =>
        console.error("Error while connecting to SignalR Hub:", err)
      );

    return () => {
      connect.off("ReceiveMessage");
      connect.stop();
    };
  }, [userId]);

  const sendMessage = async () => {
    if (!connection || connection.state !== "Connected") return;

    if (newMessage.trim()) {
      const message: Message = {
        senderId: userId,
        recipientId: selectedPerson,
        content: newMessage,
        sentTime: new Date().toISOString(),
      };

      console.log("SENDING:", message);

      await connection.send("PostMessage", message);
      setNewMessage("");
    }
  };

  const isMyMessage = (senderId: string) => {
    return senderId === userId;
  };

  // 🔑 only show messages between current user + selected contact
  const filteredMessages = messages.filter(
    (msg) =>
      (msg.senderId === userId &&
        msg.recipientId === selectedPerson) ||
      (msg.senderId === selectedPerson &&
        msg.recipientId === userId)
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">Messages</h1>

      <div className="w-full max-w-4xl h-[600px] flex border rounded-xl overflow-hidden">
        
        {/* Contacts */}
        <div className="w-64 border-r p-4">
          {contacts.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelectedPerson(person.id)}
              className={`block w-full text-left p-2 rounded ${
                selectedPerson === person.id ? "bg-blue-100" : ""
              }`}
            >
              {person.name}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b font-bold">
            Chat with {selectedPerson}
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
            {filteredMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded max-w-xs ${
                  isMyMessage(msg.senderId)
                    ? "bg-blue-500 text-white self-end"
                    : "bg-gray-200 self-start"
                }`}
              >
                <div>{msg.content}</div>
                <div className="text-xs opacity-70">
                  {new Date(msg.sentTime).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 flex gap-2 border-t">
            <input
              className="flex-1 border rounded px-2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}