
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { performanceMonitor } from "./utils/performance";

// Start performance monitoring
performanceMonitor.startMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
  