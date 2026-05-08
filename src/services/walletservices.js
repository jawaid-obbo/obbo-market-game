import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* LOCK OC (BUY SIDE) */
export const lockOC = async (userId, amount) => {
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!wallet || wallet.oc_balance < amount) {
    throw new Error("Not enough OC");
  }

  await supabase
    .from("wallets")
    .update({
      oc_balance: wallet.oc_balance - amount,
      locked_oc: wallet.locked_oc + amount
    })
    .eq("user_id", userId);
};

/* UNLOCK OC (REFUND) */
export const unlockOC = async (userId, amount) => {
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  await supabase
    .from("wallets")
    .update({
      oc_balance: wallet.oc_balance + amount,
      locked_oc: wallet.locked_oc - amount
    })
    .eq("user_id", userId);
};
