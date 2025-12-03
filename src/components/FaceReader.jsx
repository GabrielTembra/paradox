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
  const emotionBufferRef = useRef([]);

  // ============================================================
  // 1. CARREGAR MODELOS FACIAIS
  // ============================================================
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
        setStatus("Modelos carregados — ativando câmera…");

        await startCamera();
      } catch (err) {
        console.error("Erro ao carregar modelos:", err);
        setStatus("Erro ao carregar modelos.");
      }
    }

    loadModels();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  // ============================================================
  // 2. CÂMERA
  // ============================================================
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

  // ============================================================
  // 3. LOOP DE DETECÇÃO + BUFFER + DEBOUNCE
  // ============================================================
  useEffect(() => {
    if (!engine) return;
    if (!modelsLoadedRef.current) return;

    let cancelled = false;

    const loop = setInterval(async () => {
      if (cancelled || cooldownRef.current || !videoRef.current) return;

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

        const sorted = Object.entries(detection.expressions)
          .sort((a, b) => b[1] - a[1])
          .map((e) => e[0]);

        const top = sorted[0];

        // Buffer de 5 frames para reduzir jitter
        emotionBufferRef.current.push(top);
        if (emotionBufferRef.current.length > 5) {
          emotionBufferRef.current.shift();
        }

        const stableEmotion = mode(emotionBufferRef.current);
        setCurrentEmotion(stableEmotion);

        if (stableEmotion !== lastEmotionRef.current) {
          lastEmotionRef.current = stableEmotion;
          cooldownRef.current = true;

          setTimeout(() => {
            cooldownRef.current = false;
          }, 3000);

          generateNarrative(stableEmotion);
        }
      } catch (err) {
        console.error("Erro na detecção facial:", err);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(loop);
    };
  }, [engine]);

  function mode(arr) {
    return arr
      .sort(
        (a, b) =>
          arr.filter((v) => v === a).length -
          arr.filter((v) => v === b).length
      )
      .pop();
  }

  // ============================================================
  // 4. PARADOX — NARRATIVA VIA WEBLLM
  // ============================================================
  async function generateNarrative(emotion) {
    if (!engine) return;

    const prompt = `
Traduza a microexpressão "${emotion}" em até 2 frases curtas,
humanas, realistas e introspectivas. Evite parecer IA.
Não use termos clínicos.
    `.trim();

    try {
      const completion = await engine.chatCompletion({
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const text =
        completion?.choices?.[0]?.message?.content ||
        "Não consegui interpretar esse momento.";

      setLastNarrative(text);
      onAnalysisReady?.(text);
    } catch (err) {
      console.error("Erro ao gerar narrativa:", err);
      const fallback = "Percebi algo, mas não consegui traduzir agora.";
      setLastNarrative(fallback);
      onAnalysisReady?.(fallback);
    }
  }

  // ============================================================
  // UI COMPLETA
  // ============================================================
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

// ============================================================
// UI — 100% compatível com seu layout atual
// ============================================================
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
  cardsRow: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 8,
  },
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
