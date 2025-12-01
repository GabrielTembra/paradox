import { useState, useEffect, useRef } from "react";

export default function Chat({ engine, externalMessage }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá, eu sou o Paradox. Em que posso te acompanhar hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const chatRef = useRef(null);
  const streamingRef = useRef(null);

  // Scroll automático
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Mensagens externas vindas do FaceReader
  useEffect(() => {
    if (externalMessage) {
      sendToLLM(externalMessage);
    }
  }, [externalMessage]);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  // STREAMING COM WEBLLM CDN
  const sendToLLM = async (text) => {
    if (!engine) return;

    setTyping(true);

    addMessage({ role: "user", content: text });

    let assistantMsg = { role: "assistant", content: "" };
    let assistantIndex = null;

    // cria a bolha vazia
    setMessages((prev) => {
      assistantIndex = prev.length;
      return [...prev, assistantMsg];
    });

    try {
      const stream = await engine.chat.completions.create({
        stream: true,
        messages: [{ role: "user", content: text }],
      });

      streamingRef.current = stream;

      for await (const chunk of stream) {
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (!delta) continue;

        assistantMsg.content += delta;

        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = { ...assistantMsg };
          return updated;
        });
      }
    } catch (err) {
      console.error("Erro no streaming:", err);
    } finally {
      setTyping(false);
      streamingRef.current = null;
    }
  };

  const stopStreaming = () => {
    try {
      streamingRef.current?.close?.();
    } catch {}
    setTyping(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendToLLM(input.trim());
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={ui.container}>
      <div style={ui.chat} ref={chatRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={msg.role === "user" ? ui.userBubble : ui.botBubble}
          >
            {msg.content}
          </div>
        ))}

        {typing && (
          <div style={ui.typingBubble}>
            <span style={ui.dot}></span>
            <span style={ui.dot}></span>
            <span style={ui.dot}></span>
          </div>
        )}
      </div>

      <div style={ui.inputBar}>
        <input
          style={ui.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite aqui…"
        />

        {!typing ? (
          <button style={ui.sendBtn} onClick={handleSend}>
            Enviar
          </button>
        ) : (
          <button style={ui.stopBtn} onClick={stopStreaming}>
            ❚❚
          </button>
        )}
      </div>
    </div>
  );
}

// ESTILOS
const ui = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },

  chat: {
    flex: 1,
    padding: 12,
    overflowY: "auto",
    background: "#f4f6f9",
  },

  userBubble: {
    maxWidth: "80%",
    alignSelf: "flex-end",
    marginBottom: 10,
    padding: "10px 14px",
    background: "#1a73e8",
    color: "white",
    borderRadius: "14px 14px 4px 14px",
    fontSize: 15,
  },

  botBubble: {
    maxWidth: "80%",
    alignSelf: "flex-start",
    marginBottom: 10,
    padding: "10px 14px",
    background: "#ffffff",
    color: "#222",
    borderRadius: "14px 14px 14px 4px",
    border: "1px solid #e5e5e5",
    fontSize: 15,
  },

  typingBubble: {
    alignSelf: "flex-start",
    display: "flex",
    gap: 4,
    padding: "8px 12px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ddd",
    width: 50,
    justifyContent: "center",
    marginBottom: 10,
  },

  dot: {
    width: 6,
    height: 6,
    background: "#999",
    borderRadius: "50%",
    animation: "blink 1.4s infinite both",
  },

  inputBar: {
    padding: 10,
    display: "flex",
    gap: 8,
    background: "#fff",
    borderTop: "1px solid #ddd",
  },

  input: {
    flex: 1,
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 10,
    outline: "none",
    fontSize: 15,
  },

  sendBtn: {
    padding: "10px 14px",
    background: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },

  stopBtn: {
    padding: "10px 14px",
    background: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
};
