// src/components/Personalization.jsx
import { useState } from "react";

export default function Personalization({ engine, onProfileChange }) {
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState("#f97316");

  const [generating, setGenerating] = useState(false);

  // ============================================================
  // GERAR BIO — WEBLLM 2025 API
  // ============================================================
  const generateBio = async () => {
    if (!engine) {
      setBio("IA local ainda está carregando…");
      return;
    }

    setGenerating(true);

    const prompt = `
Crie uma bio curta, criativa e humana com as informações:

Nome: ${username || "(não informado)"}
Idade: ${age || "(não informado)"}
Cidade: ${city || "(não informado)"}

Regras:
- Máximo 130 caracteres.
- Em primeira pessoa.
- Tom natural, autêntico e emocional.
- Evitar parecer IA.
- Português do Brasil.
    `.trim();

    try {
      const completion = await engine.chatCompletion({
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const text =
        completion?.choices?.[0]?.message?.content ||
        "Não consegui gerar uma bio.";

      setBio(text.trim());
    } catch (err) {
      console.error("Erro ao gerar bio:", err);
      setBio("Erro ao gerar bio.");
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================
  // SALVAR PERFIL
  // ============================================================
  const saveProfile = () => {
    const profile = { username, age, city, bio, accent };
    onProfileChange?.(profile);
    alert("Perfil salvo!");
  };

  // ============================================================
  // UI FINAL
  // ============================================================
  return (
    <div style={ui.container}>
      <div style={ui.headerRow}>
        <div>
          <div style={ui.title}>Perfil do Paradox</div>
          <div style={ui.subtitle}>
            Ajuste como o Paradox te reconhece e responde.
          </div>
        </div>
      </div>

      <div style={ui.form}>
        {/* Nome */}
        <div style={ui.fieldGroup}>
          <label style={ui.label}>Nome</label>
          <input
            style={ui.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Como você quer ser chamado?"
          />
        </div>

        {/* Idade + Cidade */}
        <div style={ui.inlineRow}>
          <div style={{ ...ui.fieldGroup, flex: 1 }}>
            <label style={ui.label}>Idade</label>
            <input
              style={ui.input}
              type="number"
              min={0}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="21"
            />
          </div>

          <div style={{ ...ui.fieldGroup, flex: 2 }}>
            <label style={ui.label}>Cidade</label>
            <input
              style={ui.input}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="São Paulo, SP"
            />
          </div>
        </div>

        {/* Cor do Tema */}
        <div style={ui.fieldGroup}>
          <label style={ui.label}>Cor do Tema</label>
          <div style={ui.colorRow}>
            <input
              type="color"
              style={ui.colorPicker}
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />

            <div style={ui.colorPreview(accent)}>
              <span style={ui.colorPreviewText}>preview da bolha</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={ui.fieldGroup}>
          <label style={ui.label}>Bio</label>
          <textarea
            style={ui.textarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Uma frase que te resuma sem parecer IA…"
          />
        </div>

        {/* Botão Gerar Bio */}
        <button
          style={{
            ...ui.primaryBtn,
            opacity: generating ? 0.7 : 1,
            cursor: generating ? "default" : "pointer",
          }}
          disabled={generating}
          onClick={generateBio}
        >
          {generating ? "Gerando bio…" : "Gerar bio com IA"}
        </button>

        {/* Botão Salvar */}
        <button style={ui.secondaryBtn} onClick={saveProfile}>
          Salvar perfil
        </button>
      </div>
    </div>
  );
}

// ============================================================
// UI — MANTIDO 100% NO SEU ESTILO PARADOX
// ============================================================
const ui = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
  },

  headerRow: {
    paddingBottom: 6,
    borderBottom: "1px solid rgba(148,163,184,0.4)",
    marginBottom: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: 700,
  },

  subtitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },

  form: {
    flex: 1,
    marginTop: 4,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
    paddingRight: 2,
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  inlineRow: {
    display: "flex",
    gap: 8,
  },

  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#9ca3af",
  },

  input: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.7)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    fontSize: 13,
    outline: "none",
  },

  textarea: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.7)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    fontSize: 13,
    outline: "none",
    minHeight: 70,
    resize: "none",
  },

  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  colorPicker: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },

  colorPreview: (accent) => ({
    flex: 1,
    borderRadius: 999,
    padding: "6px 10px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.9))",
    border: "1px solid rgba(148,163,184,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),

  colorPreviewText: {
    fontSize: 11,
    color: "#9ca3af",
  },

  primaryBtn: {
    marginTop: 4,
    width: "100%",
    padding: "9px 12px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #f97316 0%, #ec4899 45%, #6366f1 100%)",
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: 600,
  },

  secondaryBtn: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.9)",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: 500,
  },
};
