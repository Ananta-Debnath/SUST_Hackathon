import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  Trash2,
  Zap,
  Shield,
  Hash,
  Building2,
  FileText,
  Activity,
  RefreshCcw,
} from "lucide-react";

// ============================================================================
// Configuration — swap this to your deployed API.
// ============================================================================
const API_BASE = "https://your-deployed-api.onrender.com";

// ============================================================================
// Design tokens (kept in JS so the file is self-contained; Tailwind still
// handles layout/spacing/typography).
// ============================================================================
const tokens = {
  bg: "#0D0D0F",
  surface: "#17181C",
  surfaceAlt: "#1E1F24",
  border: "#2A2B30",
  borderSubtle: "#222328",
  textPrimary: "#F0F0F2",
  textSecondary: "#8B8C94",
  textMuted: "#5C5D64",
  accent: "#00C48C",
  accentDim: "#00C48C22",
};

const fontUI = '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

// Case-type → palette (pill background + border + text).
const caseTypeStyle = {
  wrong_transfer: { bg: "#3A2A0E", border: "#A8761E", text: "#F5C26B" },
  payment_failed: { bg: "#3A2410", border: "#C2641B", text: "#F1A05A" },
  refund_request: { bg: "#0F223A", border: "#2D6AB5", text: "#7AAEEC" },
  phishing_or_social_engineering: {
    bg: "#3A1018",
    border: "#C4233A",
    text: "#F47281",
  },
  other: { bg: "#222328", border: "#3A3B42", text: "#9A9BA3" },
};

// Severity palette; the "critical" tier also drives a CSS pulse.
const severityStyle = {
  low: { bg: "#0F2A1E", border: "#1F7A4D", text: "#4ADE80" },
  medium: { bg: "#332808", border: "#A4761A", text: "#F5C26B" },
  high: { bg: "#3A2410", border: "#C2641B", text: "#F1A05A" },
  critical: { bg: "#3A1018", border: "#C4233A", text: "#F47281" },
};

const channels = [
  { value: "app", label: "App" },
  { value: "sms", label: "SMS" },
  { value: "call_center", label: "Call Center" },
  { value: "merchant_portal", label: "Merchant Portal" },
];

const locales = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
  { value: "mixed", label: "Mixed" },
];

const quickFills = [
  { label: "Wrong Transfer", message: "I sent 3000 taka to wrong number please help" },
  { label: "Phishing Alert", message: "Someone called asking my OTP, is that bKash?" },
  { label: "Refund", message: "Please refund my last transaction, I changed my mind" },
];

const formatTime = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "--:--:--";
  }
};

// ============================================================================
// Small presentational primitives
// ============================================================================
function Pill({ children, palette, mono, title }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        fontFamily: mono ? fontMono : fontUI,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SeverityBadge({ value }) {
  if (!value) return null;
  const palette = severityStyle[value] || severityStyle.low;
  const isCritical = value === "critical";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        fontFamily: fontUI,
        boxShadow: isCritical ? `0 0 12px ${palette.border}88` : "none",
        animation: isCritical ? "qsPulse 1.6s ease-in-out infinite" : "none",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: palette.text,
          boxShadow: isCritical ? `0 0 6px ${palette.text}` : "none",
        }}
      />
      {value}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.max(0, Math.min(1, Number(value) || 0)) * 100;
  const color =
    pct < 50 ? "#F47281" : pct <= 75 ? "#F5C26B" : "#4ADE80";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "#222328",
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${tokens.border}`,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            transition: "width 0.4s ease",
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 12,
          color: tokens.textPrimary,
          minWidth: 44,
          textAlign: "right",
        }}
      >
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function HealthBadge({ status, latencyMs, onPing }) {
  const isOk = status === "ok";
  const isChecking = status === "checking";
  const isDown = status === "down";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 5,
        fontSize: 12,
        color: tokens.textSecondary,
        fontFamily: fontUI,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isOk
            ? tokens.accent
            : isChecking
            ? "#F5C26B"
            : isDown
            ? "#F47281"
            : tokens.textMuted,
          boxShadow: isOk ? `0 0 6px ${tokens.accent}` : "none",
        }}
      />
      {isChecking ? (
        <span>Checking…</span>
      ) : isOk ? (
        <span style={{ color: tokens.textPrimary, fontWeight: 600 }}>API healthy</span>
      ) : isDown ? (
        <span style={{ color: "#F47281", fontWeight: 600 }}>API down</span>
      ) : (
        <span>Unknown</span>
      )}
      {latencyMs != null && (
        <span style={{ color: tokens.textMuted, fontFamily: fontMono, fontSize: 11 }}>
          · {latencyMs}ms
        </span>
      )}
      <button
        onClick={onPing}
        style={{
          marginLeft: 4,
          background: "transparent",
          border: "none",
          color: tokens.textMuted,
          cursor: "pointer",
          padding: 2,
          display: "inline-flex",
        }}
        title="Re-check"
      >
        <RefreshCcw size={12} />
      </button>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, right }) {
  return (
    <div
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {Icon && <Icon size={14} color={tokens.textSecondary} />}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: tokens.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {title}
          </span>
        </div>
        {right}
      </div>
      <div style={{ padding: 16, flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function Field({ label, icon: Icon, children, hint }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: tokens.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontWeight: 600,
        }}
      >
        {Icon && <Icon size={11} />}
        {label}
        {hint && (
          <span
            style={{
              marginLeft: "auto",
              color: tokens.textMuted,
              textTransform: "none",
              fontWeight: 400,
              letterSpacing: 0,
            }}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

const baseInputStyle = {
  background: tokens.bg,
  border: `1px solid ${tokens.border}`,
  color: tokens.textPrimary,
  borderRadius: 5,
  padding: "9px 11px",
  fontSize: 13,
  fontFamily: fontUI,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  width: "100%",
  boxSizing: "border-box",
};

function inputFocus(e, focus) {
  e.target.style.borderColor = focus ? tokens.accent : tokens.border;
  e.target.style.boxShadow = focus ? `0 0 0 1px ${tokens.accent}33` : "none";
}

function PrimaryButton({ onClick, disabled, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#1A4F3D" : tokens.accent,
        color: disabled ? "#7AC9AE" : "#06241B",
        border: "none",
        borderRadius: 5,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: fontUI,
        letterSpacing: 0.3,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        transition: "transform 0.05s, background 0.15s",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function GhostButton({ onClick, children, icon: Icon, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        color: danger ? "#F47281" : tokens.textSecondary,
        border: `1px solid ${danger ? "#5A1F26" : tokens.border}`,
        borderRadius: 5,
        padding: "7px 11px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: fontUI,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  );
}

// ============================================================================
// Main App
// ============================================================================
export default function App() {
  // --- Form state -----------------------------------------------------------
  const [ticketId, setTicketId] = useState("");
  const [channel, setChannel] = useState("app");
  const [locale, setLocale] = useState("en");
  const [message, setMessage] = useState("");

  // --- Runtime state --------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState("idle"); // idle | checking | ok | down
  const [healthLatency, setHealthLatency] = useState(null);

  const [history, setHistory] = useState([]);

  // Auto-generate a ticket id once on mount.
  useEffect(() => {
    if (!ticketId) setTicketId(`T-${Date.now().toString(36).toUpperCase()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Derived --------------------------------------------------------------
  const casePalette = useMemo(
    () => (result ? caseTypeStyle[result.case_type] || caseTypeStyle.other : null),
    [result]
  );

  // --- API calls ------------------------------------------------------------
  async function callApi(path, init) {
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}${path}`, init);
    const elapsed = Math.round(performance.now() - t0);
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) {
      const message =
        (body && typeof body === "object" && body.message) ||
        (typeof body === "string" ? body : `HTTP ${res.status}`);
      const err = new Error(message);
      err.status = res.status;
      err.elapsed = elapsed;
      throw err;
    }
    return { body, elapsed };
  }

  async function checkHealth() {
    setHealth("checking");
    setHealthLatency(null);
    try {
      const { elapsed } = await callApi("/health", { method: "GET" });
      setHealth("ok");
      setHealthLatency(elapsed);
    } catch (e) {
      setHealth("down");
      setHealthLatency(e.elapsed ?? null);
    }
  }

  async function classify() {
    if (!ticketId.trim() || !message.trim()) {
      setError("ticket_id and message are both required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { body, elapsed } = await callApi("/sort-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId.trim(),
          channel,
          locale,
          message: message.trim(),
        }),
      });
      setResult({ ...body, _elapsed: elapsed, _ts: Date.now() });
      setHistory((prev) => {
        const entry = { ...body, _ts: Date.now(), _elapsed: elapsed };
        const next = [entry, ...prev.filter((h) => h.ticket_id !== entry.ticket_id)];
        return next.slice(0, 10);
      });
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function applyQuickFill(text) {
    setMessage(text);
  }

  function newTicketId() {
    setTicketId(`T-${Date.now().toString(36).toUpperCase()}`);
  }

  function clearHistory() {
    setHistory([]);
  }

  function loadFromHistory(entry) {
    setResult(entry);
    setError(null);
  }

  // --- Render ---------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: tokens.bg,
        color: tokens.textPrimary,
        fontFamily: fontUI,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Inline keyframes for the critical-severity pulse. */}
      <style>{`
        @keyframes qsPulse {
          0%   { box-shadow: 0 0 0 0 rgba(244, 114, 129, 0.55); }
          70%  { box-shadow: 0 0 0 10px rgba(244, 114, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 114, 129, 0); }
        }
        @keyframes qsPulseText {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
        @keyframes qsSpin {
          to { transform: rotate(360deg); }
        }
        .qs-mono { font-family: ${fontMono}; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${tokens.bg}; }
        ::-webkit-scrollbar-thumb { background: ${tokens.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${tokens.textMuted}; }
      `}</style>

      {/* Top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: `1px solid ${tokens.border}`,
          background: tokens.bg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              background: tokens.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 12px ${tokens.accent}55`,
            }}
          >
            <Zap size={16} color="#06241B" />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 0.2,
                color: tokens.textPrimary,
              }}
            >
              QueueStorm
            </div>
            <div style={{ fontSize: 11, color: tokens.textSecondary, marginTop: 1 }}>
              Triage console · internal ops
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HealthBadge
            status={health}
            latencyMs={healthLatency}
            onPing={checkHealth}
          />
          <GhostButton onClick={checkHealth} icon={health === "ok" ? Wifi : WifiOff}>
            Check API Health
          </GhostButton>
        </div>
      </header>

      {/* Main grid */}
      <main
        style={{
          flex: 1,
          padding: 24,
          display: "grid",
          gridTemplateColumns: "minmax(380px, 1fr) minmax(380px, 1.2fr)",
          gridTemplateRows: "1fr auto",
          gap: 16,
          minHeight: 0,
        }}
      >
        {/* Form panel */}
        <SectionCard title="New Ticket" icon={FileText}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Ticket ID" icon={Hash} hint="auto-generated">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="qs-mono"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="T-XXXXXXXX"
                  style={{ ...baseInputStyle, flex: 1 }}
                  onFocus={(e) => inputFocus(e, true)}
                  onBlur={(e) => inputFocus(e, false)}
                />
                <GhostButton onClick={newTicketId} icon={RefreshCcw}>
                  New
                </GhostButton>
              </div>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Channel" icon={Activity}>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  style={baseInputStyle}
                  onFocus={(e) => inputFocus(e, true)}
                  onBlur={(e) => inputFocus(e, false)}
                >
                  {channels.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Locale" icon={Activity}>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  style={baseInputStyle}
                  onFocus={(e) => inputFocus(e, true)}
                  onBlur={(e) => inputFocus(e, false)}
                >
                  {locales.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Message" icon={FileText}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste customer complaint here..."
                rows={3}
                style={{
                  ...baseInputStyle,
                  minHeight: 80,
                  resize: "vertical",
                  fontFamily: fontUI,
                  lineHeight: 1.5,
                }}
                onFocus={(e) => inputFocus(e, true)}
                onBlur={(e) => inputFocus(e, false)}
              />
            </Field>

            <div>
              <div
                style={{
                  fontSize: 11,
                  color: tokens.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Quick fill
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {quickFills.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => applyQuickFill(q.message)}
                    style={{
                      background: tokens.surfaceAlt,
                      border: `1px solid ${tokens.border}`,
                      color: tokens.textPrimary,
                      borderRadius: 5,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: fontUI,
                      cursor: "pointer",
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <div
                style={{
                  fontSize: 11,
                  color: tokens.textMuted,
                  fontFamily: fontMono,
                }}
              >
                POST {API_BASE}/sort-ticket
              </div>
              <PrimaryButton onClick={classify} disabled={loading} icon={Zap}>
                {loading ? "Classifying…" : "Classify Ticket"}
              </PrimaryButton>
            </div>
          </div>
        </SectionCard>

        {/* Result panel */}
        <SectionCard
          title="Classification"
          icon={Shield}
          right={
            result ? (
              <span style={{ fontSize: 11, color: tokens.textMuted, fontFamily: fontMono }}>
                {result._elapsed}ms · {formatTime(result._ts)}
              </span>
            ) : null
          }
        >
          {loading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                height: "100%",
                minHeight: 240,
                color: tokens.textSecondary,
              }}
            >
              <Loader2
                size={22}
                color={tokens.accent}
                style={{ animation: "qsSpin 0.9s linear infinite" }}
              />
              <div style={{ fontSize: 12 }}>Routing ticket through rule engine…</div>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                background: "#2A0F12",
                border: "1px solid #5A1F26",
                color: "#F47281",
                borderRadius: 5,
                padding: 12,
                fontSize: 12,
                fontFamily: fontMono,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Request failed</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {!loading && !error && !result && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 240,
                color: tokens.textMuted,
                textAlign: "center",
                padding: 20,
              }}
            >
              <FileText size={26} color={tokens.textMuted} />
              <div style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: 600 }}>
                Awaiting ticket
              </div>
              <div style={{ fontSize: 12, color: tokens.textMuted, maxWidth: 280 }}>
                Submit a ticket from the left panel to see its case type, severity,
                department, and triage guidance here.
              </div>
            </div>
          )}

          {!loading && !error && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {result.human_review_required ? (
                <div
                  style={{
                    background: "#2A0F12",
                    border: "1px solid #C4233A",
                    color: "#F47281",
                    borderRadius: 5,
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    animation: "qsPulseText 1.4s ease-in-out infinite",
                  }}
                >
                  <AlertTriangle size={16} />
                  Human Review Required
                </div>
              ) : (
                <div
                  style={{
                    background: "#0F2A1E",
                    border: "1px solid #1F7A4D",
                    color: "#4ADE80",
                    borderRadius: 5,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle size={14} />
                  Auto-processable
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Ticket ID
                </div>
                <span
                  className="qs-mono"
                  style={{
                    display: "inline-block",
                    background: tokens.surfaceAlt,
                    border: `1px solid ${tokens.border}`,
                    color: tokens.textPrimary,
                    padding: "4px 10px",
                    borderRadius: 5,
                    fontSize: 13,
                  }}
                >
                  {result.ticket_id}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: tokens.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Case type
                  </div>
                  {casePalette && (
                    <Pill palette={casePalette} title={result.case_type}>
                      {result.case_type}
                    </Pill>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: tokens.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Severity
                  </div>
                  <SeverityBadge value={result.severity} />
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Building2 size={11} />
                  Department
                </div>
                <Pill
                  palette={{ bg: "#1E1F24", border: tokens.border, text: tokens.textPrimary }}
                >
                  {result.department}
                </Pill>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Agent summary
                </div>
                <blockquote
                  style={{
                    margin: 0,
                    padding: "10px 12px",
                    background: tokens.bg,
                    border: `1px solid ${tokens.border}`,
                    borderLeft: `3px solid ${tokens.accent}`,
                    borderRadius: 5,
                    color: tokens.textPrimary,
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  {result.agent_summary}
                </blockquote>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Confidence
                </div>
                <ConfidenceBar value={result.confidence} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* History panel (spans both columns) */}
        <div style={{ gridColumn: "1 / -1" }}>
          <SectionCard
            title={`History · ${history.length}/10`}
            icon={Clock}
            right={
              <GhostButton
                onClick={clearHistory}
                icon={Trash2}
                danger
                disabled={history.length === 0}
              >
                Clear History
              </GhostButton>
            }
          >
            {history.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: tokens.textMuted,
                  fontSize: 12,
                  padding: 20,
                }}
              >
                No classifications yet. Submit a ticket to populate the history.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 8,
                }}
              >
                {history.map((h, i) => {
                  const cp = caseTypeStyle[h.case_type] || caseTypeStyle.other;
                  return (
                    <div
                      key={`${h.ticket_id}-${i}`}
                      onClick={() => loadFromHistory(h)}
                      style={{
                        background: tokens.surfaceAlt,
                        border: `1px solid ${tokens.border}`,
                        borderRadius: 5,
                        padding: "10px 12px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tokens.accent;
                        e.currentTarget.style.background = "#22232A";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tokens.border;
                        e.currentTarget.style.background = tokens.surfaceAlt;
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          className="qs-mono"
                          style={{
                            fontSize: 12,
                            color: tokens.textPrimary,
                            fontWeight: 600,
                          }}
                        >
                          {h.ticket_id}
                        </span>
                        <span
                          className="qs-mono"
                          style={{ fontSize: 10, color: tokens.textMuted }}
                        >
                          {formatTime(h._ts)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Pill palette={cp}>{h.case_type}</Pill>
                        <SeverityBadge value={h.severity} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </main>

      <footer
        style={{
          padding: "14px 24px",
          borderTop: `1px solid ${tokens.border}`,
          textAlign: "center",
          color: tokens.textMuted,
          fontSize: 11,
          fontFamily: fontUI,
        }}
      >
        QueueStorm · bKash × SUST CSE Carnival 2026 · Codex Community Hackathon
      </footer>
    </div>
  );
}
