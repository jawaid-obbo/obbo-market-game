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

  /* ---------------- INITIAL LOAD ---------------- */

  const loadInitialData = async () => {
    try {
      // MARKET
      const { data: market } = await supabase
        .from("market_state")
        .select("*")
        .eq("id", 1)
        .single();

      if (market) {
        setPrice(market.current_price || 0);
      }

      // WALLET
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (wallet && wallet.active) {
        setOc(wallet.oc_balance || 0);
        setObc(wallet.obc_balance || 0);
      }
    } catch (err) {
      console.log("INIT ERROR:", err.message);
    }
  };

  /* ---------------- REALTIME SUBSCRIPTIONS ---------------- */

  useEffect(() => {
    loadInitialData();

    // 🔴 REALTIME MARKET LISTENER
    const marketChannel = supabase
      .channel("market_live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "market_state",
        },
        (payload) => {
          const m = payload.new;
          if (m) {
            setPrice(m.current_price);

            // optional log for debug/game feel
            setLogs((prev) => [
              `Price updated → ${m.current_price}`,
              ...prev,
            ]);
          }
        }
      )
      .subscribe();

    // 🔵 REALTIME WALLET LISTENER
    const walletChannel = supabase
      .channel("wallet_live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const w = payload.new;
          if (w) {
            setOc(w.oc_balance);
            setObc(w.obc_balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(marketChannel);
      supabase.removeChannel(walletChannel);
    };
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
      }}
    >
      {/* HEADER */}
      <div style={{ padding: 20, textAlign: "center" }}>
        <h1>OBBO MARKET GAME</h1>
      </div>

      {/* MAIN */}
      <div style={{ display: "flex", gap: 20, padding: 20 }}>

        {/* LEFT */}
        <div style={{ flex: 1, background: "#111", padding: 20 }}>
          <h2>LIVE PRICE</h2>

          <div
            style={{
              fontSize: 60,
              color: "gold",
              textAlign: "center",
              margin: 20,
            }}
          >
            🪙 {price}
          </div>

          <h3>OC: {oc}</h3>
          <h3>OBC: {obc}</h3>
        </div>

        {/* RIGHT */}
        <div style={{ flex: 2, background: "#111", padding: 20 }}>
          <h2>TRADE</h2>

          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            style={{ padding: 10, width: "100%", marginBottom: 10 }}
          />

          <button
            onClick={() => trade("BUY")}
            style={{ padding: 10, width: "50%", background: "green" }}
          >
            BUY
          </button>

          <button
            onClick={() => trade("SELL")}
            style={{ padding: 10, width: "50%", background: "red" }}
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
    </div>
  );
}
