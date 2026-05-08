import { useState } from "react";
import { createTrade } from "./services/tradeService";

export default function App() {
  const [price] = useState(160); // demo price
  const [amount, setAmount] = useState("");

  /* ---------------- BUY FUNCTION ---------------- */
  const buy = async () => {
    try {
      if (!amount || Number(amount) <= 0) {
        alert("Enter valid amount");
        return;
      }

      await createTrade({
        buyerId: "USER_001",
        sellerId: "SELLER_001",
        amount: Number(amount),
        price: price
      });

      alert("Trade created successfully");
      setAmount("");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h1>OBBO P2P ENGINE</h1>

      <div style={styles.card}>
        <h2>Live Price: {price}</h2>

        <input
          style={styles.input}
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
    padding: 20,
    fontFamily: "Arial",
    background: "#0b0b0b",
    color: "white",
    height: "100vh"
  },
  card: {
    marginTop: 20,
    padding: 20,
    background: "#1a1a1a",
    borderRadius: 10,
    width: 300
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    marginBottom: 10
  },
  button: {
    width: "100%",
    padding: 10,
    background: "green",
    color: "white",
    border: "none",
    cursor: "pointer"
  }
};
