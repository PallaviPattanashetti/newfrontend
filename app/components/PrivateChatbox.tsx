"use client";

import { useEffect, useState } from "react";
import { startConnection, registerUser, sendPrivateMessage, stopConnection } from "@/lib/signalservices";

export default function PrivateChatbox() {
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [toUser, setToUser] = useState("");
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<string[]>([]);

  useEffect(() => {
    startConnection((from, msg) => {
      setChatLog(prev => [...prev, `From ${from}: ${msg}`]);
    });

    return () => {
      stopConnection();
    };
  }, []);

  const handleRegister = async () => {
      await registerUser(username);
      setRegistered(true);
  };

  const handleSend = async () => {
      await sendPrivateMessage(toUser, username, message);
      setChatLog(prev => [...prev, `To ${toUser}: ${message}`]);
      setMessage("");
  };

  return (
    <div>
      {!registered ? (
        <>
          <input type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)}/>
          <button onClick={handleRegister}>Register</button>
        </>
      ) : (
        <>
          <div>
            <input type="text" placeholder="Send to..." value={toUser} onChange={e => setToUser(e.target.value)} />
            <input type="text" placeholder="Your message" value={message} onChange={e => setMessage(e.target.value)}/>
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
        </>
      )}
    </div>
  );
}
