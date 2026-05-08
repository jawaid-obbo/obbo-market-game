import { useEffect, useState, useRef, memo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- MARKET ---------------- */

const MarketView = memo(({ price }) => {
  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
      <h2>OBBO MARKET</h2>

      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle,#ffd700,#b8860b)",
          color: "black",
          fontSize: 42,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 30px rgba(255,215,0,0.5)",
        }}
      >
        {price}
      </div>
    </div>
  );
});

/* ---------------- USER CHAT ---------------- */

const UserChat = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("support_chat")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 1200);
    return () => clearInterval(i);
  }, []);

  const send = async () => {
    if (!input.trim()) return;

    setMessages((p) => [
      ...p,
      { id: Date.now(), sender: "user", message: input }
    ]);

    await supabase.from("support_chat").insert([
      {
        user_id: userId,
        sender: "user",
        message: input,
      },
    ]);

    setInput("");
  };

  return (
    <div style={{ flex: 1, padding: 20 }}>
      <h2>SUPPORT</h2>

      <div style={{ height: 400, overflowY: "auto", background: "#111", padding: 10 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{ textAlign: m.sender === "user" ? "right" : "left", margin: 5 }}
          >
            <span
              style={{
                background: m.sender === "admin"
                  ? "linear-gradient(135deg,#1f8b4c,#0f3d22)"
                  : "linear-gradient(135deg,#2b6fff,#102a66)",
                padding: 10,
                borderRadius: 10,
                display: "inline-block",
                color: "white",
              }}
            >
              {m.message}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          style={{ flex: 1, padding: 10 }}
          placeholder="Type..."
        />
        <button onClick={send}>SEND</button>
      </div>
    </div>
  );
};

/* ---------------- ADMIN PANEL ---------------- */

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  const loadUsers = async () => {
    const { data } = await supabase.from("support_chat").select("user_id");
    if (data) {
      const unique = [...new Set(data.map((u) => u.user_id))];
      setUsers(unique);
    }
  };

  const loadChat = async (uid) => {
    const { data } = await supabase
      .from("support_chat")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const sendReply = async () => {
    if (!reply.trim() || !activeUser) return;

    setMessages((p) => [
      ...p,
      { id: Date.now(), sender: "admin", message: reply }
    ]);

    await supabase.from("support_chat").insert([
      {
        user_id: activeUser,
        sender: "admin",
        message: reply,
      },
    ]);

    setReply("");
  };

  return (
    <div style={{ display: "flex", flex: 1 }}>
      {/* USERS */}
      <div style={{ width: 200, background: "#111", padding: 10 }}>
        <h3>USERS</h3>

        {users.map((u) => (
          <button
            key={u}
            onClick={() => {
              setActiveUser(u);
              loadChat(u);
            }}
            style={{ display: "block", margin: 5 }}
          >
            {u}
          </button>
        ))}
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, padding: 20 }}>
        <h3>ADMIN CHAT</h3>

        <div style={{ height: 400, overflowY: "auto", background: "#111", padding: 10 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{ textAlign: m.sender === "admin" ? "left" : "right", margin: 5 }}
            >
              <span
                style={{
                  background: m.sender === "admin"
                    ? "green"
                    : "blue",
                  padding: 10,
                  borderRadius: 10,
                  display: "inline-block",
                  color: "white",
                }}
              >
                {m.message}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", marginTop: 10 }}>
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendReply();
              }
            }}
            style={{ flex: 1, padding: 10 }}
            placeholder="Reply..."
          />
          <button onClick={sendReply}>REPLY</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const userId = "000001";

  const [view, setView] = useState("market");
  const [adminMode, setAdminMode] = useState(false);

  const [price, setPrice] = useState(100);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("market_state")
        .select("current_price")
        .eq("id", 1)
        .single();

      if (data) setPrice(data.current_price);
    };

    load();
    const i = setInterval(load, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", color: "white", background: "#0b0b0b" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 200, background: "#111", padding: 10 }}>
        <h3>OBBO</h3>

        <button onClick={() => setView("market")}>Market</button>
        <button onClick={() => setView("support")}>Support</button>

        <hr />

        <button onClick={() => setAdminMode(!adminMode)}>
          {adminMode ? "Exit Admin" : "Admin Mode"}
        </button>
      </div>

      {/* MAIN */}
      {!adminMode && view === "market" && <MarketView price={price} />}
      {!adminMode && view === "support" && <UserChat userId={userId} />}
      {adminMode && <AdminPanel />}
    </div>
  );
}
