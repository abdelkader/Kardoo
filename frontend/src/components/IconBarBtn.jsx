import { Tooltip } from "antd";

export default function IconBarBtn({ icon, tooltip, onClick, active }) {
  return (
    <Tooltip title={tooltip} placement="right">
      <button
        onClick={onClick}
        style={{
          width: 38,
          height: 38,
          border: "none",
          borderRadius: 8,
          background: active ? "#3b3b52" : "transparent",
          color: active ? "#fff" : "#aaa",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#3b3b52";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = active ? "#3b3b52" : "transparent";
          e.currentTarget.style.color = active ? "#fff" : "#aaa";
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
