// src/chat.js is the main component that handles the chat interface and sends user queries to the server.
import React, { useState } from "react";
import Sidebar from "./sidebar"; // Sidebar component for SQL results
import "./ChatWindow.css";
import { apiUrl } from "./api";

const Chat = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [sqlResults, setSqlResults] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);

const sendMessage = async () => {
  if (!query.trim()) return;

  const newMessage = { sender: "user", text: query };
  setMessages((prev) => [
    ...prev,
    newMessage,
    { sender: "bot", text: "__LOADING__" }
  ]);
  setQuery("");

  try {
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    // Replace loading message with real one
    setMessages((prev) => {
      const updated = [...prev];
      const loadingIndex = updated.findIndex(
        (m) => m.sender === "bot" && m.text === "__LOADING__"
      );
      if (loadingIndex !== -1) {
        updated[loadingIndex] = { sender: "bot", text: data.response };
      } else {
        updated.push({ sender: "bot", text: data.response });
      }
      return updated;
    });

    // SQL sidebar logic
    if (data.sql_results && data.sql_results.length > 5) {
      setSqlResults(data.sql_results);
      setSidebarVisible(true);
    } else {
      setSidebarVisible(false);
    }

  } catch (error) {
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "Error connecting to the server." },
    ]);
  }
};
  return (
    <div className="chat-container">
      {sidebarVisible && <Sidebar sqlResults={sqlResults} />}{" "}
      {/* Sidebar for SQL results */}
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text === "__LOADING__" ? (
  <div className="typing-indicator">
    Bot is typing
    <span className="dots">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  </div>
) : (
  msg.text
)}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
