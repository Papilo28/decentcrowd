import { useState } from "react";
import { Icon, Badge, ProgBar, DocsCallout, short, timeAgo } from "./UI";
import { EXPLORER } from "../lib/contract";

// ── DAO PAGE ──────────────────────────────────────────────────────
export function DAOPage({ campaigns, wallet, castVote, txPending, addNotif }) {
  const [voted, setVoted] = useState({});

  // Build proposals from campaigns that have open votes
  const proposals = campaigns.flatMap(c =>
    (c.milestones || [])
      .filter((m, i) => m.voteDeadline > 0 && Date.now() / 1000 < m.voteDeadline)
      .map((m, mi) => ({
        key: `${c.id}-${mi}`,
        campaignId: c.id,
        milestoneIndex: c.nextMilestone,
        title: `${c.title} — Milestone ${mi + 1}`,
        desc: m.description,
        releasePercent: m.releasePercent,
        deadline: m.voteDeadline,
        yesWei: m.voteYes || 0n,
        noWei:  m.voteNo  || 0n,
      }))
  );

  // Add demo proposals if none from chain
  const demoProposals = [
    { key: "d1", campaignId: 4, milestoneIndex: 1, title: "Harare Tech Hub — Milestone 2", desc: "Run first cohort of 100 students", releasePercent: 40, deadline: Math.floor(Date.now()/1000) + 36000, yesWei: 0n, noWei: 0n },
    { key: "d2", campaignId: 1, milestoneIndex: 0, title: "Lagos Solar Grid — Milestone 1", desc: "Purchase solar panels and inverters", releasePercent: 30, deadline: Math.floor(Date.now()/1000) + 72000, yesWei: 0n, noWei: 0n },
    { key: "d3", campaignId: 3, milestoneIndex: 0, title: "Dakar Mobile Clinic — Milestone 1", desc: "Procure 5 mobile health units", releasePercent: 40, deadline: Math.floor(Date.now()/1000) + 18000, yesWei: 0n, noWei: 0n },
  ];
  const allProposals = proposals.length > 0 ? proposals : demoProposals;

  const handleVote = async (p, support) => {
    if (!wallet) { addNotif("Connect your wallet to vote", "warning"); return; }
    try {
      await castVote(p.campaignId, support);
      setVoted(v => ({ ...v, [p.key]: support ? "yes" : "no" }));
      addNotif(`Vote cast on "${p.title}"`, "success");
    } catch (e) {
      addNotif(e.message?.includes("user rejected") ? "Vote rejected." : "Vote failed.", "error");
    }
  };

  const hoursLeft = (deadline) => {
    const secs = deadline - Date.now() / 1000;
    if (secs <= 0) return "Ended";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <>
      <DocsCallout page="dao" />
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card"><div className="stat-num">2,891</div><div className="stat-label">DAO voters</div></div>
        <div className="stat-card"><div className="stat-num">{allProposals.length}</div><div className="stat-label">Active proposals</div></div>
        <div className="stat-card"><div className="stat-num">94%</div><div className="stat-label">Approval rate</div></div>
        <div className="stat-card"><div className="stat-num">48h</div><div className="stat-label">Avg resolution</div></div>
      </div>

      <div className="section-header">
        <div className="section-title">Active Proposals</div>
        <a href="https://docs.decentcrowd.cc/dao" target="_blank" rel="noopener"
          style={{ fontSize: 12, color: "var(--ink3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          How DAO voting works <Icon name="external" size={11} />
        </a>
      </div>

      {allProposals.map(p => (
        <div key={p.key} className="proposal-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".75rem" }}>
            <div>
              <div style={{ fontFamily: "var(--display)", fontSize: ".92rem", fontWeight: 700, marginBottom: 3 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>{p.desc} · {p.releasePercent}% release</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: "1rem" }}>
              <Badge type="live">Live</Badge>
              <span style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 600 }}>{hoursLeft(p.deadline)}</span>
            </div>
          </div>

          <div className="vote-bar">
            <div className="vote-yes" style={{ width: "58%" }} />
            <div className="vote-no" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink3)", marginBottom: ".875rem" }}>
            <span style={{ color: "var(--green)", fontWeight: 600 }}>58% Yes</span>
            <span>342 voters</span>
            <span style={{ color: "var(--red)", fontWeight: 600 }}>42% No</span>
          </div>

          {voted[p.key] ? (
            <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
              ✓ You voted {voted[p.key] === "yes" ? "Yes (Approve)" : "No (Reject)"}
            </div>
          ) : wallet ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary btn-sm" style={{ background: "var(--green)" }} onClick={() => handleVote(p, true)} disabled={txPending}>
                <Icon name="check" size={12} /> Vote Yes
              </button>
              <button className="btn-secondary btn-sm" style={{ color: "var(--red)", borderColor: "currentColor" }} onClick={() => handleVote(p, false)} disabled={txPending}>
                Vote No
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--ink3)" }}>
              Connect wallet to vote ·{" "}
              <a href="https://docs.decentcrowd.cc/dao" target="_blank" rel="noopener" style={{ color: "var(--ink)", fontWeight: 600 }}>Learn more</a>
            </div>
          )}
        </div>
      ))}
    <div style={{ height: "2rem" }} />
    </>
  );
}

// ── WALLET PAGE ───────────────────────────────────────────────────
export function WalletPage({ wallet, balance, campaigns, onFaucet, onConnect }) {
  const mockTxs = [
    { hash: "0xabc123", type: "Pledge", desc: "Lagos Solar Grid", amount: "+0.05 ETH", date: new Date(Date.now() - 3600000 * 2), status: "confirmed" },
    { hash: "0xdef456", type: "Pledge", desc: "Dakar Mobile Clinic", amount: "+0.025 ETH", date: new Date(Date.now() - 86400000), status: "confirmed" },
    { hash: "0x789abc", type: "Pledge", desc: "Accra Cooperative Farm", amount: "+0.1 ETH", date: new Date(Date.now() - 86400000 * 3), status: "confirmed" },
  ];

  if (!wallet) return (
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: ".75rem" }}>Connect your wallet</div>
      <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: "1.5rem", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 1.5rem" }}>
        Connect Wallet to view your balance, transaction history, and manage your pledges.
      </p>
      <button className="btn-primary" onClick={onConnect}>Connect Wallet</button>
      <p style={{ marginTop: "1rem", fontSize: 12, color: "var(--ink3)" }}>
        <a href="https://docs.decentcrowd.cc/getting-started" target="_blank" rel="noopener" style={{ color: "var(--ink3)" }}>
          New to crypto? Read our getting-started guide →
        </a>
      </p>
    </div>
  );

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: ".75rem", marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-num">{balance ? parseFloat(balance).toFixed(4) : "—"}</div>
          <div className="stat-label">ETH Balance (Sepolia)</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">0.175</div>
          <div className="stat-label">ETH Pledged</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">3</div>
          <div className="stat-label">Active pledges</div>
        </div>
      </div>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>Connected Address</div>
        <div style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", marginBottom: "1rem" }}>{wallet}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(wallet)}>
            <Icon name="copy" size={12} /> Copy
          </button>
          <a href={`${EXPLORER}/address/${wallet}`} target="_blank" rel="noopener" className="btn-secondary btn-sm" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="external" size={12} /> Etherscan
          </a>
          <button className="btn-secondary btn-sm" onClick={onFaucet}>
            <Icon name="faucet" size={12} /> Get Test ETH
          </button>
        </div>
      </div>

      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div className="section-title">Transaction History</div>
        <a href={`${EXPLORER}/address/${wallet}`} target="_blank" rel="noopener"
          style={{ fontSize: 12, color: "var(--ink3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          View all on Etherscan <Icon name="external" size={11} />
        </a>
      </div>

      {mockTxs.map(tx => (
        <div key={tx.hash} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".875rem 1rem", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: ".5rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", flexShrink: 0 }}>
            <Icon name="eth" size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.type} — {tx.desc}</div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>{timeAgo(tx.date)}</div>
          </div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 13 }}>{tx.amount}</div>
          <a href={`${EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noopener" style={{ color: "var(--ink3)" }}>
            <Icon name="external" size={13} />
          </a>
        </div>
      ))}
    <div style={{ height: "2rem" }} />
    </>
  );
}

// ── PROFILE PAGE ──────────────────────────────────────────────────
export function ProfilePage({ wallet, address, balance, campaigns, onDisconnect, onFaucet }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState("Anonymous Backer");
  const [bio, setBio]         = useState("Building Africa's decentralised future, one pledge at a time.");

  if (!address) return (
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: ".75rem" }}>No wallet connected</div>
      <p style={{ fontSize: 13, color: "var(--ink3)" }}>Connect Wallet to view your profile.</p>
    </div>
  );

  return (
    <>
      {/* Avatar card */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 800, color: "white", flexShrink: 0 }}>
            {address.slice(2, 4).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <>
                <input value={name} onChange={e => setName(e.target.value)}
                  style={{ fontFamily: "var(--display)", fontSize: ".95rem", fontWeight: 700, border: "1px solid var(--border2)", borderRadius: 6, padding: "6px 8px", marginBottom: 6, width: "100%", outline: "none" }} />
                <textarea value={bio} onChange={e => setBio(e.target.value)}
                  style={{ fontSize: 12, border: "1px solid var(--border2)", borderRadius: 6, padding: "6px 8px", width: "100%", resize: "none", fontFamily: "var(--sans)", outline: "none", lineHeight: 1.6 }} rows={2} />
                <button className="btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setEditing(false)}>Save</button>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "var(--display)", fontSize: ".95rem", fontWeight: 700, marginBottom: 3 }}>{name}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 6, lineHeight: 1.6 }}>{bio}</div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--ink3)", wordBreak: "break-all", lineHeight: 1.5 }}>{address}</div>
                <button className="btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setEditing(true)}>Edit Profile</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats - 2 col on all screens */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".625rem", marginBottom: "1rem" }}>
        <div className="stat-card">
          <div className="stat-num" style={{ fontSize: "1.1rem" }}>{balance ? parseFloat(balance).toFixed(4) : "—"}</div>
          <div className="stat-label">ETH Balance</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ fontSize: "1.1rem" }}>—</div>
          <div className="stat-label">ETH Pledged</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ fontSize: "1.1rem" }}>—</div>
          <div className="stat-label">Campaigns backed</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ fontSize: "1.1rem" }}>#—</div>
          <div className="stat-label">Leaderboard rank</div>
        </div>
      </div>

      {/* Action buttons — stacked on mobile */}
      <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
        <button className="btn-secondary" style={{ justifyContent: "center" }} onClick={onFaucet}>
          <Icon name="faucet" size={14} /> Get Test ETH
        </button>
        <a href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener"
          className="btn-secondary" style={{ textDecoration: "none", justifyContent: "center" }}>
          <Icon name="external" size={14} /> View on Etherscan
        </a>
        <button className="btn-secondary" style={{ color: "var(--red)", justifyContent: "center" }} onClick={onDisconnect}>
          <Icon name="logout" size={14} /> Disconnect Wallet
        </button>
      </div>
      <div style={{ height: "2rem" }} />
    </>
  );
}

// ── LEADERBOARD PAGE ──────────────────────────────────────────────
export function LeaderboardPage({ address }) {
  const rows = [
    { rank: 1,  addr: "0x8F3B...2a41", pledged: "4.23", backed: 18, badge: "🏆" },
    { rank: 2,  addr: "0x1A2C...8f9d", pledged: "3.87", backed: 14, badge: "🥈" },
    { rank: 3,  addr: "0x4D5E...c3b2", pledged: "2.94", backed: 11, badge: "🥉" },
    { rank: 4,  addr: "0x7G8H...1e4f", pledged: "2.41", backed: 9,  badge: "" },
    { rank: 5,  addr: "0x9I0J...5a7c", pledged: "2.12", backed: 8,  badge: "" },
    { rank: 6,  addr: "0xB2C3...9d1e", pledged: "1.88", backed: 7,  badge: "" },
    { rank: 7,  addr: "0xD4E5...2f3a", pledged: "1.65", backed: 7,  badge: "" },
    { rank: 8,  addr: "0xF6G7...4b5c", pledged: "1.44", backed: 6,  badge: "" },
    { rank: 9,  addr: "0xH8I9...6d7e", pledged: "1.23", backed: 5,  badge: "" },
    { rank: 10, addr: "0xJ0K1...8f9a", pledged: "1.05", backed: 4,  badge: "" },
    { rank: 42, addr: address ? short(address) : "You", pledged: "0.175", backed: 3, badge: "👤", isMe: true },
  ];

  return (
    <>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div className="section-title">Top Backers — All Time</div>
        <a href="https://docs.decentcrowd.cc/leaderboard" target="_blank" rel="noopener"
          style={{ fontSize: 12, color: "var(--ink3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          How ranking works <Icon name="external" size={11} />
        </a>
      </div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Rank", "Address", "ETH Pledged", "Campaigns"].map(h => (
                <th key={h} style={{ padding: ".75rem 1rem", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <>
                {r.isMe && rows[i - 1]?.rank !== r.rank - 1 && (
                  <tr key="sep"><td colSpan={4} style={{ padding: ".5rem 1rem", fontSize: 11, color: "var(--ink3)", textAlign: "center" }}>· · ·</td></tr>
                )}
                <tr key={r.rank} style={{
                  borderBottom: "1px solid var(--border)",
                  background: r.isMe ? "#F0F9FF" : "transparent",
                }}>
                  <td style={{ padding: ".875rem 1rem", fontFamily: "var(--display)", fontWeight: 700 }}>
                    {r.badge || `#${r.rank}`}
                  </td>
                  <td style={{ padding: ".875rem 1rem", fontFamily: "monospace", fontSize: 12, fontWeight: r.isMe ? 700 : 400 }}>
                    {r.addr} {r.isMe && <Badge type="pending">You</Badge>}
                  </td>
                  <td style={{ padding: ".875rem 1rem", fontFamily: "var(--display)", fontWeight: 700 }}>{r.pledged} ETH</td>
                  <td style={{ padding: ".875rem 1rem", color: "var(--ink3)", fontSize: 13 }}>{r.backed} campaigns</td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
