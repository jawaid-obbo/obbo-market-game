import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ---------------- SUPABASE ---------------- */
const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

export default function App() {
  const [price, setPrice] = useState(0);
  const [oc, setOc] = useState(0);
  const [obc, setObc] = useState(0);
  const [qty, setQty] = useState(1);
  const [logs, setLogs] = useState([]);
  const userId = "000001";

  /* ---------------- LOAD DATA ---------------- */
  const loadData = async () => {
    try {
      // PRICE
      const { data: market } = await supabase
        .from("market_state")
        .select("current_price")
        .eq("id", 1)
        .single();

      if (market) setPrice(market.current_price);

      // WALLET
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (wallet) {
        setOc(wallet.oc_balance);
        setObc(wallet.obc_balance);
      }
    } catch (err) {
      console.log("Load error:", err.message);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- TRADE ---------------- */
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
        setOc(data.oc);
        setObc(data.obc);
        setPrice(data.price);

        setLogs((prev) => [
          `${type} ${qty} OBC @ ${data.price} | Fee ${data.fee}`,
          ...prev,
        ]);
      }
    } catch (err) {
      console.log("Trade error:", err.message);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ background: "black", color: "white", minHeight: "100vh", padding: 20 }}>
      
      <h1 style={{ textAlign: "center" }}>OBBO MARKET GAME</h1>

      {/* PRICE */}
      <div style={{ textAlign: "center", margin: 20 }}>
        <h2>LIVE PRICE</h2>
        <div style={{ fontSize: 40, color: "lime" }}>{price}</div>
      </div>

      {/* WALLET */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "#111", padding: 10 }}>
          OC: {oc}
        </div>
        <div style={{ flex: 1, background: "#111", padding: 10 }}>
          OBC: {obc}
        </div>
      </div>

      {/* TRADE */}
      <div style={{ marginTop: 20 }}>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={() => trade("BUY")} style={{ flex: 1 }}>
            BUY
          </button>
          <button onClick={() => trade("SELL")} style={{ flex: 1 }}>
            SELL
          </button>
        </div>
      </div>

      {/* LOGS */}
      <div style={{ marginTop: 20 }}>
        <h3>LOGS</h3>
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
