import { createClient } from "@supabase/supabase-js";
import { lockOC, unlockOC } from "./walletService";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- CREATE TRADE (BUY CLICK) ---------------- */
export const createTrade = async ({ buyerId, sellerId, amount, price }) => {
  const total = amount * price;
  const fee = total * 0.01;

  // STEP 1: LOCK BUYER FUNDS
  await lockOC(buyerId, total + fee);

  // STEP 2: CREATE TRADE REQUEST
  await supabase.from("trade_requests").insert([
    {
      buyer_id: buyerId,
      seller_id: sellerId,
      amount,
      price,
      fee,
      status: "pending"
    }
  ]);
};

/* ---------------- ACCEPT TRADE ---------------- */
export const acceptTrade = async (trade) => {
  const { data: seller } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", trade.seller_id)
    .single();

  const { data: buyer } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", trade.buyer_id)
    .single();

  if (!seller || seller.obc_balance < trade.amount) {
    throw new Error("Seller has insufficient OBC");
  }

  // SELLER UPDATE
  await supabase
    .from("wallets")
    .update({
      obc_balance: seller.obc_balance - trade.amount,
      oc_balance: seller.oc_balance - trade.fee
    })
    .eq("user_id", trade.seller_id);

  // BUYER UPDATE
  await supabase
    .from("wallets")
    .update({
      obc_balance: buyer.obc_balance + trade.amount,
      locked_oc: 0
    })
    .eq("user_id", trade.buyer_id);

  // MARK COMPLETE
  await supabase
    .from("trade_requests")
    .update({ status: "accepted" })
    .eq("id", trade.id);
};

/* ---------------- REJECT TRADE ---------------- */
export const rejectTrade = async (trade) => {
  const refund = trade.amount * trade.price + trade.fee;

  await unlockOC(trade.buyer_id, refund);

  await supabase
    .from("trade_requests")
    .update({ status: "rejected" })
    .eq("id", trade.id);
};
