"use client";
import { useEffect, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

type Message = {
  sender: string;
  content: string;
  sentTime: Date;
};

const contacts = [
  { id: 1, name: "Alice", avatar: "A", status: "Online" },
  { id: 2, name: "Bob", avatar: "B", status: "Offline" },
];

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [selectedPerson, setSelectedPerson] = useState("Alice");

  // 🔌 SignalR connection
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

        connect.on("ReceiveMessage", (sender, content, sentTime) => {
          setMessages((prev) => [
            ...prev,
            { sender, content, sentTime },
          ]);
        });

        connect.invoke("RetrieveMessageHistory");
      })
      .catch((err) =>
        console.error("Error while connecting to SignalR Hub:", err)
      );

    return () => {
      connect.stop();
    };
  }, []);

  // 📤 Send message
  const sendMessage = async () => {
    if (!connection || connection.state !== "Connected") return;

    if (newMessage.trim()) {
      await connection.send("PostMessage", newMessage);
      setNewMessage("");
    }
  };

  // 👤 Identify current user
  const isMyMessage = (username: string) => {
    return connection && username === connection.connectionId;
  };

  // 🔍 Filter messages per selected contact (basic example)
  const filteredMessages = messages.filter(
    (msg) =>
      msg.sender === selectedPerson ||
      (connection && msg.sender === connection.connectionId)
  );

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6 font-sans"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <div className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
          Messages
        </h1>
      </div>

      <div className="w-full max-w-225 h-150 border border-gray-200 bg-[#28a8af]/42 flex shadow-xl rounded-2xl overflow-hidden">
        
        {/* Contacts */}
        <div className="w-72 border-r bg-gray-50/50 p-4 overflow-y-auto">
          <h2 className="text-gray-400 text-xs mb-4">Contacts</h2>
          <div className="flex flex-col gap-1">
            {contacts.map((person) => (
              <button
                key={person.id}
                onClick={() => setSelectedPerson(person.name)}
                className={`p-3 rounded-lg flex items-center gap-3 ${
                  selectedPerson === person.name
                    ? "bg-blue-50 text-blue-600"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200">
                  {person.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm">{person.name}</p>
                  <p className="text-xs opacity-70">{person.status}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-bold">{selectedPerson}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            {filteredMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 px-4 rounded-2xl max-w-[80%] text-sm ${
                  isMyMessage(msg.sender)
                    ? "bg-blue-600 text-white self-end rounded-tr-none"
                    : "bg-gray-100 text-gray-800 self-start rounded-tl-none"
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs opacity-70">
                  {new Date(msg.sentTime).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full h-11 px-4 rounded-full border bg-[#28a8af]/42"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="w-11 h-11 bg-blue-600 text-white rounded-full"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}