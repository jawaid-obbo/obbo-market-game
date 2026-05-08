import { useEffect, useState, useRef, memo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- MARKET ---------------- */

const MarketView = memo(({ price }) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0b",
      }}
    >
      <h2 style={{ letterSpacing: 2 }}>OBBO MARKET</h2>

      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle,#ffd700,#b8860b)",
          color: "black",
          fontSize: 42,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 30px rgba(255,215,0,0.5)",
          transition: "0.3s",
        }}
      >
        {price}
      </div>

      <p style={{ opacity: 0.7 }}>LIVE PRICE</p>
    </div>
  );
});

/* ---------------- SUPPORT CHAT ---------------- */

const SupportChat = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("support_chat")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 1200); // ⚡ faster updates
    return () => clearInterval(i);
  }, []);

  const send = async () => {
    if (!input.trim()) return;

    // OPTIMISTIC UI (instant feel)
    const temp = {
      id: Date.now(),
      user_id: userId,
      sender: "user",
      message: input,
    };

    setMessages((prev) => [...prev, temp]);
    setInput("");

    await supabase.from("support_chat").insert([
      {
        user_id: userId,
        sender: "user",
        message: temp.message,
      },
    ]);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: 20,
        background: "#0b0b0b",
      }}
    >
      <h2 style={{ letterSpacing: 2 }}>SUPPORT CHAT</h2>

      {/* CHAT BOX */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "rgba(20,20,20,0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.sender === "user" ? "right" : "left",
              margin: "6px 0",
            }}
          >
            <span
              style={{
                background:
                  m.sender === "admin"
                    ? "linear-gradient(135deg,#1f8b4c,#0f3d22)"
                    : "linear-gradient(135deg,#2b6fff,#102a66)",
                padding: "10px 12px",
                borderRadius: 12,
                display: "inline-block",
                color: "white",
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                maxWidth: "70%",
              }}
            >
              {m.message}
            </span>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#111",
            color: "white",
            outline: "none",
          }}
        />

        <button
          onClick={send}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "linear-gradient(135deg,#2b6fff,#1a3fb8)",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
};

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const userId = "000001";

  const [view, setView] = useState("market");
  const [price, setPrice] = useState(100);

  const intervalRef = useRef(null);

  /* MARKET ENGINE */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("market_state")
        .select("current_price")
        .eq("id", 1)
        .single();

      if (data) setPrice(data.current_price);
    };

    load();
    intervalRef.current = setInterval(load, 2000); // ⚡ faster market feel

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: 200,
          background: "#111",
          padding: 10,
          borderRight: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h3>OBBO</h3>

        <button onClick={() => setView("market")}>Market</button>
        <button onClick={() => setView("support")}>Support</button>
      </div>

      {/* MAIN */}
      {view === "market" && <MarketView price={price} />}
      {view === "support" && <SupportChat userId={userId} />}
    </div>
  );
}
