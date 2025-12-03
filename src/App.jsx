import { useState, useEffect } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

import Chat from "./components/Chat";
import FaceReader from "./components/FaceReader";
import Personalization from "./components/Personalization";

export default function App() {
  const [engine, setEngine] = useState(null);
  const [profile, setProfile] = useState({});
  const [externalMessage, setExternalMessage] = useState("");
  const [active, setActive] = useState("chat");

  useEffect(() => {
    async function loadEngine() {
      try {
        const workerUrl = new URL(
          "/workers/webllm.worker.js",
          window.location.origin
        );

        const eng = await CreateMLCEngine(workerUrl, {
          model_list: [
            {
              model_url:
                "https://huggingface.co/mlc-ai/RedPajama-INCITE-Chat-3B-v1-q4f32_1/resolve/main/",
              local_id: "rpj-3b",
            },
          ],
        });

        setEngine(eng);
      } catch (err) {
        console.error("Erro ao iniciar WebLLM:", err);
      }
    }

    loadEngine();
  }, []);

  return (
    <div style={ui.appWrapper}>
      <div style={ui.backgroundGradient} />

      <div style={ui.cardWrapper}>
        <div style={ui.card}>
          {/* HEADER */}
          <div style={ui.header}>
            <div style={ui.headerLeft}>
              <div style={ui.avatar}>P</div>
              <div style={ui.headerInfo}>
                <div style={ui.name}>Paradox</div>
                <div style={ui.status}>
                  {engine ? "IA local pronta" : "Inicializando IA local..."}
                </div>
              </div>
            </div>
            <div style={ui.dot} />
          </div>

          {/* ABAS */}
          <div style={ui.tabs}>
            <button
              style={active === "chat" ? ui.tabActive : ui.tab}
              onClick={() => setActive("chat")}
            >
              Chat
            </button>

            <button
              style={active === "face" ? ui.tabActive : ui.tab}
              onClick={() => setActive("face")}
            >
              Face
            </button>

            <button
              style={active === "profile" ? ui.tabActive : ui.tab}
              onClick={() => setActive("profile")}
            >
              Perfil
            </button>
          </div>

          <div style={ui.tabUnderline} />

          {/* CONTEÚDO */}
          <div style={ui.content}>
            {active === "chat" && (
              <Chat
                engine={engine}
                externalMessage={externalMessage}
                profile={profile}
              />
            )}

            {active === "face" && (
              <FaceReader
                engine={engine}
                onAnalysisReady={(msg) => setExternalMessage(msg)}
              />
            )}

            {active === "profile" && (
              <Personalization
                engine={engine}
                onProfileChange={(p) => setProfile(p)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

//
// ESTILOS
//
const ui = {
  appWrapper: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  },
  backgroundGradient: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
    backgroundSize: "200% 200%",
    animation: "moveGradient 12s ease infinite",
  },
  cardWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    maxWidth: 420,
    padding: 16,
  },
  card: {
    width: "100%",
    background: "rgba(10,12,27,0.75)",
    backdropFilter: "blur(18px)",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#f97316",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
  },
  headerInfo: { display: "flex", flexDirection: "column" },
  name: { fontSize: 15, fontWeight: 700, color: "#fff" },
  status: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  dot: { width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.5)" },
  tabs: { display: "flex", gap: 8 },
  tab: {
    flex: 1,
    padding: "6px 0",
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#ddd",
    fontSize: 13,
  },
  tabActive: {
    flex: 1,
    padding: "6px 0",
    borderRadius: 999,
    background: "linear-gradient(90deg, #ff0080, #ff6a00, #ffd100)",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
  },
  tabUnderline: {
    width: "100%",
    height: 3,
    background: "linear-gradient(90deg, #ff0080, #ff6a00, #ffd100)",
    borderRadius: 999,
    marginTop: -4,
  },
  content: { height: "60vh", overflowY: "auto", paddingRight: 6 },
};
