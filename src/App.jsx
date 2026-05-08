import { useState } from "react";
import { createTrade } from "./services/tradeService";

export default function App() {
  const [price] = useState(160);
  const [amount, setAmount] = useState("");

  const buy = async () => {
    try {
      await createTrade({
        buyerId: "USER_000001",
        amount: Number(amount),
        price: price
      });

      alert("Trade request sent to seller");
      setAmount("");
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  return (
    <div
      style={{
        background: "#111",
        minHeight: "100vh",
        color: "white",
        padding: "30px",
        fontFamily: "Arial"
      }}
    >
      <h1>OBBO P2P ENGINE</h1>

      <div
        style={{
          background: "#1e1e1e",
          padding: "20px",
          borderRadius: "10px",
          width: "300px"
        }}
      >
        <h2>Price: {price}</h2>

        <input
          type="number"
          placeholder="Enter OBC amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px"
          }}
        />

        <button
          onClick={buy}
          style={{
            width: "100%",
            padding: "10px",
            background: "green",
            color: "white",
            border: "none"
          }}
        >
          BUY OBC
        </button>
      </div>
    </div>
  );
}
