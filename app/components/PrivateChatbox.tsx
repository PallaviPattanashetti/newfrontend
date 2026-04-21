"use client";

import { useEffect, useState } from "react";
import { startConnection, registerUser, sendPrivateMessage, stopConnection } from "@/lib/signalservices";

export default function PrivateChatbox() {
  const [username, setUsername] = useState("");
  const [toUser, setToUser] = useState("");
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<string[]>([]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");

    if (!storedUsername) {
      console.error("No username found. User not logged in.");
      return;
    }

    setUsername(storedUsername);

    const init = async () => {
      await startConnection((from, msg) => {
        setChatLog(prev => [...prev, `From ${from}: ${msg}`]);
      });

      await registerUser(storedUsername);
    };

    init();

    return () => {
      stopConnection();
    };
  }, []);



  const handleSend = async () => {
      await sendPrivateMessage(toUser, username, message);
      setChatLog(prev => [...prev, `To ${toUser}: ${message}`]);
      setMessage("");
  };

return (
  <div>
    <p>Logged in as: <strong>{username}</strong></p>

    <div>
      <input
        type="text"
        placeholder="Send to..."
        value={toUser}
        onChange={e => setToUser(e.target.value)}
      />
      <input
        type="text"
        placeholder="Your message"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>

    <div>
      <h3>Chat Log:</h3>
      <ul>
        {chatLog.map((entry, idx) => (
          <li key={idx}>{entry}</li>
        ))}
      </ul>
    </div>
  </div>
);
}
