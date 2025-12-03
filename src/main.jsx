import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// webllm já está disponível via CDN no window
const webllm = window.webllm;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App webllm={webllm} />
  </React.StrictMode>
);
