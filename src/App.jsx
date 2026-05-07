import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

export default function App() {
  const userId = "000001";

  const [view, setView] = useState("dashboard");

  const [price, setPrice] = useState(0);
  const [prevPrice, setPrevPrice] = useState(0);

  const [oc, setOc] = useState(0);
  const [obc, setObc] = useState(0);

  const [qty, setQty] = useState(1);

  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  const intervalRef = useRef(null);

  /* ---------------- LIVE ENGINE ---------------- */

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data: market } = await supabase
          .from("market_state")
          .select("current_price")
          .eq("id", 1)
          .single();

        if (market && active) {
          setPrevPrice(price);
          setPrice(market.current_price);

          setHistory((h) =>
            [...h, market.current_price].slice(-30)
          );
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
      } catch (e) {
        console.log(e.message);
      }
    };

    load();
    intervalRef.current = setInterval(load, 5000);

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

  const isUp = price > prevPrice;
  const isDown = price < prevPrice;

  /* ---------------- NAV ---------------- */

  const Nav = () => (
    <div style={{ width: "22%", background: "#111", padding: 15 }}>
      <h2>OBBO</h2>

      <p>ID: {userId}</p>
      <p>OC: {oc}</p>
      <p>OBC: {obc}</p>

      <hr />

      <button onClick={() => setView("dashboard")}>Dashboard</button>
      <button onClick={() => setView("bank")}>Bank</button>
      <button onClick={() => setView("history")}>History</button>
      <button onClick={() => setView("support")}>Support</button>
    </div>
  );

  /* ---------------- DASHBOARD ---------------- */

  const Dashboard = () => (
    <div style={{ flex: 1, textAlign: "center", paddingTop: 60 }}>
      
      <div style={{ background: "red", padding: 5, fontSize: 12 }}>
        ⚠ OBBO is not responsible for trading loss
      </div>

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
          transform: isUp
            ? "scale(1.05)"
            : isDown
            ? "scale(0.98)"
            : "scale(1)",
          transition: "0.3s",
        }}
      >
        🅱 {price}
      </div>

      <p>{isUp ? "🟢 UP" : isDown ? "🔴 DOWN" : "⚪ STABLE"}</p>

      <div>
        HISTORY:
        {history.slice(-10).map((h, i) => (
          <span key={i} style={{ marginLeft: 5 }}>{h}</span>
        ))}
      </div>
    </div>
  );

  /* ---------------- BANK ---------------- */

  const Bank = () => (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>BANK</h2>
      <p>Deposit (coming soon)</p>
      <p>Withdraw (coming soon)</p>
      <p>OC: {oc}</p>
      <p>OBC: {obc}</p>
    </div>
  );

  /* ---------------- HISTORY ---------------- */

  const History = () => (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>FULL HISTORY</h2>
      {history.map((h, i) => (
        <div key={i}>{h}</div>
      ))}
    </div>
  );

  /* ---------------- SUPPORT ---------------- */

  const Support = () => (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>SUPPORT</h2>
      <p>Send message (UI only)</p>
      <textarea style={{ width: "100%", height: 100 }} />
    </div>
  );

  /* ---------------- TRADE PANEL ---------------- */

  const Trade = () => (
    <div style={{ width: "25%", background: "#111", padding: 15 }}>
      <h2>TRADE</h2>

      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        style={{ width: "100%", padding: 10 }}
      />

      <button onClick={() => trade("BUY")} style={{ width: "50%", background: "green" }}>
        BUY
      </button>

      <button onClick={() => trade("SELL")} style={{ width: "50%", background: "red" }}>
        SELL
      </button>

      <h3>LOGS</h3>
      {logs.map((l, i) => (
        <div key={i} style={{ fontSize: 12 }}>{l}</div>
      ))}
    </div>
  );

  /* ---------------- MAIN RENDER ---------------- */

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0b0b", color: "white" }}>
      <Nav />

      {view === "dashboard" && <Dashboard />}
      {view === "bank" && <Bank />}
      {view === "history" && <History />}
      {view === "support" && <Support />}

      <Trade />
    </div>
  );
}
