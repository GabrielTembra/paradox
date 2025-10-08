import { useState } from "react";
import Chat from "./components/Chat";
import FaceReader from "./components/FaceReader";
import Personalization from "./components/Personalization";

function App() {
  const [activeScreen, setActiveScreen] = useState("chat");

  const renderScreen = () => {
    switch (activeScreen) {
      case "chat":
        return <Chat />;
      case "face":
        return <FaceReader />;
      case "personalization":
        return <Personalization />;
      default:
        return <Chat />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header estilo iPhone 2007 */}
      <div style={styles.header}>
        <h1 style={styles.logo}>Paradox</h1>
      </div>

      {/* Conteúdo principal */}
      <div style={styles.screen}>{renderScreen()}</div>

      {/* Barra inferior estilo dock iOS */}
      <div style={styles.dock}>
        <button
          onClick={() => setActiveScreen("chat")}
          style={{
            ...styles.iconButton,
            opacity: activeScreen === "chat" ? 1 : 0.5,
          }}
        >
          💬
          <span style={styles.label}>Chat</span>
        </button>

        <button
          onClick={() => setActiveScreen("face")}
          style={{
            ...styles.iconButton,
            opacity: activeScreen === "face" ? 1 : 0.5,
          }}
        >
          📷
          <span style={styles.label}>Face</span>
        </button>

        <button
          onClick={() => setActiveScreen("personalization")}
          style={{
            ...styles.iconButton,
            opacity: activeScreen === "personalization" ? 1 : 0.5,
          }}
        >
          ⚙️
          <span style={styles.label}>Perfil</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    background: "#000", // fundo preto clássico
    color: "white",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  header: {
    padding: "15px 20px",
    background: "#000",
    borderBottom: "1px solid #222",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  screen: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontSize: "20px",
    animation: "fadeIn 0.4s ease-in-out",
  },
  dock: {
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 10px",
    background: "rgba(30,30,30,0.95)",
    borderTop: "1px solid #222",
    backdropFilter: "blur(8px)",
    position: "sticky",
    bottom: 0,
  },
  iconButton: {
    flex: 1,
    margin: "0 5px",
    padding: "10px 0",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: "white",
    fontSize: "22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  },
  label: {
    fontSize: "11px",
    marginTop: "3px",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },
};

export default App;
