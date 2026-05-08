import { useEffect, useState, useRef, memo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vwgmzqujbrttrjtdapqh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z216cXVqYnJ0dHJqdGRhcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTI0MzYsImV4cCI6MjA5MzY2ODQzNn0.VP3coulUoEMOcRl84-9Q4-VH7IxLdtS7CdY3xrhYE8Q"
);

/* ---------------- MARKET ---------------- */

const MarketView = memo(({ price }) => {
  return (
    <div style={{ flex: 1, textAlign: "center", paddingTop: 40 }}>
      <h2>OBBO MARKET</h2>

      <div
        style={{
          margin: "40px auto",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "gold",
          color: "black",
          fontSize: 40,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {price}
      </div>
    </div>
  );
});

/* ---------------- SUPPORT CHAT (USER) ---------------- */

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
    const i = setInterval(load, 4000);
    return () => clearInterval(i);
  }, []);

  const send = async () => {
    if (!input.trim()) return;

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
      <h2>USER SUPPORT</h2>

      <div style={{ height: 300, overflow: "auto", background: "#111", padding: 10 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.sender === "user" ? "right" : "left",
              margin: 5,
            }}
          >
            <span
              style={{
                background: m.sender === "user" ? "blue" : "gray",
                padding: 6,
                borderRadius: 6,
                display: "inline-block",
              }}
            >
              {m.message}
            </span>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
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
};

/* ---------------- ADMIN PANEL ---------------- */

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  /* LOAD ALL USERS (unique IDs) */
  const loadUsers = async () => {
    const { data } = await supabase.from("support_chat").select("user_id");

    if (data) {
      const unique = [...new Set(data.map((d) => d.user_id))];
      setUsers(unique);
    }
  };

  /* LOAD CHAT FOR SELECTED USER */
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

    await supabase.from("support_chat").insert([
      {
        user_id: activeUser,
        sender: "admin",
        message: reply,
      },
    ]);

    setReply("");
    loadChat(activeUser);
  };

  return (
    <div style={{ display: "flex", flex: 1 }}>
      {/* USERS LIST */}
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

      {/* CHAT WINDOW */}
      <div style={{ flex: 1, padding: 20 }}>
        <h3>ADMIN CHAT</h3>

        <div style={{ height: 300, overflow: "auto", background: "#111", padding: 10 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                textAlign: m.sender === "admin" ? "left" : "right",
                margin: 5,
              }}
            >
              <span
                style={{
                  background: m.sender === "admin" ? "green" : "blue",
                  padding: 6,
                  borderRadius: 6,
                  display: "inline-block",
                }}
              >
                {m.message}
              </span>
            </div>
          ))}
        </div>

        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
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
};

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const userId = "000001";
  const [view, setView] = useState("market");
  const [adminMode, setAdminMode] = useState(false);

  const [price, setPrice] = useState(100);

  return (
    <div style={{ display: "flex", height: "100vh", color: "white", background: "#0b0b0b" }}>
      
      {/* NAV */}
      <div style={{ width: 200, background: "#111", padding: 10 }}>
        <h3>OBBO</h3>

        <button onClick={() => setView("market")}>Market</button>
        <button onClick={() => setView("support")}>Support</button>

        <hr />

        <button onClick={() => setAdminMode(!adminMode)}>
          {adminMode ? "Exit Admin" : "Admin Mode"}
        </button>
      </div>

      {/* MAIN AREA */}
      {!adminMode && view === "market" && <MarketView price={price} />}
      {!adminMode && view === "support" && <UserChat userId={userId} />}
      {adminMode && <AdminPanel />}
    </div>
  );
}
