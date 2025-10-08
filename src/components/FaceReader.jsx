import { useState, useRef, useEffect } from "react";

function FaceReader() {
  const [status, setStatus] = useState("📷 Aguardando...");
  const [image, setImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setStatus("✅ Câmera iniciada");
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setStatus("❌ Permissão negada ou erro ao iniciar câmera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Caixa simulando detecção facial
    ctx.strokeStyle = "#007aff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      canvas.width / 4,
      canvas.height / 4,
      canvas.width / 2,
      canvas.height / 2
    );

    setImage(canvas.toDataURL("image/png"));
    setStatus("📸 Foto capturada");
  };

  const reset = () => {
    setImage(null);
    setStatus("📷 Aguardando...");
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Header minimalista estilo iOS */}
      <div style={styles.header}>
        <span style={styles.title}>Leitura Facial</span>
      </div>

      <div style={styles.videoBox}>
        {!image ? (
          <video ref={videoRef} autoPlay playsInline style={styles.video}></video>
        ) : (
          <img src={image} alt="Captura" style={styles.photo} />
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <p style={styles.status}>{status}</p>

      {/* Botões fixos, estilo iPhone */}
      <div style={styles.buttons}>
        <button style={{ ...styles.button, background: "#007aff" }} onClick={startCamera}>
          Iniciar
        </button>
        <button style={{ ...styles.button, background: "#34c759" }} onClick={capturePhoto}>
          Capturar
        </button>
        <button style={{ ...styles.button, background: "#ff3b30" }} onClick={reset}>
          Resetar
        </button>
        {image && (
          <a
            href={image}
            download="face-capture.png"
            style={{ ...styles.button, background: "#ff9500", textDecoration: "none" }}
          >
            Salvar
          </a>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between", // divide tela como iOS
    background: "#000",
    color: "white",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    height: "100vh",
    padding: "20px",
  },
  header: {
    width: "100%",
    padding: "12px 0",
    borderBottom: "1px solid #222",
    textAlign: "center",
  },
  title: {
    fontWeight: "600",
    fontSize: "16px",
  },
  videoBox: {
    width: "100%",
    maxWidth: "360px",
    aspectRatio: "4/3",
    background: "#111",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #222",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  status: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#9ca3af",
  },
  buttons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingBottom: "10px",
  },
  button: {
    padding: "12px 18px",
    borderRadius: "20px",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    minWidth: "90px",
    textAlign: "center",
  },
};

export default FaceReader;
