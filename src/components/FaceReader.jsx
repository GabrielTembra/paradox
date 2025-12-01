import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

export default function FaceReader({ engine, onAnalysisReady }) {
  const [status, setStatus] = useState("Carregando modelos faciais…");
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [lastNarrative, setLastNarrative] = useState("");
  const [streaming, setStreaming] = useState(false);

  const videoRef = useRef(null);
  const lastEmotionRef = useRef(null);
  const cooldownRef = useRef(false);

  // --------------------------------------------------------------------
  // 1) Carregar modelos FaceAPI
  // --------------------------------------------------------------------
  useEffect(() => {
    async function loadModels() {
      const MODEL_URL = "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      setStatus("Modelos faciais prontos ✔");
    }

    loadModels();
  }, []);

  // --------------------------------------------------------------------
  // 2) Iniciar câmera automaticamente
  // --------------------------------------------------------------------
  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    setStatus("Ativando câmera…");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    setStatus("Detectando rosto…");
  };

  // --------------------------------------------------------------------
  // 3) LOOP REALTIME — detecta emoção continuamente
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!engine) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || cooldownRef.current) return;

      const result = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceExpressions();

      if (!result) {
        setCurrentEmotion("Sem rosto detectado");
        return;
      }

      const sorted = Object.entries(result.expressions)
        .sort((a, b) => b[1] - a[1])
        .map((s) => s[0]);

      const top = sorted[0];
      setCurrentEmotion(top);

      // Enviar nova emoção para IA SOMENTE se mudou
      if (top !== lastEmotionRef.current) {
        lastEmotionRef.current = top;
        cooldownRef.current = true;
        setTimeout(() => (cooldownRef.current = false), 2000);

        generateNarrative(top);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [engine]);

  // --------------------------------------------------------------------
  // 4) IA gera narrativa automática via CDN
  // --------------------------------------------------------------------
  const generateNarrative = async (emotion) => {
    if (!engine) return;

    const prompt = `
Você é o Paradox. Gere uma análise emocional suave, humana e introspectiva para a microexpressão detectada: "${emotion}". 
Não faça diagnóstico médico. Fale de energia, presença e padrões emocionais.
Resposta curta.
`;

    const result = await engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    const narrative =
      result?.choices?.[0]?.message?.content || "Não consegui interpretar";

    setLastNarrative(narrative);
    onAnalysisReady?.(narrative);
  };

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  return (
    <div style={ui.container}>
      <h2 style={ui.header}>Paradox Face • Realtime</h2>

      <div style={ui.status}>{status}</div>

      <div style={ui.videoBox}>
        <video ref={videoRef} autoPlay playsInline style={ui.video} />
      </div>

      <div style={ui.card}>
        <h4 style={{ margin: 0 }}>Emoção detectada:</h4>
        <p style={ui.emotion}>{currentEmotion || "…"}</p>

        <h4 style={{ margin: "10px 0 0 0" }}>Narrativa:</h4>
        <p style={ui.narrative}>{lastNarrative || "Aguardando…"}</p>
      </div>
    </div>
  );
}

//
// UI
//
const ui = {
  container: {
    padding: 18,
    fontFamily: "Arial",
    height: "100%",
    overflowY: "auto",
    background: "#fff",
  },
  header: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: 700,
  },
  status: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 10,
  },
  videoBox: {
    width: 280,
    height: 370,
    margin: "0 auto",
    background: "#000",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #ddd",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  card: {
    marginTop: 18,
    padding: 16,
    borderRadius: 12,
    background: "#fafafa",
    border: "1px solid #ddd",
  },
  emotion: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1a73e8",
  },
  narrative: {
    opacity: 0.9,
    whiteSpace: "pre-line",
  },
};
