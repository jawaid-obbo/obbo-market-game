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

  const chatRef = useRef(null);

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
        ref={chatRef}
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
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={send} style={{ padding: 10 }}>
          SEND
        </button>
      </div>
    </div>
  );
});

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const userId = "000001";

  const [view, setView] = useState("market");

  const [price, setPrice] = useState(0);
  const [prevPrice, setPrevPrice] = useState(0);

  const [history, setHistory] = useState([]);

  const intervalRef = useRef(null);

  /* MARKET ENGINE */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("market_state")
        .select("current_price")
        .eq("id", 1)
        .single();

      if (data) {
        setPrevPrice((p) => price);
        setPrice(data.current_price);

        setHistory((h) =>
          [...h, data.current_price].slice(-30)
        );
      }
    };

    load();
    intervalRef.current = setInterval(load, 5000);

    return () => clearInterval(intervalRef.current);
  }, [price]);

  return (
    <div style={{ display: "flex", height: "100vh", color: "white", background: "#0b0b0b" }}>
      
      {/* NAV */}
      <div style={{ width: 200, background: "#111", padding: 10 }}>
        <h3>OBBO</h3>

        <button onClick={() => setView("market")}>Market</button>
        <button onClick={() => setView("support")}>Support</button>
      </div>

      {/* MAIN */}
      {view === "market" && (
        <MarketView price={price} prevPrice={prevPrice} history={history} />
      )}

      {view === "support" && (
        <SupportChat userId={userId} />
      )}
    </div>
  );
}
