import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enable react-grab for visual editing in development
if (import.meta.env.DEV) {
  import("react-grab");
}

createRoot(document.getElementById("root")!).render(<App />);
