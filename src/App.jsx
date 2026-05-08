import { useState } from "react";
import { createTrade } from "./services/tradeService";

export default function App() {
  const [price] = useState(160);
  const [amount, setAmount] = useState("");

  /* ---------------- BUY FUNCTION ---------------- */
  const buy = async () => {
    try {
      if (!amount || Number(amount) <= 0) {
        alert("Enter valid amount");
        return;
      }

      await createTrade({
        buyerId: "USER_000001",
        amount: Number(amount),
        price: price
      });

      alert("Trade request sent");
      setAmount("");
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>OBBO P2P ENGINE</h1>

      <div style={styles.card}>
        <h2>Live Price: {price} OC</h2>

        <input
          style={styles.input}
          type="number"
          placeholder="Enter OBC amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button style={styles.button} onClick={buy}>
          BUY OBC
        </button>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0b0b0b",
    color: "white",
    padding: "30px",
    fontFamily: "Arial"
  },

  title: {
    fontSize: "32px",
    marginBottom: "20px"
  },

  card: {
    background: "#1b1b1b",
    padding: "20px",
    borderRadius: "12px",
    width: "320px"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px"
  },

  button: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "green",
    color: "white",
    fontSize: "16px",
    cursor: "pointer"
  }
};
