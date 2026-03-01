import { useState } from "react";
import {
  WindowMinimise,
  WindowToggleMaximise,
  WindowClose,
} from "../../wailsjs/go/main/App";
import logo from "../assets/logo.png";

export default function TitleBar({ currentFilePath, isDirty }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const handleMinimize = () => WindowMinimise();
  const handleMaximize = () => {
    WindowToggleMaximise();
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => WindowClose();

  const fileName = currentFilePath
    ? currentFilePath.split(/[\\/]/).pop()
    : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 32,
        background: "#f0f0f0",
        borderBottom: "1px solid #ddd",
        userSelect: "none",
        "--wails-draggable": "drag",
      }}
    >
      {/* Logo + Titre + Fichier */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 12,
        }}
      >
        <img src={logo} style={{ width: 24, height: 24 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
          Kardoo
        </span>
        {fileName && (
          <>
            <span style={{ color: "#bbb", fontSize: 13 }}>—</span>
            <span style={{ fontSize: 12, color: "#666" }}>{fileName}</span>
            {isDirty && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#fa8c16",
                  display: "inline-block",
                  marginLeft: 2,
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Boutons */}
      <div style={{ display: "flex", "--wails-draggable": "no-drag" }}>
        <TitleBarButton onClick={handleMinimize} title="Réduire">
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="#333" />
          </svg>
        </TitleBarButton>
        <TitleBarButton onClick={handleMaximize} title="Agrandir">
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M2 0H10V8H8V10H0V2H2V0ZM2 2H1V9H7V8H2V2ZM3 1V7H9V1H3Z"
                fill="#333"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                x="0.5"
                y="0.5"
                width="9"
                height="9"
                stroke="#333"
                fill="none"
              />
            </svg>
          )}
        </TitleBarButton>
        <TitleBarButton onClick={handleClose} title="Fermer" isClose>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="#333" strokeWidth="1.5" />
          </svg>
        </TitleBarButton>
      </div>
    </div>
  );
}

function TitleBarButton({ onClick, children, title, isClose }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 46,
        height: 32,
        border: "none",
        background: hover ? (isClose ? "#e81123" : "#e0e0e0") : "transparent",
        cursor: "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.1s",
      }}
    >
      {children}
    </button>
  );
}
