import React from "react";
import { createRoot } from "react-dom/client";
import PitfallsBrowserApp from "./PitfallsBrowserApp.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PitfallsBrowserApp />
  </React.StrictMode>
);
