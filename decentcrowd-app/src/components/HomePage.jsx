import { Icon, ProgBar, Badge, DocsCallout } from "./UI";

function pct(c) { return c.pct ?? 0; }

function SkeletonCard() {
  return (
    <div className="proj-card" style={{ pointerEvents: "none" }}>
      <div style={{ height: 140, background: "var(--border)", animation: "shimmer 1.5s infinite" }} />
      <div className="proj-card-body">
        <div style={{ height: 18, width: "40%", background: "var(--border)", borderRadius: 4, marginBottom: 10, animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: 14, width: "90%", background: "var(--border)", borderRadius: 4, marginBottom: 6, animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: 14, width: "70%", background: "var(--border)", borderRadius: 4, marginBottom: 14, animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 8 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 12, width: "25%", background: "var(--border)", borderRadius: 4 }} />
          <div style={{ height: 12, width: "35%", background: "var(--border)", borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="stat-card">
      <div style={{ height: 32, width: "50%", background: "var(--border)", borderRadius: 4, marginBottom: 8, animation: "shimmer 1.5s infinite" }} />
      <div style={{ height: 12, width: "70%", background: "var(--border)", borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
    </div>
  );
}

function ProjCard({ campaign: c, onClick }) {
  const pc = pct(c);
  return (
    <div className="proj-card" onClick={() => onClick(c)}>
      <div className="proj-card-img">
        <img src={c.imageURI} alt={c.title} loading="lazy" />
      </div>
      <div className="proj-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
          <Badge type={c.goalMet ? "funded" : "live"}>{c.goalMet ? "Goal Met" : "Live"}</Badge>
          <span style={{ fontSize: 10, color: "var(--ink3)", fontWeight: 600 }}>
            {c.daysLeft > 0 ? `${c.daysLeft}d left` : "Ended"}
          </span>
        </div>
        <div style={{ fontFamily: "var(--display)", fontSize: ".88rem", fontWeight: 700, lineHeight: 1.3, marginBottom: ".35rem" }}>{c.title}</div>
        <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: ".75rem" }}>{c.category} · {c.country}</div>
        <ProgBar pct={pc} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".5rem", fontSize: 12 }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700 }}>{pc}%</span>
          <span style={{ color: "var(--ink3)" }}>{c.raisedEth?.toFixed(4)} / {c.goalEth} ETH</span>
        </div>
      </div>
    </div>
  );
}

export function BackerHome({ campaigns, onProject, wallet, loading }) {
  const funded = campaigns.filter(c => c.pct >= 50).slice(0, 4);
  const total  = campaigns.reduce((s, c) => s + (c.raisedEth || 0), 0);

  return (
    <>
      <DocsCallout page="home" />
      <div className="stat-grid">
        {loading ? [1,2,3,4].map(i => <SkeletonStat key={i} />) : (
          <>
            <div className="stat-card"><div className="stat-num">{funded.length}</div><div className="stat-label">Projects backed</div></div>
            <div className="stat-card"><div className="stat-num">—</div><div className="stat-label">ETH pledged</div></div>
            <div className="stat-card"><div className="stat-num">{campaigns.length}</div><div className="stat-label">Active campaigns</div></div>
            <div className="stat-card"><div className="stat-num">{total.toFixed(3)}</div><div className="stat-label">Total ETH raised</div></div>
          </>
        )}
      </div>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div className="section-title">Active campaigns</div>
      </div>
      {loading && <div className="proj-grid">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>}
      {!loading && funded.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: ".95rem", fontWeight: 700, marginBottom: ".5rem" }}>No campaigns loaded yet</div>
          <div style={{ fontSize: 13, color: "var(--ink3)" }}>Loading from Sepolia. This takes a few seconds on first visit.</div>
        </div>
      )}
      {!loading && funded.length > 0 && (
        <div className="proj-grid">
          {funded.map(c => <ProjCard key={c.id} campaign={c} onClick={onProject} />)}
        </div>
      )}
    </>
  );
}

export function CreatorHome({ campaigns, onProject, onNewCampaign, isGrid, loading }) {
  return (
    <>
      <DocsCallout page="create" />
      <div className="stat-grid">
        {loading ? [1,2,3,4].map(i => <SkeletonStat key={i} />) : (
          <>
            <div className="stat-card"><div className="stat-num">{campaigns.length}</div><div className="stat-label">Total campaigns</div></div>
            <div className="stat-card"><div className="stat-num">{campaigns.reduce((s,c)=>s+(c.raisedEth||0),0).toFixed(3)}</div><div className="stat-label">ETH raised</div></div>
            <div className="stat-card"><div className="stat-num">{campaigns.filter(c => c.goalMet).length}</div><div className="stat-label">Goals met</div></div>
            <div className="stat-card"><div className="stat-num">—</div><div className="stat-label">Total backers</div></div>
          </>
        )}
      </div>
      {loading && <div className="proj-grid">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>}
      {!loading && campaigns.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: ".95rem", fontWeight: 700, marginBottom: ".5rem" }}>No campaigns yet</div>
          <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: "1.25rem" }}>Create your first campaign to get started.</div>
          <button className="btn-primary" onClick={onNewCampaign}><Icon name="plus" size={14} /> New Campaign</button>
        </div>
      )}
      {!loading && campaigns.length > 0 && (
        isGrid ? (
          <div className="proj-grid">
            {campaigns.map(c => <ProjCard key={c.id} campaign={c} onClick={onProject} />)}
          </div>
        ) : (
          <div className="proj-list">
            {campaigns.map(c => {
              const pc = pct(c);
              return (
                <div key={c.id} className="proj-list-item" onClick={() => onProject(c)}>
                  <img src={c.imageURI} alt={c.title} className="proj-list-thumb" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                      <div style={{ fontFamily: "var(--display)", fontSize: ".85rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{c.title}</div>
                      <Badge type={c.goalMet ? "funded" : "live"}>{c.goalMet ? "Goal Met" : "Live"}</Badge>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}><ProgBar pct={pc} /></div>
                      <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{pc}%</span>
                      <span style={{ fontSize: 11, color: "var(--ink3)", flexShrink: 0 }}>{c.raisedEth?.toFixed(3)} ETH</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </>
  );
}
