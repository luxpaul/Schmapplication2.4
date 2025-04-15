import React from "react";
import ReactDOM from "react-dom/client";
import SchmackApp from "./App";

const path = window.location.pathname;
const user = path.includes("paul") ? "paul" : "carla";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SchmackApp user={user} />
  </React.StrictMode>
);
