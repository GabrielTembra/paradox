import { useState } from "react";

export default function Personalization({ engine, onProfileChange }) {
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState("#1a73e8");

  const [generating, setGenerating] = useState(false);

  // ------------------------------------------------------
  // Gerar bio personalizada usando o modelo CDN WebLLM
  // ------------------------------------------------------
  const generateBio = async () => {
    if (!engine) {
      setBio("IA não está carregada.");
      return;
    }

    setGenerating(true);

    const prompt = `
Crie uma bio curta, criativa e humana com base nos dados abaixo.
Não faça parecer IA. Seja natural, leve e com personalidade sutil.

Nome: ${username || "(não informado)"}
Idade: ${age || "(não informado)"}
Cidade: ${city || "(não informado)"}

A bio deve ter no máximo 130 caracteres.
    `;

    try {
      const result = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const text =
        result?.choices?.[0]?.message?.content || "Não consegui gerar uma bio.";
      setBio(text);
    } catch (err) {
      console.error("Erro ao gerar bio:", err);
      setBio("Erro ao gerar bio.");
    } finally {
      setGenerating(false);
    }
  };

  // ------------------------------------------------------
  // Salvar perfil
  // ------------------------------------------------------
  const saveProfile = () => {
    const profile = { username, age, city, bio, accent };
    onProfileChange?.(profile);
    alert("Perfil salvo!");
  };

  return (
    <div style={ui.container}>
      <h2 style={ui.header}>Personalização</h2>

      <label style={ui.label}>Nome</label>
      <input
        style={ui.input}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Seu nome"
      />

      <label style={ui.label}>Idade</label>
      <input
        style={ui.input}
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Sua idade"
      />

      <label style={ui.label}>Cidade</label>
      <input
        style={ui.input}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Sua cidade"
      />

      <label style={ui.label}>Cor do tema</label>
      <input
        type="color"
        style={ui.colorPicker}
        value={accent}
        onChange={(e) => setAccent(e.target.value)}
      />

      <label style={ui.label}>Bio personalizada</label>
      <textarea
        style={ui.textarea}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Sua bio..."
      />

      <button
        style={ui.generateBtn}
        onClick={generateBio}
        disabled={generating}
      >
        {generating ? "Gerando..." : "Gerar Bio com IA"}
      </button>

      <button style={ui.saveBtn} onClick={saveProfile}>
        Salvar Perfil
      </button>
    </div>
  );
}

const ui = {
  container: {
    padding: 20,
    fontFamily: "Arial, sans-serif",
    background: "#fff",
    height: "100%",
    overflowY: "auto",
  },

  header: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
  },

  label: {
    marginTop: 12,
    marginBottom: 4,
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#444",
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
    fontSize: 15,
    marginBottom: 6,
  },

  textarea: {
    width: "100%",
    height: 90,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
    resize: "none",
  },

  colorPicker: {
    width: "100%",
    height: 45,
    border: "none",
    borderRadius: 10,
    outline: "none",
    marginBottom: 8,
  },

  generateBtn: {
    marginTop: 12,
    width: "100%",
    padding: "10px",
    background: "#1a73e8",
    color: "#fff",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
  },

  saveBtn: {
    marginTop: 12,
    width: "100%",
    padding: "10px",
    background: "#34a853",
    color: "#fff",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
  },
};
