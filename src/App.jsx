import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ---------------- SUPABASE ---------------- */

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

export default function App() {
  const userId = "000001";

  const [price, setPrice] = useState(0);
  const [oc, setOc] = useState(0);
  const [obc, setObc] = useState(0);
  const [qty, setQty] = useState(1);
  const [logs, setLogs] = useState([]);

  /* ---------------- STABLE AUTO UPDATE SYSTEM ---------------- */

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      try {
        // MARKET PRICE
        const { data: market } = await supabase
          .from("market_state")
          .select("current_price")
          .eq("id", 1)
          .single();

        if (isActive && market) {
          setPrice(market.current_price);
        }

        // WALLET DATA
        const { data: wallet } = await supabase
          .from("wallets")
          .select("oc_balance, obc_balance, active")
          .eq("user_id", userId)
          .single();

        if (isActive && wallet && wallet.active) {
          setOc(wallet.oc_balance);
          setObc(wallet.obc_balance);
        }
      } catch (err) {
        console.log("FETCH ERROR:", err.message);
      }
    };

    // FIRST LOAD
    fetchData();

    // 🔵 AUTO LOOP (NO REFRESH NEEDED)
    const interval = setInterval(() => {
      fetchData();
    }, 5000); // 5 seconds (recommended stable)

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  /* ---------------- TRADE FUNCTION ---------------- */

  const trade = async (type) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "trade-execute",
        {
          body: {
            user_id: userId,
            type,
            quantity: qty,
          },
        }
      );

      if (error) {
        alert(error.message);
        return;
      }

      if (data) {
        setPrice(data.price);
        setOc(data.oc);
        setObc(data.obc);

        setLogs((prev) => [
          `${type} ${qty} OBC @ ${data.price}`,
          ...prev,
        ]);
      }
    } catch (err) {
      console.log("TRADE ERROR:", err.message);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        fontFamily: "Arial",
        display: "flex",
      }}
    >
      {/* LEFT */}
      <div style={{ width: "25%", background: "#111", padding: 20 }}>
        <h2>ACCOUNT</h2>

        <p>OC</p>
        <h2 style={{ color: "green" }}>{oc}</h2>

        <p>OBC</p>
        <h2 style={{ color: "orange" }}>{obc}</h2>

        <p>ID</p>
        <h4>{userId}</h4>
      </div>

      {/* CENTER */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "gold",
            color: "black",
            fontSize: 40,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px gold",
          }}
        >
          🅱 {price}
        </div>

        <p style={{ opacity: 0.5 }}>OBBO LIVE MARKET</p>
      </div>

      {/* RIGHT */}
      <div style={{ width: "30%", background: "#111", padding: 20 }}>
        <h2>TRADE</h2>

        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          style={{ width: "100%", padding: 10 }}
        />

        <button
          onClick={() => trade("BUY")}
          style={{ width: "50%", padding: 10, background: "green" }}
        >
          BUY
        </button>

        <button
          onClick={() => trade("SELL")}
          style={{ width: "50%", padding: 10, background: "red" }}
        >
          SELL
        </button>

        <div style={{ marginTop: 20 }}>
          <h3>LOGS</h3>
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
