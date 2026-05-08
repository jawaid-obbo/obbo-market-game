import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- BUY ENGINE ---------------- */

function P2P({ userId }) {
  const [price, setPrice] = useState(0);
  const [amount, setAmount] = useState("");
  const [requests, setRequests] = useState([]);

  /* LIVE PRICE FEED */
  useEffect(() => {
    const channel = supabase
      .channel("market")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_state" },
        (payload) => {
          setPrice(payload.new.current_price);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* LOAD SELLER SIDE REQUESTS */
  const loadRequests = async () => {
    const { data } = await supabase
      .from("trade_requests")
      .select("*")
      .eq("seller_id", userId)
      .eq("status", "pending");

    if (data) setRequests(data);
  };

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("trade_requests_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_requests" },
        () => loadRequests()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* ---------------- BUY ACTION ---------------- */

  const buy = async () => {
    if (!amount) return;

    const amt = Number(amount);

    // 🔥 SNAPSHOT PRICE (IMPORTANT)
    const lockedPrice = price;
    const total = amt * lockedPrice;
    const fee = total * 0.01;
    const totalOC = total + fee;

    // OPTIONAL: fetch seller (simple demo - first seller)
    const { data: sellers } = await supabase
      .from("wallets")
      .select("*")
      .gt("obc_balance", amt)
      .limit(1);

    if (!sellers || sellers.length === 0) {
      alert("No sellers available");
      return;
    }

    const seller = sellers[0];

    /* CREATE TRADE REQUEST */
    await supabase.from("trade_requests").insert([
      {
        buyer_id: userId,
        seller_id: seller.user_id,
        amount: amt,
        price: lockedPrice,
        total_oc: totalOC,
        fee: fee,
        status: "pending"
      }
    ]);

    setAmount("");
    alert("Trade request sent to seller");
  };

  /* ---------------- SELLER ACTION ---------------- */

  const acceptTrade = async (trade) => {
    const { amount, price, total_oc, fee } = trade;

    /* WALLET FETCH */
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: buyerWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", trade.buyer_id)
      .single();

    if (sellerWallet.obc_balance < amount) {
      alert("Not enough OBC");
      return;
    }

    if (sellerWallet.oc_balance < fee) {
      alert("Seller cannot pay fee");
      return;
    }

    /* EXECUTE TRADE */

    // Seller loses OBC
    await supabase
      .from("wallets")
      .update({
        obc_balance: sellerWallet.obc_balance - amount,
        oc_balance: sellerWallet.oc_balance - fee
      })
      .eq("user_id", userId);

    // Buyer receives OBC
    await supabase
      .from("wallets")
      .update({
        obc_balance: buyerWallet.obc_balance + amount,
        locked_oc: 0
      })
      .eq("user_id", trade.buyer_id);

    /* COMPLETE TRADE */
    await supabase
      .from("trade_requests")
      .update({ status: "accepted" })
      .eq("id", trade.id);

    alert("Trade executed");
  };

  const rejectTrade = async (trade) => {
    // refund buyer lock if any logic added later
    await supabase
      .from("trade_requests")
      .update({ status: "rejected" })
      .eq("id", trade.id);
  };

  return (
    <div style={{ padding: 20, color: "white" }}>

      <h2>P2P SNAPSHOT ENGINE</h2>

      {/* BUY SECTION */}
      <div>
        <h3>Buy OBC</h3>

        <p>Live Price: {price}</p>

        <input
          placeholder="OBC amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button onClick={buy}>
          BUY (Snapshot Price)
        </button>
      </div>

      {/* SELLER REQUESTS */}
      <div style={{ marginTop: 40 }}>
        <h3>Incoming Requests</h3>

        {requests.map((r) => (
          <div key={r.id} style={{ background: "#222", padding: 10, margin: 10 }}>
            <p>BUYER: {r.buyer_id}</p>
            <p>AMOUNT: {r.amount} OBC</p>
            <p>PRICE: {r.price}</p>
            <p>TOTAL: {r.total_oc}</p>

            <button onClick={() => acceptTrade(r)}>ACCEPT</button>
            <button onClick={() => rejectTrade(r)}>REJECT</button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default P2P;
