import { useState, useEffect } from "react";

function Personalization() {
  const [username, setUsername] = useState("Tembra");
  const [avatar, setAvatar] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("#007aff"); // azul iOS default

  // Carregar configs
  useEffect(() => {
    const savedUser = localStorage.getItem("username");
    const savedAvatar = localStorage.getItem("avatar");
    const savedTheme = localStorage.getItem("theme");
    const savedAccent = localStorage.getItem("accent");

    if (savedUser) setUsername(savedUser);
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccent(savedAccent);
  }, []);

  // Salvar configs
  useEffect(() => {
    localStorage.setItem("username", username);
    if (avatar) localStorage.setItem("avatar", avatar);
    localStorage.setItem("theme", theme);
    localStorage.setItem("accent", accent);
  }, [username, avatar, theme, accent]);

  // Upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        ...styles.container,
        background: theme === "dark" ? "#000" : "#f2f2f7",
        color: theme === "dark" ? "white" : "black",
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Personalização</span>
      </div>

      {/* Avatar */}
      <div style={styles.avatarBox}>
        <img
          src={avatar || "https://via.placeholder.com/120x120.png?text=Avatar"}
          alt="Avatar"
          style={{ ...styles.avatar, border: `3px solid ${accent}` }}
        />
        <label style={{ ...styles.uploadButton, background: accent }}>
          Alterar Avatar
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Nome */}
      <div style={styles.field}>
        <label style={styles.label}>Nome de usuário</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* Tema */}
      <div style={styles.field}>
        <label style={styles.label}>Tema</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={styles.select}
        >
          <option value="dark">🌑 Escuro</option>
          <option value="light">☀️ Claro</option>
        </select>
      </div>

      {/* Cor de destaque */}
      <div style={styles.field}>
        <label style={styles.label}>Cor de destaque</label>
        <input
          type="color"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          style={styles.colorPicker}
        />
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
    padding: "20px",
    height: "100vh",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    gap: "20px",
  },
  header: {
    width: "100%",
    padding: "12px 0",
    borderBottom: "1px solid #222",
    textAlign: "center",
    marginBottom: "10px",
  },
  title: {
    fontWeight: "bold",
    fontSize: "16px",
  },
  avatarBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  uploadButton: {
    color: "white",
    padding: "8px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    border: "none",
  },
  field: {
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: { fontWeight: "500", fontSize: "14px" },
  input: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },
  select: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },
  colorPicker: {
    width: "60px",
    height: "40px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Personalization;
