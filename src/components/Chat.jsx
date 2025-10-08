import { useState } from "react";

function Chat() {
  const [messages, setMessages] = useState([
    { sender: "Paradox 🤖", text: "Bem-vindo ao Paradox, Tembra!", type: "bot", time: getTime() },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: "Você", text: input, type: "user", time: getTime() };
    const botMsg = { sender: "Paradox 🤖", text: getRandomReply(), type: "bot", time: getTime() };

    // Mantém no máximo 6 mensagens visíveis
    setMessages((prev) => {
      const newMsgs = [...prev, userMsg, botMsg];
      return newMsgs.slice(-6);
    });

    setInput("");
  };

  return (
    <div style={styles.container}>
      {/* Header clean estilo iOS */}
      <div style={styles.header}>
        <span style={styles.chatName}>Paradox 🤖</span>
        <span style={styles.chatStatus}>Online</span>
      </div>

      {/* Área de chat (sem scroll infinito) */}
      <div style={styles.chatBox}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              ...(msg.type === "user" ? styles.userMsg : styles.botMsg),
            }}
          >
            <span>{msg.text}</span>
            <span style={styles.time}>{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input fixo embaixo */}
      <form style={styles.form} onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Enviar
        </button>
      </form>
    </div>
  );
}

// Hora simples
const getTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Respostas mock
const getRandomReply = () => {
  const replies = [
    "oi Tembra 👋",
    "🔥 A jaula abriu!",
    "Você tá no controle 🚀",
    "Essa conversa vai pro feed 😏",
    "Paradox nunca dorme 🕶️",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#000",
    color: "white",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #222",
    background: "#000",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "500",
  },
  chatName: {
    fontWeight: "bold",
    fontSize: "16px",
  },
  chatStatus: {
    fontSize: "12px",
    color: "#22c55e",
  },
  chatBox: {
    flex: 1,
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end", // mensagens sempre embaixo
    gap: "10px",
  },
  message: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: "18px",
    fontSize: "15px",
    lineHeight: 1.4,
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  userMsg: {
    alignSelf: "flex-end",
    background: "#007aff",
    color: "white",
    borderBottomRightRadius: "5px",
  },
  botMsg: {
    alignSelf: "flex-start",
    background: "#e5e5ea",
    color: "black",
    borderBottomLeftRadius: "5px",
  },
  time: {
    fontSize: "11px",
    marginTop: "4px",
    opacity: 0.6,
    alignSelf: "flex-end",
  },
  form: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #222",
    background: "#111",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "18px",
    border: "1px solid #333",
    outline: "none",
    fontSize: "15px",
    background: "#000",
    color: "white",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "18px",
    border: "none",
    background: "#007aff",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default Chat;
