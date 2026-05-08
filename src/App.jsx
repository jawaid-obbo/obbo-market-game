import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

export default function App() {
  const userId = "000001";

  const [view, setView] = useState("market");

  const [price, setPrice] = useState(0);
  const [prevPrice, setPrevPrice] = useState(0);

  const [oc, setOc] = useState(0);
  const [obc, setObc] = useState(0);

  const [qty, setQty] = useState(1);

  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  const [supportMessage, setSupportMessage] = useState("");
  const [supportStatus, setSupportStatus] = useState("");

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
            [...h, market.current_price].slice(-25)
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

  /* ---------------- SUPPORT SEND ---------------- */

  const sendSupportMessage = async () => {
    if (!supportMessage.trim()) {
      setSupportStatus("Please write a message");
      return;
    }

    const { error } = await supabase
      .from("support_messages")
      .insert([
        {
          user_id: userId,
          message: supportMessage,
        },
      ]);

    if (error) {
      setSupportStatus("Error sending message");
      console.log(error.message);
    } else {
      setSupportStatus("Message sent successfully");
      setSupportMessage("");
    }
  };

  const isUp = price > prevPrice;
  const isDown = price < prevPrice;

  /* ---------------- SIMPLE CHART ---------------- */

  const Chart = () => {
    if (history.length < 2) return <p>No chart data</p>;

    const max = Math.max(...history);
    const min = Math.min(...history);

    return (
      <div style={{ marginTop: 20 }}>
        <svg width="100%" height="120">
          {history.map((p, i) => {
            if (i === 0) return null;

            const x1 = (i - 1) * (300 / history.length);
            const x2 = i * (300 / history.length);

            const y1 =
              100 -
              ((history[i - 1] - min) / (max - min || 1)) * 100;

            const y2 =
              100 -
              ((p - min) / (max - min || 1)) * 100;

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
  };

  /* ---------------- NAV ---------------- */

  const Nav = () => (
    <div style={{ width: "22%", background: "#111", padding: 15 }}>
      <h2>OBBO</h2>

      <p>ID: {userId}</p>
      <p>OC: {oc}</p>
      <p>OBC: {obc}</p>

      <hr />

      <button onClick={() => setView("market")}>Market</button>
      <button onClick={() => setView("bank")}>Bank</button>
      <button onClick={() => setView("history")}>History</button>
      <button onClick={() => setView("support")}>Support</button>
    </div>
  );

  /* ---------------- MARKET ---------------- */

  const Market = () => (
    <div style={{ flex: 1, textAlign: "center", paddingTop: 40 }}>
      <div style={{ background: "red", padding: 5, fontSize: 12 }}>
        ⚠ OBBO not responsible for trading loss
      </div>

      <div
        style={{
          background: "green",
          padding: 5,
          fontSize: 12,
        }}
      >
        OBBO COMPANY OBLIGED: OC 1 = PKR 1
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

      <Chart />
    </div>
  );

  /* ---------------- BANK ---------------- */

  const Bank = () => (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>BANK</h2>

      <p>Deposit coming soon</p>
      <p>Withdraw coming soon</p>

      <p>OC Balance: {oc}</p>
      <p>OBC Balance: {obc}</p>
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

      <p>User ID: {userId}</p>

      <textarea
        placeholder="Write your issue..."
        value={supportMessage}
        onChange={(e) => setSupportMessage(e.target.value)}
        style={{
          width: "100%",
          height: 120,
          marginTop: 10,
          padding: 10,
        }}
      />

      <button
        onClick={sendSupportMessage}
        style={{
          marginTop: 10,
          padding: 10,
          background: "blue",
          color: "white",
        }}
      >
        SEND MESSAGE
      </button>

      <p>{supportStatus}</p>
    </div>
  );

  /* ---------------- TRADE ---------------- */

  const Trade = () => (
    <div style={{ width: "25%", background: "#111", padding: 15 }}>
      <h2>TRADE</h2>

      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        style={{ width: "100%", padding: 10 }}
      />

      <button
        onClick={() => trade("BUY")}
        style={{
          width: "50%",
          background: "green",
          color: "white",
          padding: 10,
        }}
      >
        BUY
      </button>

      <button
        onClick={() => trade("SELL")}
        style={{
          width: "50%",
          background: "red",
          color: "white",
          padding: 10,
        }}
      >
        SELL
      </button>

      <h3>LOGS</h3>

      {logs.map((l, i) => (
        <div key={i} style={{ fontSize: 12 }}>
          {l}
        </div>
      ))}
    </div>
  );

  /* ---------------- MAIN ---------------- */

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0b0b0b",
        color: "white",
      }}
    >
      <Nav />

      {view === "market" && <Market />}
      {view === "bank" && <Bank />}
      {view === "history" && <History />}
      {view === "support" && <Support />}

      <Trade />
    </div>
  );
}
