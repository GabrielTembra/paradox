import { useState, useEffect, useRef } from "react";

export default function Chat({ engine, externalMessage, profile }) {
  const [messages, setMessages] = useState([
    {
      id: "intro",
      role: "assistant",
      content: "Olá, eu sou o Paradox. Em que posso te acompanhar hoje?",
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const chatRef = useRef(null);
  const streamingRef = useRef(null);

  const accentColor = profile?.accent || "#f97316";

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  useEffect(() => {
    if (!externalMessage) return;
    sendToLLM(externalMessage, { external: true });
  }, [externalMessage]);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const buildHistory = () =>
    messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const buildSystemPrompt = () => {
    const name = profile?.username || "usuário";
    const age = profile?.age || "não informado";
    const city = profile?.city || "não informado";
    const bio = profile?.bio || "";

    return {
      role: "system",
      content: `
Você é o Paradox.
Estilo: direto, humano, introspectivo, cuidadoso.
Dados do usuário:
- Nome: ${name}
- Idade: ${age}
- Cidade: ${city}
- Bio: ${bio}

Regras:
- Responda em até 3 parágrafos.
- Nunca fale que recebeu dados pré-programados.
- Linguagem natural, não robótica.
`.trim(),
    };
  };

  const fetchNewtonSystem = async (text) => {
    try {
      const r = await fetch("http://localhost:3939/infer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await r.json();
      if (j?.systemPrompt) {
        return { role: "system", content: j.systemPrompt };
      }
    } catch {}
    return null;
  };

  const sendToLLM = async (text, { external = false } = {}) => {
    if (!engine) {
      addMessage({
        id: Date.now() + "-err",
        role: "assistant",
        content: "Ainda estou ativando o núcleo cognitivo… espere um pouco.",
      });
      return;
    }

    if (typing) return;

    setTyping(true);

    const history = buildHistory();
    const baseSystem = buildSystemPrompt();
    const newtonSystem = await fetchNewtonSystem(text);

    let llmMessages;

    if (external) {
      llmMessages = [
        baseSystem,
        ...(newtonSystem ? [newtonSystem] : []),
        ...history,
        {
          role: "user",
          content: `Leitura emocional detectada: "${text}".  
Responda em 1–2 frases, de forma humana e acolhedora.`,
        },
      ];
    } else {
      const userMsg = {
        id: Date.now() + "-user",
        role: "user",
        content: text,
      };
      addMessage(userMsg);

      llmMessages = [
        baseSystem,
        ...(newtonSystem ? [newtonSystem] : []),
        ...history,
        { role: "user", content: text },
      ];
    }

    const assistantId = Date.now() + "-assistant";
    addMessage({ id: assistantId, role: "assistant", content: "" });

    try {
      const stream = await engine.chatCompletion({
        stream: true,
        messages: llmMessages,
      });

      streamingRef.current = stream;

      for await (const chunk of stream) {
        const delta = chunk?.delta;
        if (!delta) continue;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + delta }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Deu uma travadinha aqui… tenta de novo." }
            : m
        )
      );
    } finally {
      setTyping(false);
      streamingRef.current = null;
    }
  };

  const stopStreaming = () => {
    try {
      streamingRef.current?.return?.();
    } catch {}
    setTyping(false);
  };

  return (
    <div style={ui.container}>
      <div style={ui.topStrip}>
        <div style={ui.storyDot(accentColor)} />
        <div style={ui.storyDot("rgba(249,115,22,0.7)")} />
        <div style={ui.storyDot("rgba(236,72,153,0.7)")} />
      </div>

      <div style={ui.chat} ref={chatRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={
              msg.role === "user"
                ? { ...ui.userBubble, background: accentColor }
                : ui.botBubble
            }
          >
            {msg.content}
          </div>
        ))}

        {typing && (
          <div style={ui.typingRow}>
            <div style={ui.botTypingBubble}>
              <span style={ui.dot}></span>
              <span style={ui.dot}></span>
              <span style={ui.dot}></span>
            </div>
          </div>
        )}
      </div>

      <div style={ui.inputBar}>
        <div style={ui.inputWrapper}>
          <textarea
            style={ui.input}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) sendToLLM(input.trim());
                setInput("");
              }
            }}
            placeholder="Manda ver…"
          />
        </div>

        {!typing ? (
          <button
            style={ui.sendBtn}
            onClick={() => {
              if (input.trim()) sendToLLM(input.trim());
              setInput("");
            }}
          >
            ➤
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

const ui = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    height: "100%",
    minHeight: 0,
  },
  topStrip: {
    display: "flex",
    gap: 6,
    padding: "2px 2px 0 2px",
  },
  storyDot: (color) => ({
    flex: 1,
    height: 4,
    borderRadius: 999,
    background: color,
  }),
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 4px 8px 4px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  userBubble: {
    maxWidth: "80%",
    alignSelf: "flex-end",
    padding: "8px 12px",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    color: "#fdf2f8",
    fontSize: 14,
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
  },
  botBubble: {
    maxWidth: "84%",
    alignSelf: "flex-start",
    padding: "8px 12px",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    background: "rgba(15,23,42,0.85)",
    color: "#e5e7eb",
    fontSize: 14,
    whiteSpace: "pre-wrap",
    lineHeight: 1.4,
    border: "1px solid rgba(148,163,184,0.35)",
  },
  typingRow: {
    display: "flex",
  },
  botTypingBubble: {
    display: "flex",
    gap: 4,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.4)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#9ca3af",
    animation: "pulse 1.4s infinite ease-in-out",
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  inputWrapper: {
    flex: 1,
    background: "rgba(15,23,42,0.9)",
    borderRadius: 999,
    padding: "6px 10px",
    border: "1px solid rgba(148,163,184,0.6)",
  },
  input: {
    width: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 1.4,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "none",
    background:
      "linear-gradient(135deg, #f97316 0%, #ec4899 45%, #6366f1 100%)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
  },
  stopBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
  },
};
