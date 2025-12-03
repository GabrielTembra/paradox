// src/components/FaceReader.jsx
import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

export default function FaceReader({ engine, onAnalysisReady }) {
  const [status, setStatus] = useState("Carregando modelos faciais…");
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [lastNarrative, setLastNarrative] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const modelsLoadedRef = useRef(false);
  const lastEmotionRef = useRef(null);
  const cooldownRef = useRef(false);

  // Suavização simples (evita jitter)
  const emotionBufferRef = useRef([]);

  // ------------------------------------------------------------
  // 1. Carregar MODELOS e iniciar câmera
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const MODEL_URL = "/models/FaceRecognition";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        if (cancelled) return;

        modelsLoadedRef.current = true;
        setStatus("Modelos carregados • ativando câmera…");

        await startCamera();
      } catch (error) {
        console.error("Erro ao carregar modelos/câmera:", error);
        if (!cancelled)
          setStatus("Erro ao carregar modelos ou acessar câmera.");
      }
    }

    loadModels();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  // ------------------------------------------------------------
  // 2. Iniciar câmera
  // ------------------------------------------------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) videoRef.current.srcObject = stream;

      setStatus("Detectando rosto…");
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setStatus("Permissão de câmera negada.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // ------------------------------------------------------------
  // 3. LOOP DE DETECÇÃO — suave e sem jitter
  // ------------------------------------------------------------
  useEffect(() => {
    if (!engine) return;
    if (!modelsLoadedRef.current) return;

    let cancelled = false;

    const interval = setInterval(async () => {
      if (
        cancelled ||
        !videoRef.current ||
        cooldownRef.current ||
        !modelsLoadedRef.current
      )
        return;

      try {
        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceExpressions();

        if (!detection) {
          setCurrentEmotion("sem rosto");
          return;
        }

        // pega emoção dominante
        const sorted = Object.entries(detection.expressions)
          .sort((a, b) => b[1] - a[1])
          .map((s) => s[0]);
        const top = sorted[0];

        // suavização: amortiza as últimas emoções
        emotionBufferRef.current.push(top);
        if (emotionBufferRef.current.length > 5)
          emotionBufferRef.current.shift();

        const stableEmotion = mode(emotionBufferRef.current);
        setCurrentEmotion(stableEmotion);

        // dispara análise quando ALTERAÇÃO real
        if (stableEmotion !== lastEmotionRef.current) {
          lastEmotionRef.current = stableEmotion;
          cooldownRef.current = true;

          setTimeout(() => {
            cooldownRef.current = false;
          }, 3000);

          generateNarrative(stableEmotion);
        }
      } catch (err) {
        console.error("Erro na detecção:", err);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [engine]);

  // Utilidade: pega o valor mais frequente (moda)
  function mode(arr) {
    return arr
      .sort(
        (a, b) =>
          arr.filter((v) => v === a).length -
          arr.filter((v) => v === b).length
      )
      .pop();
  }

  // ------------------------------------------------------------
  // 4. Gerar narrativa via LLM
  // ------------------------------------------------------------
  const generateNarrative = async (emotion) => {
    if (!engine) return;

    const prompt = `
Você é o Paradox. Gere uma leitura emocional suave, introspectiva e humana baseada na microexpressão: "${emotion}".
Máximo 2 frases. Nada de diagnósticos médicos.
`.trim();

    try {
      const result = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const text =
        result?.choices?.[0]?.message?.content ||
        "Não consegui interpretar esse momento.";

      setLastNarrative(text);
      onAnalysisReady?.(text);
    } catch (err) {
      console.error("Erro na IA:", err);
      const fallback =
        "Percebi uma oscilação, mas não consegui traduzir agora.";
      setLastNarrative(fallback);
      onAnalysisReady?.(fallback);
    }
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div style={ui.container}>
      <div style={ui.headerRow}>
        <div>
          <div style={ui.title}>Paradox Face</div>
          <div style={ui.subtitle}>{status}</div>
        </div>
        <div style={ui.pill}>realtime</div>
      </div>

      <div style={ui.videoWrapper}>
        <div style={ui.videoGradientBorder}>
          <video ref={videoRef} autoPlay playsInline style={ui.video} />
        </div>
      </div>

      <div style={ui.cardsRow}>
        <div style={ui.emotionCard}>
          <div style={ui.cardLabel}>Emoção dominante</div>
          <div style={ui.emotionText}>
            {currentEmotion ? currentEmotion.toUpperCase() : "…"}
          </div>
        </div>

        <div style={ui.narrativeCard}>
          <div style={ui.cardLabel}>Leitura do momento</div>
          <p style={ui.narrativeText}>
            {lastNarrative || "Aguardando você aparecer…"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// ESTILOS
// ------------------------------------------------------------
const ui = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    color: "#e5e7eb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingBottom: 4,
    borderBottom: "1px solid rgba(148,163,184,0.4)",
  },
  title: { fontSize: 15, fontWeight: 700 },
  subtitle: { fontSize: 11, color: "#9ca3af" },
  pill: {
    padding: "4px 10px",
    fontSize: 11,
    borderRadius: 999,
    background:
      "linear-gradient(135deg, rgba(249,115,22,0.8), rgba(236,72,153,0.9))",
    color: "#fff",
    textTransform: "uppercase",
  },
  videoWrapper: { display: "flex", justifyContent: "center" },
  videoGradientBorder: {
    padding: 3,
    borderRadius: 22,
    background:
      "linear-gradient(135deg, rgba(249,115,22,0.9), rgba(236,72,153,0.9), rgba(99,102,241,0.9))",
    boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
  },
  video: {
    width: 270,
    height: 360,
    borderRadius: 18,
    objectFit: "cover",
    background: "#020617",
  },
  cardsRow: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8 },
  emotionCard: {
    padding: 12,
    borderRadius: 16,
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(248,250,252,0.06)",
  },
  narrativeCard: {
    padding: 12,
    borderRadius: 16,
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.5)",
  },
  cardLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#9ca3af",
  },
  emotionText: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f97316",
  },
  narrativeText: { marginTop: 4, fontSize: 13, lineHeight: 1.4 },
};
