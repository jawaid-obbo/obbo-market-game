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

  // test account for now
  const userId = "000001";

  /* ---------------- LOAD DATA ---------------- */

  const loadData = async () => {
    try {
      // MARKET PRICE
      const { data: market } = await supabase
        .from("market_state")
        .select("current_price")
        .eq("id", 1)
        .single();

      if (market && market.current_price != null) {
        setPrice(market.current_price);
      }

      // USER WALLET
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (wallet && wallet.active === true) {
        setOc(wallet.oc_balance || 0);
        setObc(wallet.obc_balance || 0);
      }
    } catch (err) {
      console.log("LOAD ERROR:", err.message);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 2000);

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
            type: type,
            quantity: qty,
          },
        }
      );

      if (error) {
        alert(error.message);
        return;
      }

      if (data) {
        setOc(data.oc || 0);
        setObc(data.obc || 0);
        setPrice(data.price || 0);

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
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          borderBottom: "1px solid #222",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "42px" }}>
          OBBO MARKET GAME
        </h1>
      </div>

      {/* MAIN AREA */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          padding: "20px",
          gap: "20px",
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            flex: "1",
            minWidth: "280px",
            background: "#111",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h2>LIVE PRICE</h2>

          {/* COIN */}
          <div
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "gold",
              margin: "20px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "black",
              fontWeight: "bold",
              boxShadow: "0 0 30px gold",
            }}
          >
            <div style={{ fontSize: "42px" }}>B</div>

            <div style={{ fontSize: "28px" }}>
              {price}
            </div>
          </div>

          {/* WALLET */}
          <div
            style={{
              background: "#1a1a1a",
              padding: "15px",
              borderRadius: "12px",
              marginTop: "20px",
            }}
          >
            <h3>OC BALANCE</h3>
            <div
              style={{
                fontSize: "32px",
                color: "#00ff99",
              }}
            >
              {oc}
            </div>
          </div>

          <div
            style={{
              background: "#1a1a1a",
              padding: "15px",
              borderRadius: "12px",
              marginTop: "15px",
            }}
          >
            <h3>OBC BALANCE</h3>
            <div
              style={{
                fontSize: "32px",
                color: "#ffaa00",
              }}
            >
              {obc}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          style={{
            flex: "2",
            minWidth: "300px",
            background: "#111",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h2>MARKET CHART</h2>

          {/* TEMP CHART PLACEHOLDER */}
          <div
            style={{
              height: "220px",
              background:
                "linear-gradient(to top, #0f0 1%, transparent 1%)",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          ></div>

          {/* TRADE PANEL */}
          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h2>TRADE PANEL</h2>

            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "18px",
                borderRadius: "10px",
                marginBottom: "15px",
              }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => trade("BUY")}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "green",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "18px",
                }}
              >
                BUY
              </button>

              <button
                onClick={() => trade("SELL")}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "18px",
                }}
              >
                SELL
              </button>
            </div>
          </div>

          {/* LOGS */}
          <div
            style={{
              marginTop: "20px",
              background: "#1a1a1a",
              padding: "15px",
              borderRadius: "12px",
            }}
          >
            <h3>TRADE LOGS</h3>

            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid #333",
                  padding: "6px 0",
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WARNING BAR */}
      <div
        style={{
          background: "yellow",
          color: "red",
          padding: "12px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Warning ⚠️ OBBO company is not responsible for any loss
        you make in trading so kindly trade on your own risk
      </div>

      {/* GUARANTEE BAR */}
      <div
        style={{
          background: "green",
          color: "white",
          padding: "12px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        OBBO company is obliged to pay against all your OC you
        own at the time of withdrawal with fixed rate OC 1 =
        PKR 1 basis
      </div>
    </div>
  );
}
