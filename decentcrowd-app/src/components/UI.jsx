import { ethers } from "ethers";
// src/components/UI.jsx — shared primitives

export function Icon({ name, size = 16 }) {
  const s = { width: size, height: size };
  const icons = {
    home:     <><rect x="3" y="11" width="18" height="10" rx="1"/><path d="M3 11L12 2l9 9"/></>,
    explore:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    dao:      <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    wallet:   <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 14a1 1 0 110 2 1 1 0 010-2z" fill="currentColor"/><path d="M2 10h20"/></>,
    profile:  <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bell:     <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    grid:     <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    list:     <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    chevdown: <><polyline points="6 9 12 15 18 9"/></>,
    back:     <><polyline points="15 18 9 12 15 6"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
    external: <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    book:     <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    copy:     <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    logout:   <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    filter:   <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    eth:      <><path d="M12 2L2 12l10 6 10-6L12 2z"/><path d="M2 12l10 6 10-6"/><path d="M12 2v16"/></>,
    leaderboard: <><path d="M12 20v-8"/><path d="M18 20V4"/><path d="M6 20v-4"/></>,
    faucet:   <><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 7.7 7 5.3c-.29 2.4-2.14 3.63-3.29 4.56C2.57 10.0 2 11.09 2 12.25 2 14.47 3.8 16.3 6 16.3"/><path d="M12.56 6.6A10.97 10.97 0 0014 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 01-11.91 4.97"/></>,
    mic:      <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      {icons[name] || null}
    </svg>
  );
}

export function Badge({ type = "live", children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function ProgBar({ pct }) {
  const cls = pct >= 80 ? "prog-green" : pct >= 40 ? "prog-amber" : "prog-red";
  return (
    <div className="prog-track">
      <div className={`prog-fill ${cls}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      style={{ animation: "spin .7s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity=".2" />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}

export function DocsCallout({ page }) {
  const msgs = {
    home:    "New here? Read the quick-start guide to connect your wallet and back your first campaign.",
    explore: "Not sure what to look for? Our docs explain how to evaluate a campaign before pledging.",
    dao:     "DAO voting is weighted by your pledge size. Learn how governance works in the docs.",
    fund:    "Funds are held in escrow until milestones are approved. See how the escrow works.",
    create:  "Before creating a campaign, read our checklist for a successful launch.",
  };
  return (
    <div className="docs-callout">
      <Icon name="book" size={16} />
      <span>
        {msgs[page] || "Need help?"}{" "}
        <a href="https://docs.decentcrowd.cc" target="_blank" rel="noopener">
          Read the docs <Icon name="external" size={10} />
        </a>
      </span>
    </div>
  );
}

export function ExplorerLink({ txHash, label }) {
  return (
    <a
      href={`https://sepolia.etherscan.io/tx/${txHash}`}
      target="_blank" rel="noopener"
      className="ext-link"
    >
      {label || "View on Etherscan"} <Icon name="external" size={11} />
    </a>
  );
}

export function short(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function fmtEth(wei) {
  if (!wei) return "0";
  try { return parseFloat(ethers.formatEther(wei)).toFixed(4); } catch { return "0"; }
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
