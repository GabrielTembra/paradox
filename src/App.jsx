import { useState, useEffect, useRef } from "react";

import Chat from "./components/Chat";
import FaceReader from "./components/FaceReader";
import Personalization from "./components/Personalization";

export default function App() {
  const [active, setActive] = useState("chat");
  const [externalMessage, setExternalMessage] = useState(null);
  const [engine, setEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Inicializando…");

  const mounted = useRef(true);

  const log = (...args) => console.log("[Paradox]", ...args);

  // ------------------------------------------------------
  // 1 — Carregar WebLLM via CDN (createWebLLMEngine)
  // ------------------------------------------------------
  useEffect(() => {
    async function loadModel() {
      try {
        setStatus("Carregando IA via CDN…");
        log("window.webllm:", window.webllm);

        if (!window.webllm || !window.webllm.createWebLLMEngine) {
          console.error("❌ WebLLM não carregou corretamente (CDN)");
          setStatus("Erro: WebLLM não carregou");
          setLoading(false);
          return;
        }

        log("Criando engine…");

        const eng = await window.webllm.createWebLLMEngine({
          model: "Phi-3-mini-4k-instruct-q4f16_1",
        });

        if (!mounted.current) return;

        log("Engine criada com sucesso:", eng);

        setEngine(eng);
        setStatus("IA pronta!");
      } catch (err) {
        console.error("[Paradox] Erro ao carregar modelo:", err);
        setStatus("Erro ao carregar IA");
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    loadModel();

    return () => {
      mounted.current = false;
    };
  }, []);

  // ------------------------------------------------------
  // 2 — Análise Facial → Mandar narrativa para o Chat
  // ------------------------------------------------------
  const handleFaceAnalysis = (text) => {
    setExternalMessage(text);
    setActive("chat");
  };

  // ------------------------------------------------------
  // 3 — Renderizar a tela ativa
  // ------------------------------------------------------
  const renderScreen = () => {
    if (loading || !engine)
      return (
        <div style={{ padding: 40, textAlign: "center", opacity: 0.7 }}>
          {status}
        </div>
      );

    switch (active) {
      case "chat":
        return <Chat engine={engine} externalMessage={externalMessage} />;

      case "face":
        return (
          <FaceReader
            engine={engine}
            onAnalysisReady={handleFaceAnalysis}
          />
        );

      case "personalization":
        return <Personalization engine={engine} />;

      default:
        return <Chat engine={engine} externalMessage={externalMessage} />;
    }
  };

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div style={ui.app}>
      {/* HEADER */}
      <div style={ui.header}>
        <span style={ui.title}>Paradox</span>
      </div>

      {/* MAIN */}
      <div style={ui.screen}>{renderScreen()}</div>

      {/* DOCK */}
      <div style={ui.dock}>
        <DockButton
          label="Chat"
          active={active === "chat"}
          onClick={() => setActive("chat")}
        />
        <DockButton
          label="Face"
          active={active === "face"}
          onClick={() => setActive("face")}
        />
        <DockButton
          label="Perfil"
          active={active === "personalization"}
          onClick={() => setActive("personalization")}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------
// Botão do Dock
// ------------------------------------------------------
function DockButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...ui.dockButton,
        color: active ? "#1a73e8" : "#7a7a7a",
        fontWeight: active ? 700 : 500,
        borderBottom: active ? "3px solid #1a73e8" : "3px solid transparent",
        transform: active ? "scale(1.08)" : "scale(1)",
      }}
    >
      {label}
    </button>
  );
}

// ------------------------------------------------------
// STYLE
// ------------------------------------------------------
const ui = {
  app: {
    height: "100vh",
    width: "100vw",
    background: "#ffffff",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    color: "#222",
    overflow: "hidden",
  },

  header: {
    padding: "14px 20px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e5e5",
    textAlign: "center",
    fontWeight: 700,
    fontSize: 18,
    color: "#1a1a1a",
  },

  title: { fontSize: 20, fontWeight: 700 },

  screen: {
    flex: 1,
    overflowY: "auto",
    background: "#fafafa",
  },

  dock: {
    display: "flex",
    justifyContent: "space-around",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(14px)",
    borderTop: "1px solid #e5e5e5",
    padding: "8px 0 10px",
  },

  dockButton: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "10px 0",
    fontSize: 15,
    cursor: "pointer",
    transition: "0.25s ease",
  },
};
