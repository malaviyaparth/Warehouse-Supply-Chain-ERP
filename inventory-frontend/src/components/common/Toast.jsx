import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  const bg = isSuccess
    ? "rgba(16, 185, 129, 0.95)"
    : isError
    ? "rgba(239, 68, 68, 0.95)"
    : "rgba(59, 130, 246, 0.95)";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        background: bg,
        color: "#ffffff",
        padding: "12px 18px",
        borderRadius: "8px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "14px",
        fontWeight: "500",
        maxWidth: "420px",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      {isSuccess && <CheckCircle2 size={18} />}
      {isError && <AlertCircle size={18} />}
      {!isSuccess && !isError && <Info size={18} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.8)",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
