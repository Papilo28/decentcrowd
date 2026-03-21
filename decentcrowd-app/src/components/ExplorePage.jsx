import { useState, useMemo, useEffect } from "react";
import { Icon, ProgBar, Badge, DocsCallout, short, Spinner } from "./UI";
import { ethers } from "ethers";

const CATEGORIES = ["All", "Energy", "Agriculture", "Health", "Education", "Arts", "Water", "Tech"];
const COUNTRIES   = ["All", "Nigeria", "Ghana", "Senegal", "Zimbabwe", "Kenya", "Guinea"];

// ── EXPLORE PAGE ──────────────────────────────────────────────────
export function ExplorePage({ campaigns, onProject, onFund, wallet, globalSearch, loading }) {
  const [q, setQ]           = useState(globalSearch || "");
  const [cat, setCat]       = useState("All");
  const [country, setCountry] = useState("All");
  const [isGrid, setIsGrid] = useState(true);

  useEffect(() => { if (globalSearch) setQ(globalSearch); }, [globalSearch]);

  const filtered = useMemo(() =>
    campaigns.filter(c => {
      const mq  = !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.country.toLowerCase().includes(q.toLowerCase()) || c.category.toLowerCase().includes(q.toLowerCase());
      const mc  = cat === "All" || c.category === cat;
      const mco = country === "All" || c.country === country;
      return mq && mc && mco;
    }),
  [campaigns, q, cat, country]);

  return (
    <>
      <DocsCallout page="explore" />
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 340 }}>
          <Icon name="explore" size={14} />
          <input placeholder="Search campaigns…" value={q} onChange={e => setQ(e.target.value)} />
          {q && <button onClick={() => setQ("")}>×</button>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`filter-btn${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <select value={country} onChange={e => setCountry(e.target.value)}
          style={{ padding: "7px 12px", border: "1px solid var(--border2)", borderRadius: 8, fontFamily: "var(--sans)", fontSize: 12, background: "white", color: "var(--ink)", cursor: "pointer" }}>
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="view-toggle">
          <button className={`vt-btn${isGrid ? " active" : ""}`} onClick={() => setIsGrid(true)} title="Grid"><Icon name="grid" size={14} /></button>
          <button className={`vt-btn${!isGrid ? " active" : ""}`} onClick={() => setIsGrid(false)} title="List"><Icon name="list" size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "1rem 0", color: "var(--ink3)", fontSize: 13 }}>
          <Spinner size={14} /> Loading campaigns from Sepolia…
        </div>
      ) : (
        <div style={{ marginBottom: ".75rem", fontSize: 12, color: "var(--ink3)" }}>
          {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}{q || cat !== "All" || country !== "All" ? " found" : " active"}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--ink3)", fontSize: 13 }}>
          {campaigns.length === 0 ? "No campaigns on-chain yet." : "No campaigns match your filters."}
        </div>
      )}

      {isGrid ? (
        <div className="proj-grid">
          {filtered.map(c => (
            <ExploreCard key={c.id} campaign={c} onClick={() => onProject(c)} onFund={onFund} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="proj-list">
          {filtered.map(c => (
            <ExploreListItem key={c.id} campaign={c} onClick={() => onProject(c)} onFund={onFund} wallet={wallet} />
          ))}
        </div>
      )}
      <div style={{ height: "1.5rem" }} />
    </>
  );
}

function ExploreCard({ campaign: c, onClick, onFund, wallet }) {
  return (
    <div className="proj-card">
      <div className="proj-card-img" onClick={onClick} style={{ cursor: "pointer" }}>
        <img src={c.imageURI} alt={c.title} loading="lazy" />
      </div>
      <div className="proj-card-body">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: ".5rem" }}>
          <Badge type={c.goalMet ? "funded" : "live"}>{c.goalMet ? "Goal Met" : "Live"}</Badge>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border2)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{c.category}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border2)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{c.country}</span>
        </div>
        <div onClick={onClick} style={{ cursor: "pointer", fontFamily: "var(--display)", fontSize: ".88rem", fontWeight: 700, lineHeight: 1.3, marginBottom: ".35rem" }}>{c.title}</div>
        <ProgBar pct={c.pct} />
        <div style={{ display: "flex", justifyContent: "space-between", margin: ".5rem 0 .75rem", fontSize: 12 }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700 }}>{c.pct}% funded</span>
          <span style={{ color: "var(--ink3)" }}>{c.daysLeft > 0 ? `${c.daysLeft}d left` : "Ended"}</span>
        </div>
        <button className="btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}
          onClick={() => onFund(c)} disabled={c.daysLeft === 0}>
          {c.daysLeft === 0 ? "Campaign ended" : wallet ? "Back this project" : "Connect wallet to back"}
        </button>
      </div>
    </div>
  );
}

function ExploreListItem({ campaign: c, onClick, onFund, wallet }) {
  return (
    <div className="proj-list-item">
      <img src={c.imageURI} alt={c.title} className="proj-list-thumb" onClick={onClick} style={{ cursor: "pointer" }} />
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onClick}>
        <div style={{ fontFamily: "var(--display)", fontSize: ".88rem", fontWeight: 700, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
        <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 4 }}>{c.category} · {c.country}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}><ProgBar pct={c.pct} /></div>
          <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{c.pct}%</span>
        </div>
      </div>
      <button className="btn-primary btn-sm" onClick={() => onFund(c)} disabled={c.daysLeft === 0}>Back</button>
    </div>
  );
}

// ── DETAIL PAGE ───────────────────────────────────────────────────
export function DetailPage({ campaign: c, onBack, onFund, onConnect, wallet, getMilestones, getMyPledge, castVote, txPending, addNotif }) {
  const [milestones, setMilestones] = useState(c.milestones || []);
  const [myPledge, setMyPledge]     = useState(null);
  const [voted, setVoted]           = useState({});

  useEffect(() => {
    if (getMilestones) getMilestones(c.id, c.milestoneCount).then(setMilestones);
    if (getMyPledge && wallet) getMyPledge(c.id, wallet).then(setMyPledge);
  }, [c.id, wallet]);

  const handleVote = async (milestoneIndex, support) => {
    if (!wallet) { onConnect(); return; }
    try {
      await castVote(c.id, support);
      setVoted(v => ({ ...v, [milestoneIndex]: support ? "yes" : "no" }));
      addNotif(`Vote cast on ${c.title} — Milestone ${milestoneIndex + 1}`, "success");
    } catch (e) {
      addNotif(e.message?.includes("user rejected") ? "Vote rejected." : "Vote failed: " + e.message, "error");
    }
  };

  const handleFund = () => {
    if (!wallet) { onConnect(); return; }
    onFund(c);
  };

  return (
    <>
      {/* Back button */}
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--ink3)", fontSize: 13, fontWeight: 600, marginBottom: "1.25rem", padding: 0, WebkitTapHighlightColor: "transparent" }}>
        <Icon name="back" size={14} /> Back to Explore
      </button>

      {/* Hero image */}
      <div style={{ height: 220, borderRadius: "var(--r)", overflow: "hidden", marginBottom: "1.5rem", background: "var(--surface)" }}>
        <img src={c.imageURI} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>

      {/* Badges + title */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: ".75rem" }}>
        <Badge type={c.goalMet ? "funded" : "live"}>{c.goalMet ? "Goal Met" : "Live"}</Badge>
        <Badge type="draft">{c.category}</Badge>
        <Badge type="draft">{c.country}</Badge>
      </div>
      <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(1.2rem, 4vw, 1.5rem)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: ".75rem" }}>{c.title}</h1>
      <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: "1.25rem" }}>
        By <strong style={{ color: "var(--ink)" }}>{short(c.creator)}</strong>
      </div>

      {/* Mobile fund box — shown above milestones on mobile */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{c.pct}%</div>
            <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2 }}>of {c.goalEth} ETH goal</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700 }}>{c.daysLeft}d</div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>remaining</div>
          </div>
        </div>
        <ProgBar pct={c.pct} />
        <div style={{ marginTop: ".75rem", marginBottom: myPledge && parseFloat(myPledge) > 0 ? ".75rem" : "1rem", fontSize: 12, color: "var(--ink3)" }}>
          {c.raisedEth?.toFixed(4)} ETH raised
        </div>
        {myPledge && parseFloat(myPledge) > 0 && (
          <div style={{ background: "#DCFCE7", borderRadius: 8, padding: "8px 12px", marginBottom: ".875rem", fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
            ✓ You pledged {parseFloat(myPledge).toFixed(4)} ETH
          </div>
        )}
        <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}
          onClick={handleFund} disabled={c.daysLeft === 0}>
          {c.daysLeft === 0 ? "Campaign ended" : wallet ? "Back this project" : "Connect wallet to back"}
        </button>
        {!wallet && (
          <p style={{ fontSize: 11, color: "var(--ink3)", marginTop: ".625rem", textAlign: "center" }}>
            <a href="https://docs.decentcrowd.cc" target="_blank" rel="noopener" style={{ color: "var(--ink)", fontWeight: 600 }}>
              How to connect your wallet →
            </a>
          </p>
        )}
        <div style={{ marginTop: ".875rem", paddingTop: ".875rem", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--ink3)", lineHeight: 1.7 }}>
          Milestone-based escrow · DAO-verified releases · 2.5% platform fee
        </div>
      </div>

      <DocsCallout page="fund" />

      {/* Milestones */}
      <div className="section-title" style={{ marginBottom: "1rem" }}>Milestones</div>
      {milestones.map((m, i) => {
        const isActive   = i === c.nextMilestone && c.goalMet;
        const voteOpen   = m.voteDeadline > 0 && Date.now() / 1000 < m.voteDeadline;
        const hoursLeft  = voteOpen ? Math.max(0, Math.ceil((m.voteDeadline - Date.now() / 1000) / 3600)) : 0;

        return (
          <div key={i} style={{
            border: `1px solid ${m.released ? "var(--green)" : isActive ? "var(--ink)" : "var(--border)"}`,
            borderRadius: "var(--r)", padding: "1rem 1.25rem", marginBottom: ".75rem",
            background: m.released ? "#F0FDF4" : "var(--white)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: ".5rem" }}>
              <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>Milestone {i + 1}: {m.description}</div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {m.released && <Badge type="funded">Released</Badge>}
                {m.approved && !m.released && <Badge type="pending">Approved</Badge>}
                {voteOpen && <Badge type="live">Voting</Badge>}
                {!m.approved && !voteOpen && !m.released && <Badge type="draft">Pending</Badge>}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink3)" }}>
              {m.releasePercent}% of raise · {voteOpen ? `${hoursLeft}h left to vote` : m.released ? "Funds released" : "Awaiting DAO vote"}
            </div>

            {voteOpen && !voted[i] && (
              <div style={{ display: "flex", gap: 8, marginTop: ".875rem" }}>
                {wallet ? (
                  <>
                    <button className="btn-primary btn-sm" style={{ background: "var(--green)" }} onClick={() => handleVote(i, true)} disabled={txPending}>
                      <Icon name="check" size={12} /> Approve
                    </button>
                    <button className="btn-secondary btn-sm" style={{ color: "var(--red)", borderColor: "var(--red)" }} onClick={() => handleVote(i, false)} disabled={txPending}>
                      Reject
                    </button>
                  </>
                ) : (
                  <button className="btn-secondary btn-sm" onClick={onConnect}>Connect wallet to vote</button>
                )}
              </div>
            )}
            {voted[i] && (
              <div style={{ fontSize: 12, color: "var(--green)", marginTop: ".5rem", fontWeight: 600 }}>
                ✓ You voted {voted[i] === "yes" ? "Approve" : "Reject"}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
