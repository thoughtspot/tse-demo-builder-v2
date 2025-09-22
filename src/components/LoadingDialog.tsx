import React from 'react';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  progress?: number; // 0-100
}

const LoadingDialog: React.FC<LoadingDialogProps> = ({ 
  isOpen, 
  message = "Loading configuration...", 
  progress 
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
          ⏳
        </div>
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: "20px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Loading Configuration
        </h2>
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>
        
        {progress !== undefined && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "#3b82f6",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "8px",
              }}
            >
              {Math.round(progress)}%
            </div>
          </div>
        )}
        
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              animation: "pulse 1.5s ease-in-out infinite 0.2s",
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              animation: "pulse 1.5s ease-in-out infinite 0.4s",
            }}
          />
        </div>
        
        <style jsx>{`
          @keyframes pulse {
            0%, 80%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingDialog;
