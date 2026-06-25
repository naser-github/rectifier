import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "../styles/global.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Rectifier root element was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
