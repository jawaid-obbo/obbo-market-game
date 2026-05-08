import { useEffect, useState, useRef, memo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- MARKET VIEW ---------------- */

const MarketView = memo(({ price, prevPrice, history }) => {
  const isUp = price > prevPrice;
  const isDown = price < prevPrice;

  const max = Math.max(...history, 1);
  const min = Math.min(...history, 1);

  return (
    <div style={{ flex: 1, textAlign: "center", paddingTop: 40 }}>
      <div style={{ background: "red", padding: 5, fontSize: 12 }}>
        ⚠ OBBO not responsible for trading loss
      </div>

      <div style={{ background: "green", padding: 5, fontSize: 12 }}>
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

      {/* CHART */}
      <div style={{ marginTop: 20 }}>
        <svg width="320" height="120">
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
    </div>
  );
});

/* ---------------- SUPPORT ---------------- */

const SupportView = memo(({ userId }) => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const sendMessage = async () => {
    if (!message.trim()) {
      setStatus("Please write message");
      return;
    }

    const { error } = await supabase
      .from("support_messages")
      .insert([
        {
          user_id: userId,
          message,
        },
      ]);

    if (error) {
      setStatus("Error sending message");
    } else {
      setStatus("Message sent");
      setMessage("");
    }
  };

  return (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>SUPPORT</h2>

      <p>User ID: {userId}</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your issue..."
        style={{
          width: "100%",
          height: 120,
          padding: 10,
          outline: "none",
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          marginTop: 10,
          padding: 10,
          background: "blue",
          color: "white",
        }}
      >
        SEND MESSAGE
      </button>

      <p>{status}</p>
    </div>
  );
});

/* ---------------- MAIN APP ---------------- */

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

  const intervalRef = useRef(null);

  /* ---------------- LIVE ENGINE ---------------- */

  useEffect(() => {
    const load = async () => {
      const { data: market } = await supabase
        .from("market_state")
        .select("current_price")
        .eq("id", 1)
        .single();

      if (market) {
        setPrevPrice((prev) => price);
        setPrice(market.current_price);

        setHistory((h) =>
          [...h, market.current_price].slice(-25)
        );
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("oc_balance, obc_balance")
        .eq("user_id", userId)
        .single();

      if (wallet) {
        setOc(wallet.oc_balance);
        setObc(wallet.obc_balance);
      }
    };

    load();

    intervalRef.current = setInterval(load, 5000);

    return () => clearInterval(intervalRef.current);
  }, [price]);

  /* ---------------- TRADE ---------------- */

  const trade = async (type) => {
    const { data } = await supabase.functions.invoke(
      "trade-execute",
      {
        body: {
          user_id: userId,
          type,
          quantity: qty,
        },
      }
    );

    if (data) {
      setOc(data.oc);
      setObc(data.obc);

      setLogs((l) => [
        `${type} ${qty} @ ${data.price}`,
        ...l,
      ]);
    }
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

  /* ---------------- TRADE PANEL ---------------- */

  const TradePanel = memo(() => (
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
        <div key={i}>{l}</div>
      ))}
    </div>
  ));

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

      {view === "market" && (
        <MarketView
          price={price}
          prevPrice={prevPrice}
          history={history}
        />
      )}

      {view === "bank" && (
        <div style={{ flex: 1, padding: 20 }}>
          <h2>BANK</h2>
          <p>Deposit coming soon</p>
          <p>Withdraw coming soon</p>
        </div>
      )}

      {view === "history" && (
        <div style={{ flex: 1, padding: 20 }}>
          <h2>FULL HISTORY</h2>

          {history.map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>
      )}

      {view === "support" && (
        <SupportView userId={userId} />
      )}

      <TradePanel />
    </div>
  );
}
