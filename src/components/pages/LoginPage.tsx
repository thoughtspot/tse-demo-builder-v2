"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AppConfig, StylingConfig } from "../../types/thoughtspot";

interface LoginPageProps {
  appConfig: AppConfig;
  stylingConfig: StylingConfig;
  onLogin: () => void;
}

export default function LoginPage({ appConfig, stylingConfig, onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const appName = appConfig.applicationName || "TSE Demo Builder";
  const subtitle = appConfig.loginPage?.subtitle || "";
  const _rawLogoUrl = stylingConfig.application.topBar.logoUrl;
  const _isSpotterUrl = (u: string) =>
    !!(u?.includes("cdn.jsdelivr.net") && u?.includes("/icons/spotter/"));
  const _effectiveUrl =
    !_rawLogoUrl || _isSpotterUrl(_rawLogoUrl)
      ? appConfig.favicon || "/ts.svg"
      : _rawLogoUrl;
  const logoUrl = _effectiveUrl.includes("cdn.jsdelivr.net") && _effectiveUrl.includes("/icons/spotter/") && !_effectiveUrl.includes("-preview-")
    ? _effectiveUrl.replace(/(.+?)-(\d+\.svg)$/, "$1-preview-$2")
    : _effectiveUrl;
  const primaryBg = stylingConfig.application.buttons.primary.backgroundColor || "#3182ce";
  const primaryFg = stylingConfig.application.buttons.primary.foregroundColor || "#ffffff";
  const primaryHoverBg = stylingConfig.application.buttons.primary.hoverBackgroundColor || "#2c5aa0";
  const mainBg = stylingConfig.application.backgrounds.mainBackground || "#f7fafc";
  const cardBg = stylingConfig.application.backgrounds.cardBackground || "#ffffff";
  const borderColor = stylingConfig.application.backgrounds.borderColor || "#e2e8f0";
  const primaryText = stylingConfig.application.typography.primaryColor || "#1f2937";
  const secondaryText = stylingConfig.application.typography.secondaryColor || "#6b7280";
  const topBarBg = stylingConfig.application.topBar.backgroundColor || "#ffffff";
  const topBarFg = stylingConfig.application.topBar.foregroundColor || "#333333";

  const [buttonHovered, setButtonHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Brief delay for demo effect, then call onLogin
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: mainBg,
        zIndex: 9999,
        fontFamily: "var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* Top bar branding strip */}
      <div
        style={{
          backgroundColor: topBarBg,
          borderBottom: `1px solid ${borderColor}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <div style={{ width: 32, height: 32, position: "relative", flexShrink: 0 }}>
          <Image
            src={logoUrl}
            alt={appName}
            fill
            style={{ objectFit: "contain" }}
            unoptimized
          />
        </div>
        <span
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: topBarFg,
          }}
        >
          {appName}
        </span>
      </div>

      {/* Centered login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: "var(--radius-lg, 12px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "48px 40px",
            width: "100%",
            maxWidth: "420px",
          }}
        >
          {/* Logo + title */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                position: "relative",
                margin: "0 auto 16px",
              }}
            >
              <Image
                src={logoUrl}
                alt={appName}
                fill
                style={{ objectFit: "contain" }}
                unoptimized
              />
            </div>
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: primaryText,
                lineHeight: "1.2",
              }}
            >
              {appName}
            </h1>
            {subtitle && (
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: secondaryText,
                  lineHeight: "1.5",
                }}
              >
                {subtitle}
              </p>
            )}
            {!subtitle && (
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: secondaryText,
                }}
              >
                Sign in to continue
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="login-username"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: primaryText,
                  marginBottom: "6px",
                }}
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: primaryText,
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "var(--radius-md, 8px)",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 150ms ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryBg;
                  e.target.style.boxShadow = `0 0 0 3px ${primaryBg}22`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = borderColor;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: primaryText,
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: primaryText,
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "var(--radius-md, 8px)",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 150ms ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryBg;
                  e.target.style.boxShadow = `0 0 0 3px ${primaryBg}22`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = borderColor;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setButtonHovered(true)}
              onMouseLeave={() => setButtonHovered(false)}
              style={{
                width: "100%",
                padding: "11px 16px",
                fontSize: "15px",
                fontWeight: "600",
                color: primaryFg,
                backgroundColor: buttonHovered ? primaryHoverBg : primaryBg,
                border: "none",
                borderRadius: "var(--radius-md, 8px)",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "background-color 150ms ease, opacity 150ms ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${primaryFg}44`,
                      borderTopColor: primaryFg,
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
