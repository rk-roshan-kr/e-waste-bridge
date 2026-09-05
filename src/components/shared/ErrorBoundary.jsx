import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "#F4F6F8",
            fontFamily: "var(--font-sans, system-ui, sans-serif)"
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              background: "#FFFFFF",
              borderRadius: 16,
              border: "1px solid #E2E4E8",
              padding: 24,
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#FEECEB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px"
              }}
            >
              <AlertTriangle size={28} color="#D9381E" />
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#12151A", marginBottom: 8 }}>
              Interface Recovered
            </h2>

            <p style={{ fontSize: 13, color: "#6C7280", lineHeight: 1.5, marginBottom: 16 }}>
              A view transition issue was intercepted. The session state has been preserved.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "#F8F9FA",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #E2E4E8",
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#D9381E",
                  textAlign: "left",
                  marginBottom: 18,
                  overflowX: "auto"
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#12151A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                width: "100%"
              }}
            >
              <RotateCcw size={16} />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
