import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
import "./i18n/index.js";
import "@fontsource/inter";
import { App as AntApp } from "antd";

const container = document.getElementById("root");

const root = createRoot(container);

root.render(
  <AntApp>
    <App />
  </AntApp>,
);
