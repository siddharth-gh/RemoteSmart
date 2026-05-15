import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.jsx";
import { AuthProvider } from "./app/AuthContext.jsx";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const normalizedApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
        
        fetch(`${normalizedApiUrl}/courses`).catch(() => {});
      })
      .catch((error) => {
        console.error("Service worker registration failed", error);
      });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
