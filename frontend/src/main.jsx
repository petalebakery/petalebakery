import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ⚡️ Import LazyMotion to optimize framer-motion animations
import { LazyMotion } from "framer-motion";

// Load only the lightweight animation engine
const loadFeatures = () => import("framer-motion").then(res => res.domAnimation);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LazyMotion features={loadFeatures}>
      <App />
    </LazyMotion>
  </React.StrictMode>
);
