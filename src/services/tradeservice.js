import { createClient } from "@supabase/supabase-js";
import { lockOC } from "./walletService";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

export const createTrade = async (payload) => {
  const { buyerId, amount, price } = payload;

  if (!buyerId) throw new Error("buyerId missing");

  const { data: sellers } = await supabase
    .from("wallets")
    .select("user_id, obc_balance")
    .gt("obc_balance", 0);

  if (!sellers || sellers.length === 0) {
    throw new Error("No seller available");
  }

  const filtered = sellers.filter(
    (s) => s.user_id !== buyerId
  );

  const seller =
    filtered[Math.floor(Math.random() * filtered.length)];

  const sellerId = seller.user_id;

  const total = amount * price;
  const fee = total * 0.01;

  await lockOC(buyerId, total + fee);

  const { error } = await supabase
    .from("trade_requests")
    .insert([
      {
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        price,
        fee,
        status: "pending"
      }
    ]);

  if (error) throw new Error(error.message);
};
