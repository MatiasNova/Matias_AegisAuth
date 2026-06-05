import { useState, useEffect, useCallback } from "react";
import { useStats } from "./hooks/useStats";
import { useLiveSocket } from "./hooks/useLiveSocket";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

// ─── MOCK FALLBACK DATA ───────────────────────────────────────────────────────

const threatTimeline = [
  { time: "00:00", critical: 2,  high: 8,  medium: 14, low: 22 },
  { time: "03:00", critical: 1,  high: 5,  medium: 11, low: 18 },
  { time: "06:00", critical: 0,  high: 3,  medium: 9,  low: 15 },
  { time: "09:00", critical: 4,  high: 12, medium: 20, low: 31 },
  { time: "12:00", critical: 7,  high: 18, medium: 26, low: 40 },
  { time: "15:00", critical: 5,  high: 15, medium: 22, low: 36 },
  { time: "18:00", critical: 9,  high: 21, medium: 28, low: 44 },
  { time: "21:00", critical: 6,  high: 17, medium: 24, low: 38 },
  { time: "Now",   critical: 11, high: 24, medium: 31, low: 47 },
];

const attackVectors = [
  { name: "Phishing",    count: 347 },
  { name: "Malware",     count: 218 },
  { name: "Brute Force", count: 164 },
  { name: "SQLi / XSS",  count: 132 },
  { name: "Zero-day",    count: 92  },
  { name: "Other",       count: 71  },
];

const riskRadar = [
  { subject: "Network",      score: 78 },
  { subject: "Endpoints",    score: 55 },
  { subject: "Identity",     score: 82 },
  { subject: "Data",         score: 64 },
  { subject: "Cloud",        score: 70 },
  { subject: "Supply Chain", score: 47 },
];

const complianceData = [
  { framework: "SOC 2",     score: 91 },
  { framework: "ISO 27001", score: 84 },
  { framework: "NIST CSF",  score: 76 },
  { framework: "PCI DSS",   score: 88 },
  { framework: "GDPR",      score: 93 },
];

const complianceDetail = [
  { framework: "SOC 2",     score: 91, controls: 114, passing: 104, failing: 10, lastAudit: "2026-03-12" },
  { framework: "ISO 27001", score: 84, controls: 93,  passing: 78,  failing: 15, lastAudit: "2026-01-08" },
  { framework: "NIST CSF",  score: 76, controls: 108, passing: 82,  failing: 26, lastAudit: "2026-04-01" },
  { framework: "PCI DSS",   score: 88, controls: 75,  passing: 66,  failing: 9,  lastAudit: "2026-02-19" },
  { framework: "GDPR",      score: 93, controls: 60,  passing: 56,  failing: 4,  lastAudit: "2026-04-22" },
];

const mockRecentAlerts = [
  { id: "AL-9041", severity: "CRITICAL", asset: "prod-db-01",  event: "Privilege escalation attempt",        time: "2m ago"  },
  { id: "AL-9040", severity: "HIGH",     asset: "vpn-gateway", event: "Brute force — 312 failed logins",     time: "8m ago"  },
  { id: "AL-9039", severity: "HIGH",     asset: "k8s-node-07", event: "Lateral movement detected",           time: "19m ago" },
  { id: "AL-9038", severity: "MEDIUM",   asset: "mail-relay",  event: "Phishing campaign blocked (94 msgs)", time: "34m ago" },
  { id: "AL-9037", severity: "MEDIUM",   asset: "dev-jenkins", event: "Exposed credentials in build log",    time: "51m ago" },
  { id: "AL-9036", severity: "LOW",      asset: "cdn-edge-03", event: "TLS certificate expiry in 14d",       time: "1h ago"  },
];

const mockAllAlerts = [
  ...mockRecentAlerts,
  { id: "AL-9035", severity: "CRITICAL", asset: "auth-svc-02", event: "Token replay attack detected",          time: "1h ago" },
  { id: "AL-9034", severity: "HIGH",     asset: "api-gateway", event: "Rate limit bypass via header injection", time: "2h ago" },
  { id: "AL-9033", severity: "MEDIUM",   asset: "s3-backups",  event: "Public ACL set on bucket",              time: "3h ago" },
  { id: "AL-9032", severity: "LOW",      asset: "log-server",  event: "Disk utilisation at 88%",               time: "4h ago" },
];

const pieData = [
  { name: "Critical", value: 11, color: "#ef4444" },
  { name: "High",     value: 24, color: "#f97316" },
  { name: "Medium",   value: 31, color: "#eab308" },
  { name: "Low",      value: 47, color: "#22c55e" },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SEV_STYLE = {
  CRITICAL: { bg: "bg-red-950 border border-red-700",      badge: "bg-red-700 text-red-100"         },
  HIGH:     { bg: "bg-orange-950 border border-orange-700", badge: "bg-orange-700 text-orange-100"   },
  MEDIUM:   { bg: "bg-yellow-950 border border-yellow-700", badge: "bg-yellow-700 text-yellow-100"   },
  LOW:      { bg: "bg-emerald-950 border border-emerald-700",badge: "bg-emerald-700 text-emerald-100" },
};

const TOOLTIP_STYLE = {
  backgroundColor: "#0f1117",
  border: "1px solid #1e2535",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "#cbd5e1",
};

const TABS = ["overview", "threats", "compliance", "alerts"];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#64748b", marginBottom: 4, fontFamily: "monospace", fontSize: 11 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong style={{ color: "#f1f5f9" }}>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function RiskScore({ score }) {
  const color = score > 75 ? "#ef4444" : score > 50 ? "#f97316" : "#22c55e";
  const label = score > 75 ? "HIGH RISK" : score > 50 ? "MODERATE" : "SECURE";
  const r = 52, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const pct  = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2535" strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${pct} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x={cx} y={cy - 4}  textAnchor="middle" fill="#f1f5f9" fontSize="22" fontWeight="700" fontFamily="monospace">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="10"  fontFamily="monospace">/100</text>
      </svg>
      <span style={{ color, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginTop: -8 }}>{label}</span>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-lg p-4 flex flex-col gap-1" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
      <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: accent ?? "#f1f5f9", fontFamily: "monospace" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "#475569" }}>{sub}</span>}
    </div>
  );
}

function AlertRow({ a }) {
  const s = SEV_STYLE[a.severity] ?? SEV_STYLE.LOW;
  return (
    <div className={`flex items-start gap-3 rounded p-2 ${s.bg}`}>
      <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${s.badge}`}
        style={{ fontSize: 9, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
        {a.severity}
      </span>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 11, color: "#e2e8f0", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.event}</p>
        <p style={{ fontSize: 10, color: "#475569", margin: 0 }}>{a.asset} · {a.time}</p>
      </div>
      <span style={{ fontSize: 10, color: "#334155", whiteSpace: "nowrap" }}>{a.id}</span>
    </div>
  );
}

// ─── TAB PANELS ───────────────────────────────────────────────────────────────

function OverviewPanel({ liveCount, overview, recent, trend }) {
  const activeThreats  = overview?.active_threats      ?? liveCount ?? "—";
  const totalAnalyses  = overview?.total_analyses      ?? "1,847";
  const hashCount      = overview?.total_hash_analyses ?? "5,239";
  const riskScore      = overview?.risk_score          ?? 68;
  const liveAlerts     = recent?.length ? recent : mockRecentAlerts;
  const trendData      = trend?.length  ? trend  : threatTimeline;

  return (
    <div className="flex flex-col gap-6">

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <MetricCard label="Active Threats"   value={activeThreats} sub="Critical + High"      accent="#ef4444" />
        <MetricCard label="Total Analyses"   value={totalAnalyses} sub="All time" />
        <MetricCard label="Hash Inspections" value={hashCount}     sub="Hashes evaluated"     accent="#60a5fa" />
        <MetricCard label="MTTR"             value="4.2h"          sub="Target: < 6h"          accent="#22c55e" />
      </div>

      {/* ROW 2 — Risk Score + Threat Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>

        <div className="rounded-lg p-5 flex flex-col items-center justify-between gap-4"
          style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "flex-start" }}>Overall Risk</span>
          <RiskScore score={riskScore} />
          <div className="w-full" style={{ borderTop: "1px solid #1e2535", paddingTop: 12 }}>
            {[["Critical", 11, "#ef4444"], ["High", 24, "#f97316"], ["Medium", 31, "#eab308"], ["Low", 47, "#22c55e"]].map(([lbl, val, color]) => (
              <div key={lbl} className="flex justify-between items-center mb-1">
                <span style={{ fontSize: 11, color: "#64748b" }}>{lbl}</span>
                <div className="flex items-center gap-2">
                  <div style={{ width: 60, height: 3, background: "#1e2535", borderRadius: 2 }}>
                    <div style={{ width: `${(val / 47) * 100}%`, height: "100%", background: color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color, minWidth: 20, textAlign: "right" }}>{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <div className="flex justify-between items-center mb-4">
            <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>Threat Activity — 24h</span>
            <span style={{ fontSize: 10, color: "#334155" }}>Stacked by severity</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                {[["crit","#ef4444"],["high","#f97316"],["med","#eab308"],["low","#22c55e"]].map(([id, color]) => (
                  <linearGradient key={id} id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="#1e2535" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="low"      stackId="1" stroke="#22c55e" fill="url(#g-low)"  strokeWidth={1.5} name="Low"      />
              <Area type="monotone" dataKey="medium"   stackId="1" stroke="#eab308" fill="url(#g-med)"  strokeWidth={1.5} name="Medium"   />
              <Area type="monotone" dataKey="high"     stackId="1" stroke="#f97316" fill="url(#g-high)" strokeWidth={1.5} name="High"     />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="url(#g-crit)" strokeWidth={1.5} name="Critical" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3 — Attack Vectors + Radar + Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 16 }}>

        <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Attack Vectors</span>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attackVectors} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 20 }}>
              <CartesianGrid stroke="#1e2535" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} name="Incidents">
                {attackVectors.map((_, i) => (
                  <Cell key={i} fill={["#3b82f6","#8b5cf6","#ec4899","#f97316","#ef4444","#64748b"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Attack Surface Exposure</span>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={riskRadar} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <PolarGrid stroke="#1e2535" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-5 flex flex-col" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Severity Mix</span>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "#64748b" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4 — Compliance + Live Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Compliance Posture</span>
          <div className="flex flex-col gap-3">
            {complianceData.map((d) => {
              const color = d.score >= 90 ? "#22c55e" : d.score >= 80 ? "#60a5fa" : "#f97316";
              return (
                <div key={d.framework}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{d.framework}</span>
                    <span style={{ fontSize: 12, color, fontFamily: "monospace" }}>{d.score}%</span>
                  </div>
                  <div style={{ height: 4, background: "#1e2535", borderRadius: 2 }}>
                    <div style={{ width: `${d.score}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>Recent Alerts</span>
            <span style={{ fontSize: 10, color: "#3b82f6", letterSpacing: "0.06em", cursor: "pointer" }}>VIEW ALL →</span>
          </div>
          <div className="flex flex-col gap-2">
            {liveAlerts.slice(0, 6).map((a) => <AlertRow key={a.id} a={a} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreatsPanel({ recent }) {
  const [filter, setFilter] = useState("ALL");
  const severities = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const liveAlerts = recent?.length ? recent : mockAllAlerts;
  const filtered   = filter === "ALL" ? liveAlerts : liveAlerts.filter((a) => a.severity === filter);

  return (
    <div className="flex flex-col gap-6">

      <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
        <div className="flex justify-between items-center mb-4">
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>Threat Activity — 24h</span>
          <span style={{ fontSize: 10, color: "#334155" }}>Stacked by severity</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={threatTimeline} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <defs>
              {[["crit","#ef4444"],["high","#f97316"],["med","#eab308"],["low","#22c55e"]].map(([id, color]) => (
                <linearGradient key={id} id={`tg-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="#1e2535" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="low"      stackId="1" stroke="#22c55e" fill="url(#tg-low)"  strokeWidth={1.5} name="Low"      />
            <Area type="monotone" dataKey="medium"   stackId="1" stroke="#eab308" fill="url(#tg-med)"  strokeWidth={1.5} name="Medium"   />
            <Area type="monotone" dataKey="high"     stackId="1" stroke="#f97316" fill="url(#tg-high)" strokeWidth={1.5} name="High"     />
            <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="url(#tg-crit)" strokeWidth={1.5} name="Critical" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Attack Vectors</span>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attackVectors} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 20 }}>
              <CartesianGrid stroke="#1e2535" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} name="Incidents">
                {attackVectors.map((_, i) => (
                  <Cell key={i} fill={["#3b82f6","#8b5cf6","#ec4899","#f97316","#ef4444","#64748b"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Attack Surface Exposure</span>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={riskRadar} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <PolarGrid stroke="#1e2535" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
        <div className="flex justify-between items-center mb-4">
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Alert Feed {filter !== "ALL" && `— ${filter}`}
          </span>
          <div className="flex gap-2">
            {severities.map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                style={{
                  padding: "3px 10px", fontSize: 10, fontFamily: "monospace",
                  letterSpacing: "0.08em",
                  background: filter === s ? "#1e2535" : "none",
                  border: `1px solid ${filter === s ? "#334155" : "#1e2535"}`,
                  borderRadius: 4,
                  color: filter === s ? "#f1f5f9" : "#475569",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map((a) => <AlertRow key={a.id} a={a} />)}
          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: "20px 0" }}>No alerts matching filter.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CompliancePanel() {
  return (
    <div className="flex flex-col gap-6">

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <MetricCard label="Avg Compliance"  value="86.4%" sub="Across 5 frameworks"  accent="#60a5fa" />
        <MetricCard label="Total Controls"  value="450"   sub="Under assessment" />
        <MetricCard label="Passing"         value="386"   sub="85.8% pass rate"       accent="#22c55e" />
        <MetricCard label="Failing"         value="64"    sub="Require remediation"   accent="#ef4444" />
      </div>

      <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
        <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Framework Posture</span>
        <div className="flex flex-col gap-5">
          {complianceDetail.map((d) => {
            const color = d.score >= 90 ? "#22c55e" : d.score >= 80 ? "#60a5fa" : "#f97316";
            return (
              <div key={d.framework}>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{d.framework}</span>
                    <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>Last audit: {d.lastAudit}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ fontSize: 11, color: "#22c55e", fontFamily: "monospace" }}>{d.passing} passing</span>
                    <span style={{ fontSize: 11, color: "#ef4444", fontFamily: "monospace" }}>{d.failing} failing</span>
                    <span style={{ fontSize: 13, color, fontFamily: "monospace", fontWeight: 700, minWidth: 42, textAlign: "right" }}>{d.score}%</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "#1e2535", borderRadius: 3 }}>
                  <div style={{ width: `${d.score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ recent }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const severities = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const liveAlerts = recent?.length ? recent : mockAllAlerts;

  const filtered = liveAlerts.filter((a) => {
    const matchSev    = filter === "ALL" || a.severity === filter;
    const matchSearch = search === "" ||
      a.event.toLowerCase().includes(search.toLowerCase()) ||
      a.asset.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div className="flex flex-col gap-6">

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <MetricCard label="Total Alerts"   value={liveAlerts.length}                                                    sub="Last 24h" />
        <MetricCard label="Critical"       value={liveAlerts.filter(a=>a.severity==="CRITICAL").length} accent="#ef4444" sub="Immediate action" />
        <MetricCard label="High"           value={liveAlerts.filter(a=>a.severity==="HIGH").length}     accent="#f97316" sub="Review within 1h" />
        <MetricCard label="Resolved Today" value="32"                                                   accent="#22c55e" sub="↑ 7 vs yesterday" />
      </div>

      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search alerts, assets, IDs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, background: "#0d1117", border: "1px solid #1e2535",
            borderRadius: 6, padding: "7px 12px", fontSize: 12,
            color: "#e2e8f0", fontFamily: "monospace", outline: "none",
          }}
        />
        <div className="flex gap-2">
          {severities.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: "6px 12px", fontSize: 10, fontFamily: "monospace",
                letterSpacing: "0.08em",
                background: filter === s ? "#1e2535" : "none",
                border: `1px solid ${filter === s ? "#334155" : "#1e2535"}`,
                borderRadius: 4,
                color: filter === s ? "#f1f5f9" : "#475569",
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg p-5" style={{ background: "#0d1117", border: "1px solid #1e2535" }}>
        <div className="flex justify-between items-center mb-3">
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>Sorted by severity</span>
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map((a) => <AlertRow key={a.id} a={a} />)}
          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: "28px 0" }}>No alerts match current filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function CyberDashboard() {
  const [pulse, setPulse] = useState(false);
  const [tab,   setTab]   = useState("overview");

  // ── Real data hooks ──
  const { overview, recent, trend, loading } = useStats(10000);
  const { liveData, connected }              = useLiveSocket();

  // Derive live count: prefer WebSocket total, fall back to DB stat
  const liveCount = liveData?.total_analyses ?? overview?.total_analyses ?? 0;

  // API status driven by WebSocket connection
  const apiStatus = connected ? "online" : "offline";
  const apiColor  = apiStatus === "online" ? "#22c55e" : "#ef4444";
  const apiLabel  = apiStatus === "online" ? "API ONLINE" : "API OFFLINE";

  // Visual pulse tick
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen w-full text-slate-300"
      style={{ background: "#060a0f", fontFamily: "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace" }}
    >
      {/* ── TOPBAR ── */}
      <header className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid #1e2535", background: "#080c12" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded" style={{ background: "#1e2535" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <span style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}>SENTINEL</span>
            <span style={{ color: "#475569", fontSize: 12, marginLeft: 8 }}>Risk Analytics Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: pulse ? "#22c55e" : "#16a34a",
              display: "inline-block",
              boxShadow: pulse ? "0 0 6px #22c55e" : "none",
              transition: "all 0.4s",
            }} />
            <span style={{ fontSize: 11, color: "#22c55e", letterSpacing: "0.08em" }}>LIVE</span>
          </div>
          <span style={{ fontSize: 11, color: "#475569" }}>|</span>
          <div className="flex items-center gap-2">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: apiColor, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: apiColor, letterSpacing: "0.06em" }}>{apiLabel}</span>
          </div>
          <span style={{ fontSize: 11, color: "#475569" }}>|</span>
          <span style={{ fontSize: 11, color: "#64748b" }}>ENV: PRODUCTION</span>
          <span style={{ fontSize: 11, color: "#475569" }}>|</span>
          <span style={{ fontSize: 11, color: "#64748b" }}>SOC ANALYST — TIER 2</span>
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <nav className="flex gap-0 px-6" style={{ borderBottom: "1px solid #1e2535", background: "#080c12" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: "10px 20px", fontSize: 12,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "none", border: "none",
              borderBottom: tab === t ? "2px solid #60a5fa" : "2px solid transparent",
              color: tab === t ? "#60a5fa" : "#475569",
              cursor: "pointer", transition: "color 0.2s",
            }}>
            {t}
          </button>
        ))}
      </nav>

      {/* ── BODY ── */}
      <main className="p-6">
        {loading && tab === "overview" && (
          <p style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", marginBottom: 16 }}>
            Synchronizing live indices...
          </p>
        )}
        {tab === "overview"   && <OverviewPanel liveCount={liveCount} overview={overview} recent={recent} trend={trend} />}
        {tab === "threats"    && <ThreatsPanel  recent={recent} />}
        {tab === "compliance" && <CompliancePanel />}
        {tab === "alerts"     && <AlertsPanel   recent={recent} />}
      </main>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-3 flex justify-between items-center"
        style={{ borderTop: "1px solid #1e2535" }}>
        <span style={{ fontSize: 10, color: "#1e2535" }}>SENTINEL v3.8.0 · BUILD 20260529</span>
        <span style={{ fontSize: 10, color: "#1e2535" }}>DATA RETAINED FOR 90 DAYS · AES-256 ENCRYPTED</span>
      </footer>
    </div>
  );
}
