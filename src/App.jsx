import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- MARKET ---------------- */

function Market() {
  const [price, setPrice] = useState(100);

  useEffect(() => {
    const channel = supabase
      .channel("market")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_state" },
        (payload) => setPrice(payload.new.current_price)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
      <h2>OBBO MARKET</h2>

      <div style={{
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "gold",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 40
      }}>
        {price}
      </div>
    </div>
  );
}

/* ---------------- P2P TRADING ---------------- */

function P2P({ userId }) {
  const [orders, setOrders] = useState([]);
  const [type, setType] = useState("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  /* LOAD ORDERS */
  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* CREATE ORDER */
  const createOrder = async () => {
    if (!amount || !price) return;

    await supabase.from("orders").insert([
      {
        user_id: userId,
        type,
        amount: Number(amount),
        price: Number(price),
        status: "open",
      },
    ]);

    setAmount("");
    setPrice("");
  };

  /* MATCH ORDER */
  const matchOrder = async (order) => {
    await supabase
      .from("orders")
      .update({ status: "matched" })
      .eq("id", order.id);

    load();
  };

  return (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>P2P TRADING</h2>

      {/* CREATE ORDER */}
      <div style={{ marginBottom: 20 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
        </select>

        <input
          placeholder="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          placeholder="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button onClick={createOrder}>CREATE ORDER</button>
      </div>

      {/* ORDER BOOK */}
      <div style={{ background: "#111", padding: 10, height: 400, overflowY: "auto" }}>
        {orders.map((o) => (
          <div key={o.id} style={{
            display: "flex",
            justifyContent: "space-between",
            margin: 5,
            padding: 10,
            background: o.type === "buy" ? "#1f8b4c" : "#2b6fff",
            color: "white"
          }}>
            <div>
              {o.type.toUpperCase()} | {o.amount} @ {o.price}
            </div>

            <button onClick={() => matchOrder(o)}>
              MATCH
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const [view, setView] = useState("market");

  return (
    <div style={{ display: "flex", height: "100vh", color: "white", background: "#0b0b0b" }}>
      
      {/* MENU */}
      <div style={{ width: 200, background: "#111", padding: 10 }}>
        <h3>OBBO</h3>

        <button onClick={() => setView("market")}>Market</button>
        <button onClick={() => setView("p2p")}>P2P Trade</button>
      </div>

      {/* MAIN */}
      {view === "market" && <Market />}
      {view === "p2p" && <P2P userId="000001" />}
    </div>
  );
}
