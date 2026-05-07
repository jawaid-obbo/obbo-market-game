import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

export default function App() {
  const userId = "000001";

  const [price, setPrice] = useState(0);
  const [prevPrice, setPrevPrice] = useState(0);
  const [oc, setOc] = useState(0);
  const [obc, setObc] = useState(0);
  const [qty, setQty] = useState(1);
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);

  const intervalRef = useRef(null);

  /* ---------------- LIVE SYNC ---------------- */

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const { data: market } = await supabase
          .from("market_state")
          .select("current_price")
          .eq("id", 1)
          .single();

        if (market && active) {
          setPrevPrice((p) => {
            setHistory((h) => {
              const newHist = [...h, market.current_price].slice(-20);
              return newHist;
            });
            return price;
          });

          setPrice(market.current_price);
        }

        const { data: wallet } = await supabase
          .from("wallets")
          .select("oc_balance, obc_balance, active")
          .eq("user_id", userId)
          .single();

        if (wallet && active && wallet.active) {
          setOc(wallet.oc_balance);
          setObc(wallet.obc_balance);
        }
      } catch (err) {
        console.log(err.message);
      }
    };

    fetchData();

    intervalRef.current = setInterval(fetchData, 5000);

    return () => {
      active = false;
      clearInterval(intervalRef.current);
    };
  }, [price]);

  /* ---------------- TRADE ---------------- */

  const trade = async (type) => {
    const { data } = await supabase.functions.invoke("trade-execute", {
      body: { user_id: userId, type, quantity: qty },
    });

    if (data) {
      setPrice(data.price);
      setOc(data.oc);
      setObc(data.obc);

      setLogs((l) => [`${type} ${qty} @ ${data.price}`, ...l]);
    }
  };

  /* ---------------- UI ANIMATION ---------------- */

  const isUp = price > prevPrice;
  const isDown = price < prevPrice;

  /* ---------------- UI ---------------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        display: "flex",
        fontFamily: "Arial",
      }}
    >
      {/* LEFT PANEL */}
      <div style={{ width: "22%", background: "#111", padding: 15 }}>
        <h3>ACCOUNT</h3>
        <p>OC: {oc}</p>
        <p>OBC: {obc}</p>
        <p>ID: {userId}</p>

        <hr />

        <h4>HISTORY</h4>
        <div style={{ fontSize: 12 }}>
          {history.slice(-5).map((p, i) => (
            <div key={i}>{p}</div>
          ))}
        </div>
      </div>

      {/* CENTER (COIN WORLD) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* OBBO COIN */}
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "gold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
            fontWeight: "bold",
            color: "black",
            boxShadow: isUp
              ? "0 0 40px lime"
              : isDown
              ? "0 0 40px red"
              : "0 0 40px gold",
            transform: isUp
              ? "scale(1.05)"
              : isDown
              ? "scale(0.98)"
              : "scale(1)",
            transition: "all 0.3s ease",
          }}
        >
          🅱 {price}
        </div>

        <p style={{ opacity: 0.6 }}>
          {isUp ? "🟢 UP" : isDown ? "🔴 DOWN" : "⚪ STABLE"}
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: "28%", background: "#111", padding: 15 }}>
        <h3>TRADE</h3>

        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          style={{ width: "100%", padding: 10 }}
        />

        <button
          onClick={() => trade("BUY")}
          style={{ width: "50%", background: "green", padding: 10 }}
        >
          BUY
        </button>

        <button
          onClick={() => trade("SELL")}
          style={{ width: "50%", background: "red", padding: 10 }}
        >
          SELL
        </button>

        <hr />

        <h4>LOGS</h4>
        {logs.map((l, i) => (
          <div key={i} style={{ fontSize: 12 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
