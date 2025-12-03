// src/components/Chat.jsx
import { useState, useEffect, useRef } from "react";

export default function Chat({ engine, externalMessage, profile, loadingEngine }) {
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

  const accentColor = profile?.accent || "#f97316"; // laranja/rosa vibe IG

  // Scroll automático
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Mensagens externas vindas do FaceReader (não criam bolha de usuário)
  useEffect(() => {
    if (!externalMessage) return;
    sendToLLM(externalMessage, { fromExternal: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMessage]);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const buildHistory = () =>
    messages.map(({ role, content }) => ({ role, content }));

  const buildSystemPrompt = () => {
    const name = profile?.username || "usuário";
    const age = profile?.age ? `${profile.age} anos` : "idade não informada";
    const city = profile?.city || "cidade não informada";
    const bio = profile?.bio || "";

    return {
      role: "system",
      content: `
Você é o Paradox, um assistente introspectivo, direto e empático, que fala de um jeito humano.
Dados do usuário:
- Nome: ${name}
- Idade: ${age}
- Cidade: ${city}
- Bio: ${bio}

Responda sempre em até 3 parágrafos, com linguagem natural.
Não mencione que recebeu esses dados de um sistema ou perfil.
      `.trim(),
    };
  };

  // -----------------------------------
  // Envio pro LLM (com streaming)
  // -----------------------------------
  const sendToLLM = async (text, options = {}) => {
    const isExternal = options.fromExternal === true;

    if (!engine) {
      console.warn("Engine ainda não carregada.");
      if (!isExternal) {
        addMessage({
          id: Date.now() + "-info",
          role: "assistant",
          content: loadingEngine
            ? "Tô ligando meu cérebro local aqui… me chama de novo em alguns segundos."
            : "Ainda não consegui carregar a IA local.",
        });
      }
      return;
    }

    if (typing) return; // não deixa duas respostas ao mesmo tempo

    setTyping(true);

    const history = buildHistory();
    const systemMsg = buildSystemPrompt();
    let llmMessages;

    if (isExternal) {
      const emotionalTurn = {
        role: "user",
        content: `
Sinal emocional detectado por um analisador de expressões faciais:
"${text}"

Faça um comentário curto (1–2 frases), acolhedor e natural,
sem citar câmera ou análise facial. Só reage à energia.
      `.trim(),
      };

      llmMessages = [systemMsg, ...history, emotionalTurn];
    } else {
      const userMsg = {
        id: Date.now() + "-user",
        role: "user",
        content: text,
      };
      addMessage(userMsg);

      llmMessages = [systemMsg, ...history, { role: "user", content: text }];
    }

    const assistantId = Date.now() + "-assistant";
    const assistantMsg = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const stream = await engine.chat.completions.create({
        stream: true,
        messages: llmMessages,
      });

      streamingRef.current = stream;

      for await (const chunk of stream) {
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (!delta) continue;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m
          )
        );
      }
    } catch (err) {
      console.error("Erro no streaming:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  m.content ||
                  "Buguei um pouco aqui. Tenta mandar de novo, por favor?",
              }
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
      streamingRef.current?.close?.();
      streamingRef.current?.cancel?.();
    } catch {}
    setTyping(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendToLLM(input.trim());
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={ui.container}>
      {/* faixa superior tipo “story bar” */}
      <div style={ui.topStrip}>
        <div style={ui.storyDot(accentColor)} />
        <div style={ui.storyDot("rgba(249,115,22,0.7)")} />
        <div style={ui.storyDot("rgba(236,72,153,0.7)")} />
      </div>

      {/* área de mensagens */}
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
            <div style={ui.botBubbleTyping}>
              <span style={ui.dot}></span>
              <span style={ui.dot}></span>
              <span style={ui.dot}></span>
            </div>
          </div>
        )}
      </div>

      {/* barra de input fixa embaixo */}
      <div style={ui.inputBar}>
        <div style={ui.inputWrapper}>
          <textarea
            style={ui.input}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Manda ver…"
          />
        </div>

        {!typing ? (
          <button style={ui.sendBtn} onClick={handleSend}>
            <span style={{ fontSize: 16 }}>➤</span>
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
    minHeight: 0, // importante pra flex dentro do appShell
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
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
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
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
    border: "1px solid rgba(148,163,184,0.35)",
  },

  typingRow: {
    display: "flex",
    justifyContent: "flex-start",
  },

  botBubbleTyping: {
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
    color: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
    flexShrink: 0,
  },

  stopBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "none",
    background: "#ef4444",
    color: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
    flexShrink: 0,
  },
};
