"use client";

import Image from "next/image";

interface TopBarProps {
  title: string;
  logoUrl?: string;
  users?: Array<{ id: string; name: string; avatar?: string }>;
  currentUser?: { id: string; name: string; avatar?: string };
  onUserChange?: (userId: string) => void;
}

export default function TopBar({
  title,
  logoUrl = "/ts.png",
  users = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Bob Johnson" },
  ],
  currentUser = { id: "1", name: "John Doe" },
  onUserChange,
}: TopBarProps) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e2e8f0",
        padding: "12px 24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo and Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Image
          src={logoUrl}
          alt="Logo"
          height={32}
          width={32}
          style={{ height: "32px", width: "auto" }}
        />
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#1a202c",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* User Menu */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            const menu = document.getElementById("user-menu");
            if (menu) {
              menu.style.display =
                menu.style.display === "block" ? "none" : "block";
            }
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "50%",
            backgroundColor: "#e2e8f0",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {currentUser.name.charAt(0)}
        </button>

        <div
          id="user-menu"
          style={{
            display: "none",
            position: "absolute",
            right: 0,
            top: "100%",
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            minWidth: "200px",
            zIndex: 1000,
          }}
        >
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onUserChange?.(user.id);
                const menu = document.getElementById("user-menu");
                if (menu) menu.style.display = "none";
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background:
                  currentUser.id === user.id ? "#ebf8ff" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {user.name.charAt(0)}
              </div>
              <span>{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
