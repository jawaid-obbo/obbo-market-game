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

  /* ---------------- AUTO LOADER (FREE TIER SAFE) ---------------- */

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // MARKET DATA
        const { data: market } = await supabase
          .from("market_state")
          .select("*")
          .eq("id", 1)
          .single();

        if (market && isMounted) {
          setPrice(market.current_price || 0);
        }

        // WALLET DATA
        const { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (wallet && isMounted && wallet.active) {
          setOc(wallet.oc_balance || 0);
          setObc(wallet.obc_balance || 0);
        }
      } catch (err) {
        console.log("LOAD ERROR:", err.message);
      }
    };

    // first load
    loadData();

    // 🔵 polling loop (NO refresh needed)
    const interval = setInterval(() => {
      loadData();
    }, 4000); // every 4 seconds

    return () => {
      isMounted = false;
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
        setOc(data.oc);
        setObc(data.obc);
        setPrice(data.price);

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
      {/* LEFT PANEL */}
      <div
        style={{
          width: "25%",
          background: "#111",
          padding: 20,
        }}
      >
        <h2>ACCOUNT</h2>

        <div style={{ marginTop: 20 }}>
          <p>OC BALANCE</p>
          <h2 style={{ color: "#00ff99" }}>{oc}</h2>
        </div>

        <div>
          <p>OBC BALANCE</p>
          <h2 style={{ color: "#ffaa00" }}>{obc}</h2>
        </div>

        <div style={{ marginTop: 20 }}>
          <p>USER ID</p>
          <h4>{userId}</h4>
        </div>
      </div>

      {/* CENTER PANEL */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "gold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            color: "black",
            fontWeight: "bold",
            boxShadow: "0 0 40px gold",
          }}
        >
          🅱 {price}
        </div>

        <p style={{ opacity: 0.5, marginTop: 10 }}>
          OBBO LIVE MARKET
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: "30%",
          background: "#111",
          padding: 20,
        }}
      >
        <h2>TRADE PANEL</h2>

        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <button
          onClick={() => trade("BUY")}
          style={{
            width: "50%",
            padding: 10,
            background: "green",
            color: "white",
          }}
        >
          BUY
        </button>

        <button
          onClick={() => trade("SELL")}
          style={{
            width: "50%",
            padding: 10,
            background: "red",
            color: "white",
          }}
        >
          SELL
        </button>

        <div style={{ marginTop: 20 }}>
          <h3>LOGS</h3>
          {logs.map((l, i) => (
            <div key={i} style={{ fontSize: 12 }}>
              {l}
