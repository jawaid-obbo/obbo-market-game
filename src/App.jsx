import { useEffect, useState, useRef } from "react";
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
      <div style={{ width: 200, height: 200, borderRadius: "50%", background: "gold", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 40 }}>
        {price}
      </div>
    </div>
  );
}

/* ---------------- GLOBAL CHAT STORE ---------------- */

function useChat(userId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // initial load
    load();

    // ONE GLOBAL CHANNEL (IMPORTANT FIX)
    const channel = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_chat" },
        (payload) => {
          // only show relevant messages
          if (
            payload.new.user_id === userId ||
            payload.new.sender === "admin"
          ) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const load = async () => {
    const { data } = await supabase
      .from("support_chat")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  return { messages, setMessages };
}

/* ---------------- USER CHAT ---------------- */

function UserChat({ userId }) {
  const { messages, setMessages } = useChat(userId);
  const [input, setInput] = useState("");
  const inputRef = useRef("");

  const send = async () => {
    const msg = inputRef.current;
    if (!msg) return;

    setMessages((p) => [...p, { id: Date.now(), sender: "user", message: msg }]);

    inputRef.current = "";
    setInput("");

    await supabase.from("support_chat").insert([
      { user_id: userId, sender: "user", message: msg }
    ]);
  };

  return (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>SUPPORT</h2>

      <div style={{ height: 400, overflow: "auto", background: "#111", padding: 10 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ textAlign: m.sender === "user" ? "right" : "left" }}>
            <span style={{
              background: m.sender === "user" ? "#2b6fff" : "#1f8b4c",
              padding: 10,
              borderRadius: 10,
              display: "inline-block",
              margin: 5,
              color: "white"
            }}>
              {m.message}
            </span>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          inputRef.current = e.target.value;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            send();
          }
        }}
        style={{ width: "80%", padding: 10 }}
      />

      <button onClick={send}>SEND</button>
    </div>
  );
}

/* ---------------- ADMIN CHAT ---------------- */

function AdminChat() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState("000001");
  const { messages, setMessages } = useChat(activeUser);
  const [reply, setReply] = useState("");
  const replyRef = useRef("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from("support_chat").select("user_id");
    const unique = [...new Set(data.map((u) => u.user_id))];
    setUsers(unique);
  };

  const sendReply = async () => {
    const msg = replyRef.current;
    if (!msg) return;

    setMessages((p) => [...p, { id: Date.now(), sender: "admin", message: msg }]);

    replyRef.current = "";
    setReply("");

    await supabase.from("support_chat").insert([
      { user_id: activeUser, sender: "admin", message: msg }
    ]);
  };

  return (
    <div style={{ display: "flex", flex: 1 }}>
      
      <div style={{ width: 200, background: "#111", padding: 10 }}>
        <h3>USERS</h3>

        {users.map((u) => (
          <button key={u} onClick={() => setActiveUser(u)}>
            {u}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 20 }}>
        <h3>ADMIN CHAT</h3>

        <div style={{ height: 400, overflow: "auto", background: "#111", padding: 10 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ textAlign: m.sender === "admin" ? "left" : "right" }}>
              <span style={{
                background: m.sender === "admin" ? "#1f8b4c" : "#2b6fff",
                padding: 10,
                borderRadius: 10,
                display: "inline-block",
                margin: 5,
                color: "white"
              }}>
                {m.message}
              </span>
            </div>
          ))}
        </div>

        <input
          value={reply}
          onChange={(e) => {
            setReply(e.target.value);
            replyRef.current = e.target.value;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendReply();
            }
          }}
          style={{ width: "80%", padding: 10 }}
        />

        <button onClick={sendReply}>REPLY</button>
      </div>
    </div>
  );
}

/* ---------------- MAIN ---------------- */

export default function App() {
  const [view, setView] = useState("market");
  const [admin, setAdmin] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", color: "white", background: "#0b0b0b" }}>
      
      <div style={{ width: 200, background: "#111", padding: 10 }}>
        <h3>OBBO</h3>

        <button onClick={() => setView("market")}>Market</button>
        <button onClick={() => setView("support")}>Support</button>

        <hr />

        <button onClick={() => setAdmin(!admin)}>
          {admin ? "Exit Admin" : "Admin Mode"}
        </button>
      </div>

      {!admin && view === "market" && <Market />}
      {!admin && view === "support" && <UserChat userId="000001" />}
      {admin && <AdminChat />}
    </div>
  );
}
