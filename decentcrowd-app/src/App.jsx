import { useState, useRef, useEffect, useCallback } from "react";
import { Icon, short, timeAgo } from "./components/UI";
import { useWallet } from "./hooks/useWallet";
import { appKit } from "./lib/walletConfig";
import { useContract } from "./hooks/useContract";
import { FaucetModal, FundModal, CreateModal } from "./components/Modals";
import { BackerHome, CreatorHome } from "./components/HomePage";
import { ExplorePage, DetailPage } from "./components/ExplorePage";
import { DAOPage, WalletPage, ProfilePage, LeaderboardPage } from "./components/Pages";

export default function App() {
  const wallet   = useWallet();
  const contract = useContract(wallet.signer);

  const [page, setPage]             = useState("home");
  const [mode, setMode]             = useState("backer");
  const [detail, setDetail]         = useState(null);
  const [isGrid, setIsGrid]         = useState(true);
  const [searchQ, setSearchQ]       = useState("");
  const [showFaucet, setShowFaucet] = useState(false);
  const [showFund, setShowFund]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotif, setShowNotif]   = useState(false);
  const [showWMenu, setShowWMenu]   = useState(false);
  const [toast, setToast]           = useState("");
  const [toastVis, setToastVis]     = useState(false);

  const notifRef   = useRef();
  const wmenuRef   = useRef();
  const contentRef = useRef();

  const showToast = useCallback((msg) => {
    setToast(msg); setToastVis(true);
    setTimeout(() => setToastVis(false), 2800);
  }, []);

  useEffect(() => {
    if (contract.notifications.length > 0) {
      const n = contract.notifications[0];
      if (!n.read) showToast(n.message);
    }
  }, [contract.notifications]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (wmenuRef.current && !wmenuRef.current.contains(e.target)) setShowWMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const scrollToTop = () => { if (contentRef.current) contentRef.current.scrollTop = 0; };
  const goTo = (p) => { setPage(p); setDetail(null); setSearchQ(""); scrollToTop(); };
  const openProject = (c) => { setDetail(c); setPage("explore"); scrollToTop(); };

  // Context flags
  const isDetail   = page === "explore" && !!detail;
  const isHome     = page === "home";
  const isExplore  = page === "explore" && !detail;
  const isMobile   = typeof window !== "undefined" && window.innerWidth <= 768;

  const PAGE_TITLES = {
    home:        mode === "backer" ? "Dashboard" : "My Campaigns",
    explore:     isDetail ? "" : "Explore",
    dao:         "DAO",
    wallet:      "Wallet",
    profile:     "Profile",
    leaderboard: "Leaderboard",
  };

  const unread = contract.notifications.filter(n => !n.read).length;

  return (
    <div className="app-shell" onClick={() => { setShowNotif(false); setShowWMenu(false); }}>

      {/* ── SIDEBAR (desktop only) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo"><span>DC</span></div>
        {[
          { id: "home",        icon: "home",        label: "Home" },
          { id: "explore",     icon: "explore",     label: "Explore" },
          { id: "dao",         icon: "dao",         label: "DAO" },
          { id: "wallet",      icon: "wallet",      label: "Wallet" },
          { id: "leaderboard", icon: "leaderboard", label: "Leaderboard" },
          { id: "profile",     icon: "profile",     label: "Profile" },
        ].map(item => (
          <button key={item.id} className={`nav-item${page === item.id ? " active" : ""}`} onClick={() => goTo(item.id)}>
            <Icon name={item.icon} size={18} />
            <span className="nav-tooltip">{item.label}</span>
          </button>
        ))}
        <div style={{ marginTop: "auto", marginBottom: "1rem", width: "100%" }}>
          <button className="nav-item" onClick={() => wallet.address ? setShowCreate(true) : appKit.open()}>
            <Icon name="plus" size={20} />
            <span className="nav-tooltip">New Campaign</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-area">

        {/* ── TOPBAR ── */}
        <header className="topbar">

          {/* LEFT: back button on detail, else title + home-only toggles */}
          <div className="topbar-left">
            {isDetail ? (
              <button className="topbar-back" onClick={() => setDetail(null)}>
                <Icon name="back" size={16} />
                <span>Explore</span>
              </button>
            ) : (
              <>
                <div className="page-title">{PAGE_TITLES[page]}</div>
                {/* Mode toggle — home only, hidden on mobile when detail */}
                {isHome && (
                  <div className="mode-toggle">
                    <button className={`mode-btn${mode === "backer" ? " active" : ""}`} onClick={() => setMode("backer")}>Backer</button>
                    <button className={`mode-btn${mode === "creator" ? " active" : ""}`} onClick={() => setMode("creator")}>Creator</button>
                  </div>
                )}
                {/* Grid toggle — creator home only, desktop only */}
                {isHome && mode === "creator" && (
                  <div className="view-toggle hide-mobile">
                    <button className={`vt-btn${isGrid ? " active" : ""}`} onClick={() => setIsGrid(true)}><Icon name="grid" size={13}/></button>
                    <button className={`vt-btn${!isGrid ? " active" : ""}`} onClick={() => setIsGrid(false)}><Icon name="list" size={13}/></button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT: minimal set, context-aware */}
          <div className="topbar-right">
            {/* Search — hidden on detail page and mobile */}
            {!isDetail && (
              <div className="search-bar hide-mobile-sm">
                <Icon name="explore" size={14} />
                <input
                  placeholder="Search…"
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); if (e.target.value) { setPage("explore"); setDetail(null); } }}
                  onFocus={() => { if (!isExplore) { setPage("explore"); setDetail(null); } }}
                />
                {searchQ && <button onClick={e => { e.stopPropagation(); setSearchQ(""); }}>×</button>}
              </div>
            )}

            {/* Bell — always visible */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button className="icon-btn" onClick={e => { e.stopPropagation(); setShowNotif(n => !n); setShowWMenu(false); }}>
                <Icon name="bell" size={15} />
                {unread > 0 && <span className="notif-badge" />}
              </button>
              {showNotif && (
                <div className="dropdown notif-panel" onClick={e => e.stopPropagation()}>
                  <div className="notif-head">
                    <span className="notif-head-title">Notifications</span>
                    <button onClick={() => setShowNotif(false)}>×</button>
                  </div>
                  {contract.notifications.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", fontSize: 12, color: "var(--ink3)" }}>
                      No notifications yet.
                    </div>
                  ) : (
                    contract.notifications.slice(0, 8).map(n => (
                      <div key={n.id} className="notif-item">
                        <div className={`notif-dot-sm ${n.read ? "read" : "unread"}`} />
                        <div>
                          <div className="notif-msg">{n.message}</div>
                          <div className="notif-time">{timeAgo(n.time)}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="notif-footer">
                    <button onClick={() => { contract.markAllRead(); setShowNotif(false); }}>Mark all read</button>
                  </div>
                </div>
              )}
            </div>

            {/* Wallet chip or connect — always visible */}
            {wallet.address ? (
              <div ref={wmenuRef} style={{ position: "relative" }}>
                <button className="wallet-chip" onClick={e => { e.stopPropagation(); setShowWMenu(m => !m); setShowNotif(false); }}>
                  <span className="wdot" />
                  <span className="wallet-addr-short">{short(wallet.address)}</span>
                  <Icon name="chevdown" size={10} />
                </button>
                {showWMenu && (
                  <div className="dropdown wallet-menu" onClick={e => e.stopPropagation()}>
                    <div className="wallet-menu-addr">
                      <div className="label">Connected · Sepolia</div>
                      <div className="addr">{wallet.address}</div>
                      {wallet.balance && <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>{parseFloat(wallet.balance).toFixed(4)} ETH</div>}
                    </div>
                    <div className="wallet-menu-items">
                      <button className="wallet-menu-item" onClick={() => { goTo("wallet"); setShowWMenu(false); }}><Icon name="wallet" size={14} /> My Wallet</button>
                      <button className="wallet-menu-item" onClick={() => { setShowFaucet(true); setShowWMenu(false); }}><Icon name="faucet" size={14} /> Get Test ETH</button>
                      <button className="wallet-menu-item" onClick={() => {
                          const addr = wallet.address;
                          const done = () => { showToast("Address copied!"); setShowWMenu(false); };
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(addr).then(done).catch(() => {
                              const el = document.createElement("textarea");
                              el.value = addr; el.style.cssText = "position:fixed;opacity:0;";
                              document.body.appendChild(el); el.focus(); el.setSelectionRange(0, addr.length);
                              try { document.execCommand("copy"); done(); } catch {}
                              document.body.removeChild(el);
                            });
                          } else {
                            const el = document.createElement("textarea");
                            el.value = addr; el.style.cssText = "position:fixed;opacity:0;";
                            document.body.appendChild(el); el.focus(); el.setSelectionRange(0, addr.length);
                            try { document.execCommand("copy"); done(); } catch {}
                            document.body.removeChild(el);
                          }
                        }}><Icon name="copy" size={14} /> Copy Address</button>
                      <button className="wallet-menu-item danger" onClick={() => { wallet.disconnect(); showToast("Wallet disconnected."); setShowWMenu(false); }}><Icon name="logout" size={14} /> Disconnect</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="connect-btn" onClick={() => appKit.open()} disabled={wallet.connecting}>
                {wallet.connecting ? "Connecting…" : "Connect"}
              </button>
            )}
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="content" ref={contentRef}>

          {/* Wrong chain warning */}
          {wallet.address && !wallet.isCorrectChain && (
            <div className="chain-warn">
              <span>⚠️ Switch to Sepolia to use DecentCrowd</span>
              <button className="btn-primary btn-sm" style={{ background: "#D97706", flexShrink: 0 }} onClick={wallet.switchToSepolia}>Switch Network</button>
            </div>
          )}

          {/* Welcome banner — not connected, home page */}
          {!wallet.address && isHome && (
            <div className="welcome-banner">
              <div>
                <div style={{ fontFamily: "var(--display)", fontSize: ".9rem", fontWeight: 700, marginBottom: 3 }}>Welcome to DecentCrowd</div>
                <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
                  Connect your wallet to explore and back campaigns on Sepolia.{" "}
                  <a href="https://docs.decentcrowd.cc" target="_blank" rel="noopener" style={{ color: "var(--ink)", fontWeight: 600 }}>Read the guide →</a>
                </div>
              </div>
              <button className="btn-primary btn-sm" onClick={() => appKit.open()} style={{ flexShrink: 0 }}>Connect</button>
            </div>
          )}

          {/* HOME */}
          {isHome && mode === "backer" && <BackerHome campaigns={contract.campaigns} onProject={openProject} wallet={wallet.address} loading={contract.loading} />}
          {isHome && mode === "creator" && <CreatorHome campaigns={contract.campaigns} onProject={openProject} onNewCampaign={() => wallet.address ? setShowCreate(true) : appKit.open()} isGrid={isGrid} loading={contract.loading} />}

          {/* EXPLORE */}
          {isExplore && (
            <ExplorePage campaigns={contract.campaigns} onProject={openProject}
              onFund={c => wallet.address ? setShowFund(c) : appKit.open()}
              wallet={wallet.address} globalSearch={searchQ} loading={contract.loading} />
          )}

          {/* DETAIL */}
          {isDetail && (
            <DetailPage campaign={detail} onBack={() => { setDetail(null); scrollToTop(); }}
              onFund={c => wallet.address ? setShowFund(c) : appKit.open()}
              onConnect={() => appKit.open()}
              wallet={wallet.address}
              getMilestones={contract.getMilestones} getMyPledge={contract.getMyPledge}
              castVote={contract.castVote} txPending={contract.txPending} addNotif={contract.addNotif} />
          )}

          {/* OTHER PAGES */}
          {page === "dao"         && <DAOPage campaigns={contract.campaigns} wallet={wallet.address} castVote={contract.castVote} txPending={contract.txPending} addNotif={contract.addNotif} />}
          {page === "wallet"      && <WalletPage wallet={wallet.address} balance={wallet.balance} campaigns={contract.campaigns} onFaucet={() => setShowFaucet(true)} onConnect={() => appKit.open()} />}
          {page === "profile"     && <ProfilePage address={wallet.address} balance={wallet.balance} campaigns={contract.campaigns} onDisconnect={() => { wallet.disconnect(); showToast("Wallet disconnected."); }} onFaucet={() => setShowFaucet(true)} />}
          {page === "leaderboard" && <LeaderboardPage address={wallet.address} />}
        </main>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        <button className={`bn-item${page === "home" ? " active" : ""}`} onClick={() => goTo("home")}>
          <Icon name="home" size={20} /><span>Home</span>
        </button>
        <button className={`bn-item${page === "explore" ? " active" : ""}`} onClick={() => goTo("explore")}>
          <Icon name="explore" size={20} /><span>Explore</span>
        </button>
        <button className="bn-fab" onClick={() => wallet.address ? setShowCreate(true) : appKit.open()}>
          <Icon name="plus" size={22} />
        </button>
        <button className={`bn-item${page === "dao" ? " active" : ""}`} onClick={() => goTo("dao")}>
          <Icon name="dao" size={20} /><span>DAO</span>
        </button>
        <button className={`bn-item${page === "profile" ? " active" : ""}`} onClick={() => goTo("profile")}>
          <Icon name="profile" size={20} /><span>Profile</span>
        </button>
      </nav>

      {/* ── MODALS ── */}
      {showFaucet && <FaucetModal onClose={() => setShowFaucet(false)} address={wallet.address} />}
      {showFund && <FundModal campaign={showFund} wallet={wallet.address} onClose={() => setShowFund(null)} onPledge={contract.pledge} txPending={contract.txPending} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={contract.createCampaign} txPending={contract.txPending} wallet={wallet.address} />}

      <div className={`toast${toastVis ? "" : " hidden"}`}>{toast}</div>
    </div>
  );
}
