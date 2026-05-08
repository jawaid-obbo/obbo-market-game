import { useEffect, useState, useRef, memo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- MARKET ---------------- */

const MarketView = memo(({ price, prevPrice, history }) => {
  const isUp = price > prevPrice;
  const isDown = price < prevPrice;

  const max = Math.max(...history, 1);
  const min = Math.min(...history, 1);

  return (
    <div style={{ flex: 1, textAlign: "center", paddingTop: 40 }}>
      <h2>MARKET</h2>

      <div
        style={{
          margin: "40px auto",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "gold",
          color: "black",
          fontSize: 40,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isUp
            ? "0 0 40px lime"
            : isDown
            ? "0 0 40px red"
            : "0 0 30px gold",
          transition: "0.3s",
        }}
      >
        🅱 {price}
      </div>

      <p>{isUp ? "🟢 UP" : isDown ? "🔴 DOWN" : "⚪ STABLE"}</p>

      <svg width="320" height="120">
        {history.map((p, i) => {
          if (i === 0) return null;

          const x1 = (i - 1) * (300 / history.length);
          const x2 = i * (300 / history.length);

          const y1 =
            100 - ((history[i - 1] - min) / (max - min || 1)) * 100;

          const y2 =
            100 - ((p - min) / (max - min || 1)) * 100;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="lime"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
});

/* ---------------- SUPPORT CHAT ---------------- */

const SupportChat = memo(({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  /* LOAD CHAT */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("support_chat")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    load();
    const interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, []);

  /* SEND MESSAGE */
  const send = async () => {
    if (!input.trim()) return;

    await supabase.from("support_chat").insert([
      {
        user_id: userId,
        sender: "user",
        message: input,
      },
    ]);

    setInput("");
  };

  return (
    <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column" }}>
      <h2>SUPPORT CHAT</h2>

      {/* CHAT BOX */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#111",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.sender === "user" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <span
              style={{
                background: m.sender === "user" ? "blue" : "gray",
                padding: 8,
                borderRadius: 8,
                display: "inline-block",
              }}
            >
              {m.message}
            </span>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={{ display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          style={{ flex
