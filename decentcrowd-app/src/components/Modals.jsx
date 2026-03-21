import { useState, useEffect, useRef } from "react";
import { Icon, Spinner, short } from "./UI";
import { EXPLORER } from "../lib/contract";

// ── WALLET CONNECT MODAL ──────────────────────────────────────────
export function FaucetModal({ onClose, address }) {
  const faucets = [
    {
      name:   "Google Cloud Faucet",
      url:    "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
      amount: "0.05 ETH / day",
      note:   "No account or mainnet balance required",
      badge:  "Recommended",
    },
    {
      name:   "Alchemy Sepolia Faucet",
      url:    "https://www.alchemy.com/faucets/ethereum-sepolia",
      amount: "0.5 ETH / day",
      note:   "Free Alchemy account — no mainnet balance needed",
      badge:  "Most generous",
    },
    {
      name:   "Infura Sepolia Faucet",
      url:    "https://www.infura.io/faucet/sepolia",
      amount: "0.5 ETH / day",
      note:   "Free Infura account — no mainnet balance needed",
      badge:  null,
    },
    {
      name:   "QuickNode Faucet",
      url:    "https://faucet.quicknode.com/ethereum/sepolia",
      amount: "0.1 ETH / day",
      note:   "No account required — no mainnet balance needed",
      badge:  null,
    },
  ];

  const [copied, setCopied] = useState(false);
  const addrRef = useRef(null);

  // Core copy function — works on iOS, Android, desktop
  const copyAddress = () => {
    if (!address) return;

    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    };

    // Method 1: Modern Clipboard API (Chrome, Firefox, Android Chrome)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address)
        .then(markCopied)
        .catch(() => legacyCopy(markCopied));
      return;
    }

    // Method 2: Legacy execCommand (iOS Safari, older browsers)
    legacyCopy(markCopied);
  };

  const legacyCopy = (onSuccess) => {
    if (!addrRef.current) return;
    addrRef.current.value = address;
    addrRef.current.style.display = "block";
    addrRef.current.focus();
    addrRef.current.setSelectionRange(0, address.length);
    try {
      document.execCommand("copy");
      onSuccess();
    } catch (e) {
      console.warn("Copy failed:", e);
    }
    addrRef.current.style.display = "none";
  };

  // Auto-copy on mount — triggered by a programmatic click on the copy button
  // We defer it slightly so the modal is fully mounted first
  useEffect(() => {
    if (!address) return;
    const t = setTimeout(() => copyAddress(), 300);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Hidden textarea for iOS execCommand copy */}
      <textarea
        ref={addrRef}
        readOnly
        defaultValue={address}
        style={{ display: "none", position: "fixed", top: -9999, left: -9999, opacity: 0 }}
      />
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <div className="modal-title">Get Free Test ETH</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">

          {/* Address block */}
          {address ? (
            <button
              onClick={copyAddress}
              style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: copied ? "#DCFCE7" : "var(--bg)",
                border: `1px solid ${copied ? "var(--green)" : "var(--border)"}`,
                borderRadius: 10, padding: "12px 14px", marginBottom: "1rem",
                transition: "all .2s", fontFamily: "var(--sans)",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: copied ? "var(--green)" : "var(--ink3)" }}>
                  {copied ? "✓ Address copied to clipboard!" : "Tap to copy your wallet address"}
                </div>
                <Icon name="copy" size={13} />
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", color: "var(--ink)", lineHeight: 1.6 }}>
                {address}
              </div>
            </button>
          ) : (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: "1rem", fontSize: 12, color: "var(--red)" }}>
              Connect your wallet first to see your address.
            </div>
          )}

          <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: "1rem", lineHeight: 1.7 }}>
            {copied
              ? "Address copied! Now open a faucet below and paste it in."
              : "Your address is copied automatically. Open any faucet below, paste it in, and receive free Sepolia ETH. No real funds needed."}
          </p>

          {faucets.map(f => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener"
              style={{ display: "block", textDecoration: "none", marginBottom: ".625rem" }}>
              <div
                style={{ border: "1px solid var(--border)", borderRadius: 10, padding: ".875rem 1rem", transition: "border-color .15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--ink)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{f.name}</span>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    {f.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", background: "#DCFCE7", padding: "2px 7px", borderRadius: 4 }}>{f.badge}</span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink2)", background: "var(--bg)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border)" }}>{f.amount}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink3)" }}>{f.note}</div>
              </div>
            </a>
          ))}

          <p style={{ fontSize: 11, color: "var(--ink3)", marginTop: ".75rem", lineHeight: 1.7, textAlign: "center" }}>
            Need help? <a href="https://docs.decentcrowd.cc" target="_blank" rel="noopener" style={{ color: "var(--ink)", fontWeight: 600 }}>Read the guide →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── FUND MODAL ────────────────────────────────────────────────────
export function FundModal({ campaign, wallet, onClose, onPledge, txPending }) {
  const AMTS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5];
  const [amt, setAmt]       = useState(0.05);
  const [custom, setCustom] = useState("");
  const [step, setStep]     = useState("choose"); // choose | confirm | done
  const [txHash, setTxHash] = useState(null);
  const [err, setErr]       = useState(null);

  const total = custom ? parseFloat(custom) : amt;
  const fee   = +(total * 0.025).toFixed(6);
  const net   = +(total - fee).toFixed(6);

  const handleFund = async () => {
    if (!wallet) return;
    setErr(null);
    setStep("confirm");
    try {
      const receipt = await onPledge(campaign.id, total);
      setTxHash(receipt.hash);
      setStep("done");
    } catch (e) {
      setStep("choose");
      if (e.message === "INSUFFICIENT_FUNDS" || e.message?.includes("insufficient funds")) {
        setErr("INSUFFICIENT_FUNDS");
      } else if (e.message === "USER_REJECTED" || e.message?.includes("user rejected")) {
        setErr("Transaction rejected in MetaMask.");
      } else {
        setErr(e.message || "Transaction failed. Please try again.");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div className="modal-title">{step === "done" ? "Pledge Confirmed!" : `Back This Project`}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* STEP: choose amount */}
          {step === "choose" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 8 }}>Campaign</div>
                <div style={{ fontFamily: "var(--display)", fontSize: ".9rem", fontWeight: 700 }}>{campaign.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3 }}>{campaign.pct}% funded · {campaign.daysLeft}d left</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 8 }}>Select amount (ETH)</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                  {AMTS.map(a => (
                    <button key={a}
                      onClick={() => { setAmt(a); setCustom(""); }}
                      style={{
                        padding: "9px 0", border: `1.5px solid ${!custom && amt === a ? "var(--ink)" : "var(--border)"}`,
                        borderRadius: 8, fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700,
                        background: !custom && amt === a ? "var(--ink)" : "white",
                        color: !custom && amt === a ? "white" : "var(--ink)",
                        cursor: "pointer", transition: "all .15s",
                      }}>
                      {a} ETH
                    </button>
                  ))}
                </div>
                <input
                  type="number" placeholder="Custom amount…" min="0.001" step="0.001"
                  value={custom} onChange={e => setCustom(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border2)", borderRadius: 8, fontFamily: "var(--sans)", fontSize: 13, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "var(--ink)"}
                  onBlur={e => e.target.style.borderColor = "var(--border2)"}
                />
              </div>
              <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 14px", marginBottom: "1.25rem", fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--ink3)" }}>
                  <span>Pledge amount</span><span style={{ fontWeight: 600, color: "var(--ink)" }}>{total} ETH</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--ink3)" }}>
                  <span>Platform fee (2.5%)</span><span>{fee} ETH</span>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>To escrow</span><span>{net} ETH</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
                Funds are held in escrow on Sepolia. Released only on DAO milestone approval.
                Full refund if the goal is not met. <a href="https://docs.decentcrowd.cc/escrow" target="_blank" rel="noopener" style={{ color: "var(--ink)", fontWeight: 600 }}>How it works →</a>
              </div>
              {err === "INSUFFICIENT_FUNDS" ? (
                <div style={{ marginBottom: "1rem", padding: "12px 14px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>Insufficient funds</div>
                  <div style={{ fontSize: 12, color: "#7F1D1D", marginBottom: 10, lineHeight: 1.6 }}>
                    Your wallet has 0 ETH. You need Sepolia test ETH to pledge. It's free.
                  </div>
                  <a href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" target="_blank" rel="noopener"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--ink)", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    Get free test ETH →
                  </a>
                </div>
              ) : err ? (
                <div style={{ color: "var(--red)", fontSize: 12, marginBottom: "1rem", padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>{err}</div>
              ) : null}
              {!wallet ? (
                <div style={{ textAlign: "center", padding: "1rem", background: "var(--bg)", borderRadius: 10, fontSize: 13, color: "var(--ink3)" }}>
                  Connect your wallet to pledge
                </div>
              ) : (
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleFund} disabled={txPending || !total || total <= 0}>
                  {txPending ? <><Spinner size={14} /> Waiting for wallet…</> : `Pledge ${total} ETH on Sepolia`}
                </button>
              )}
            </>
          )}

          {/* STEP: confirming */}
          {step === "confirm" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <Spinner size={40} />
              <div style={{ marginTop: "1.25rem", fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700 }}>Confirm in your wallet</div>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: ".5rem", lineHeight: 1.7 }}>
                Approve the transaction in your wallet app.<br />
                Your {total} ETH will be sent to the escrow contract.
              </div>
            </div>
          )}

          {/* STEP: done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "var(--green)" }}>
                <Icon name="check" size={28} />
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: ".5rem" }}>
                Pledge confirmed!
              </div>
              <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
                You pledged <strong>{total} ETH</strong> to {campaign.title}.<br />
                Funds are now held in escrow.
              </div>
              {txHash && (
                <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink3)", textDecoration: "none", marginBottom: "1.5rem" }}>
                  View transaction on Etherscan <Icon name="external" size={11} />
                </a>
              )}
              <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CREATE CAMPAIGN MODAL ─────────────────────────────────────────
export function CreateModal({ onClose, onCreate, txPending, wallet }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "", category: "Energy", country: "", imageURI: "",
    goalEth: "", durationDays: 30,
    m1desc: "", m1pct: 40,
    m2desc: "", m2pct: 35,
    m3desc: "", m3pct: 25,
  });
  const [err, setErr]   = useState(null);
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const totalPct = Number(form.m1pct) + Number(form.m2pct) + Number(form.m3pct);

  const handleCreate = async () => {
    setErr(null);
    if (totalPct !== 100) { setErr("Milestone percentages must sum to 100"); return; }
    try {
      const receipt = await onCreate({
        title: form.title,
        category: form.category,
        country: form.country,
        imageURI: form.imageURI || "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
        goalEth: form.goalEth,
        durationDays: Number(form.durationDays),
        milestoneDescriptions: [form.m1desc, form.m2desc, form.m3desc].filter(Boolean),
        milestonePercents: [form.m1desc && Number(form.m1pct), form.m2desc && Number(form.m2pct), form.m3desc && Number(form.m3pct)].filter(Boolean),
      });
      setTxHash(receipt.hash);
      setDone(true);
    } catch (e) {
      setErr(e.message?.includes("user rejected") ? "Transaction rejected." : e.message || "Failed to create campaign");
    }
  };

  if (done) return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div className="modal-title">Campaign Created!</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "var(--green)" }}>
            <Icon name="check" size={28} />
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: ".5rem" }}>{form.title}</div>
          <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
            Your campaign is live on Sepolia! Backers can now pledge ETH.<br />
            You'll submit milestone proofs via the DAO when each stage is complete.
          </div>
          {txHash && (
            <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink3)", marginBottom: "1.25rem" }}>
              View on Etherscan <Icon name="external" size={11} />
            </a>
          )}
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <div className="modal-title">New Campaign — Step {step} of 3</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Progress */}
          <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--ink)" : "var(--border)", transition: "background .3s" }} />
            ))}
          </div>

          {step === 1 && (
            <>
              <div className="field"><label>Campaign Title</label><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Lagos Solar Grid — Community Energy Access" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <div className="field">
                  <label>Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)}>
                    {["Energy","Agriculture","Health","Education","Arts","Water","Tech","Finance"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Country</label><input value={form.country} onChange={e => set("country", e.target.value)} placeholder="e.g. Nigeria" /></div>
              </div>
              <div className="field"><label>Image URL (optional)</label><input value={form.imageURI} onChange={e => set("imageURI", e.target.value)} placeholder="https://… or leave blank for default" /></div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <div className="field"><label>Funding Goal (ETH)</label><input type="number" min="0.01" step="0.01" value={form.goalEth} onChange={e => set("goalEth", e.target.value)} placeholder="0.5" /></div>
                <div className="field"><label>Duration (days)</label><input type="number" min="1" max="365" value={form.durationDays} onChange={e => set("durationDays", e.target.value)} /></div>
              </div>
              <div style={{ padding: "10px 14px", background: "var(--bg)", borderRadius: 8, fontSize: 12, color: "var(--ink3)", lineHeight: 1.7 }}>
                Funds are held in escrow. They release in tranches per approved milestone. 2.5% fee deducted on each release. <a href="https://docs.decentcrowd.cc/escrow" target="_blank" rel="noopener" style={{ color: "var(--ink)", fontWeight: 600 }}>Learn more →</a>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: "1rem", lineHeight: 1.7 }}>
                Define up to 3 milestones. Percentages must sum to 100. Backers vote to release each tranche.
              </p>
              {[["m1", "Milestone 1"], ["m2", "Milestone 2"], ["m3", "Milestone 3 (optional)"]].map(([k, label]) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: ".75rem", marginBottom: ".75rem" }}>
                  <div className="field" style={{ margin: 0 }}><label>{label}</label><input value={form[`${k}desc`]} onChange={e => set(`${k}desc`, e.target.value)} placeholder="What will you achieve?" /></div>
                  <div className="field" style={{ margin: 0 }}><label>%</label><input type="number" min="1" max="100" value={form[`${k}pct`]} onChange={e => set(`${k}pct`, e.target.value)} /></div>
                </div>
              ))}
              <div style={{ fontSize: 12, color: totalPct === 100 ? "var(--green)" : "var(--red)", fontWeight: 700, textAlign: "right", marginBottom: "1rem" }}>
                Total: {totalPct}% {totalPct === 100 ? "✓" : "(must equal 100)"}
              </div>
              {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: "1rem", padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>{err}</div>}
            </>
          )}
        </div>
        <div className="modal-foot">
          {step > 1 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>}
          {step < 3 && <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.title}>Next</button>}
          {step === 3 && (
            <button className="btn-primary" onClick={handleCreate} disabled={txPending || totalPct !== 100 || !wallet}>
              {txPending ? <><Spinner size={14} /> Creating on-chain…</> : "Deploy Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
