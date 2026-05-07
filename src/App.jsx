import { useEffect, useState } from "react";

export default function App() {
  const [price, setPrice] = useState(129);
  const [oc, setOc] = useState(8697);
  const [obc, setObc] = useState(10);
  const [qty, setQty] = useState(1);
  const [logs, setLogs] = useState([]);

  // fake live movement for testing
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice((p) => {
        const move = Math.random() > 0.5 ? 1 : -1;
        return Math.max(125, Math.min(170, p + move));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const buy = () => {
    const cost = qty * price;
    const fee = Math.round(cost * 0.01);
    const total = cost + fee;

    if (oc < total) {
      alert("Not enough OC");
      return;
    }

    setOc(oc - total);
    setObc(obc + qty);

    setLogs([
      `BUY ${qty} OBC @ ${price} | Fee ${fee}`,
      ...logs
    ]);
  };

  const sell = () => {
    const gain = qty * price;
    const fee = Math.round(gain * 0.01);
    const total = gain - fee;

    if (obc < qty) {
      alert("Not enough OBC");
      return;
    }

    setObc(obc - qty);
    setOc(oc + total);

    setLogs([
      `SELL ${qty} OBC @ ${price} | Fee ${fee}`,
      ...logs
    ]);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        padding: "20px",
        fontFamily: "Arial"
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "40px",
          marginBottom: "30px"
        }}
      >
        OBBO MARKET GAME
      </h1>

      <div
        style={{
          background: "#111",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          textAlign: "center"
        }}
      >
        <h2>LIVE PRICE</h2>

        <div
          style={{
            fontSize: "50px",
            color: "#00ff88",
            fontWeight: "bold"
          }}
        >
          {price} OC
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px"
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#111",
            padding: "20px",
            borderRadius: "12px"
          }}
        >
          <h3>OC BALANCE</h3>
          <div style={{ fontSize: "32px", color: "#00aaff" }}>
            {oc}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#111",
            padding: "20px",
            borderRadius: "12px"
          }}
        >
          <h3>OBC BALANCE</h3>
          <div style={{ fontSize: "32px", color: "#ffaa00" }}>
            {obc}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#111",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px"
        }}
      >
        <h2>TRADE PANEL</h2>

        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            fontSize: "18px"
          }}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={buy}
            style={{
              flex: 1,
              padding: "15px",
              background: "green",
              color: "white",
              border: "none",
              fontSize: "18px",
              borderRadius: "10px"
            }}
          >
            BUY
          </button>

          <button
            onClick={sell}
            style={{
              flex: 1,
              padding: "15px",
              background: "red",
              color: "white",
              border: "none",
              fontSize: "18px",
              borderRadius: "10px"
            }}
          >
            SELL
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#111",
          padding: "20px",
          borderRadius: "12px"
        }}
      >
        <h2>TRADE LOG</h2>

        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid #333"
            }}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
