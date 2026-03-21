import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI, RPC_URLS } from "../lib/contract";

// ── Retry a read using multiple RPCs ─────────────────────────────
async function withRetry(fn, maxAttempts = RPC_URLS.length) {
  let lastErr;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const url      = RPC_URLS[i % RPC_URLS.length];
      const provider = new ethers.JsonRpcProvider(url);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      return await fn(contract, provider);
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

// ── Poll receipt via our RPC — avoids MetaMask/Infura rate limits ─
async function waitForTx(txHash, maxMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    for (const url of RPC_URLS) {
      try {
        const provider = new ethers.JsonRpcProvider(url);
        const receipt  = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.blockNumber) {
          if (receipt.status === 0) throw new Error("Transaction reverted on-chain.");
          return receipt;
        }
        break; // RPC worked, tx not mined yet
      } catch (e) {
        if (e.message === "Transaction reverted on-chain.") throw e;
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Transaction not confirmed after 2 minutes. Check Etherscan.");
}

function parseCampaign(raw, id) {
  return {
    id:             Number(raw[0]),
    creator:        raw[1],
    title:          raw[2],
    category:       raw[3],
    country:        raw[4],
    imageURI:       raw[5],
    goal:           raw[6],
    raised:         raw[7],
    deadline:       Number(raw[8]),
    milestoneCount: Number(raw[9]),
    nextMilestone:  Number(raw[10]),
    goalMet:        raw[11],
    refundEnabled:  raw[12],
    goalEth:        parseFloat(ethers.formatEther(raw[6])),
    raisedEth:      parseFloat(ethers.formatEther(raw[7])),
    pct:            raw[6] > 0n ? Math.round(Number(raw[7] * 100n / raw[6])) : 0,
    daysLeft:       Math.max(0, Math.ceil((Number(raw[8]) - Date.now() / 1000) / 86400)),
  };
}

export function useContract(signer) {
  const [campaigns, setCampaigns]  = useState([]);
  const [loading, setLoading]      = useState(true);
  const [txPending, setTxPending]  = useState(false);
  const [notifications, setNotifs] = useState([]);

  // ── Load campaigns ──────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setCampaigns(DEMO_CAMPAIGNS);
      setLoading(false);
      return;
    }
    setLoading(true);
    setCampaigns(DEMO_CAMPAIGNS); // show demo immediately while chain loads
    try {
      const count = await withRetry(async (c) => Number(await c.campaignCount()));
      if (count === 0) { setLoading(false); return; }
      const all = [];
      for (let i = 1; i <= count; i++) {
        try {
          const raw = await withRetry(async (c) => c.getCampaign(i));
          const cam = parseCampaign(raw, i);
          // Merge in demo metadata (milestones, team, comments)
          const demo = DEMO_CAMPAIGNS.find(d => d.id === i) || {};
          all.push({ ...cam, milestones: demo.milestones || [], team: demo.team || [], comments: demo.comments || 0 });
        } catch {}
      }
      if (all.length > 0) setCampaigns(all);
    } catch (e) {
      console.warn("Chain load failed, using demo:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // ── Get milestones ──────────────────────────────────────────────
  const getMilestones = useCallback(async (campaignId, count) => {
    const demo = DEMO_CAMPAIGNS.find(c => c.id === campaignId);
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      return demo?.milestones || [];
    }
    try {
      const ms = [];
      for (let i = 0; i < count; i++) {
        const m = await withRetry(async (c) => c.getMilestone(campaignId, i));
        ms.push({ index: i, description: m[0], releasePercent: Number(m[1]), approved: m[2], released: m[3], voteYes: m[4], voteNo: m[5], voteDeadline: Number(m[6]) });
      }
      return ms;
    } catch {
      return demo?.milestones || [];
    }
  }, []);

  // ── Get my pledge ───────────────────────────────────────────────
  const getMyPledge = useCallback(async (campaignId, address) => {
    if (!address || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return "0";
    try {
      const p = await withRetry(async (c) => c.getPledge(campaignId, address));
      return ethers.formatEther(p);
    } catch { return "0"; }
  }, []);

  // ── Pledge ──────────────────────────────────────────────────────
  const pledge = useCallback(async (campaignId, amountEth) => {
    if (!signer) throw new Error("Connect wallet first");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setTxPending(true);
    try {
      const tx = await contract.pledge(campaignId, { value: ethers.parseEther(String(amountEth)) });
      addNotif("Pledging " + amountEth + " ETH — waiting for confirmation…", "pending");
      const receipt = await waitForTx(tx.hash);
      addNotif("Pledge confirmed! " + receipt.hash.slice(0, 10) + "…", "success");
      await loadCampaigns();
      return receipt;
    } finally {
      setTxPending(false);
    }
  }, [signer, loadCampaigns]);

  // ── Vote ────────────────────────────────────────────────────────
  const castVote = useCallback(async (campaignId, support) => {
    if (!signer) throw new Error("Connect wallet first");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setTxPending(true);
    try {
      const tx = await contract.vote(campaignId, support);
      addNotif("Vote submitted — waiting for confirmation…", "pending");
      const receipt = await waitForTx(tx.hash);
      addNotif("Vote confirmed!", "success");
      return receipt;
    } finally {
      setTxPending(false);
    }
  }, [signer]);

  // ── Refund ──────────────────────────────────────────────────────
  const claimRefund = useCallback(async (campaignId) => {
    if (!signer) throw new Error("Connect wallet first");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setTxPending(true);
    try {
      const tx = await contract.claimRefund(campaignId);
      addNotif("Refund requested — waiting for confirmation…", "pending");
      const receipt = await waitForTx(tx.hash);
      addNotif("Refund received!", "success");
      await loadCampaigns();
      return receipt;
    } finally {
      setTxPending(false);
    }
  }, [signer, loadCampaigns]);

  // ── Create campaign ─────────────────────────────────────────────
  const createCampaign = useCallback(async ({ title, category, country, imageURI, goalEth, durationDays, milestoneDescriptions, milestonePercents }) => {
    if (!signer) throw new Error("Connect wallet first");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setTxPending(true);
    try {
      const tx = await contract.createCampaign(title, category, country, imageURI, ethers.parseEther(String(goalEth)), durationDays, milestoneDescriptions, milestonePercents);
      addNotif("Creating campaign — waiting for confirmation…", "pending");
      const receipt = await waitForTx(tx.hash);
      addNotif("Campaign created on-chain!", "success");
      await loadCampaigns();
      return receipt;
    } finally {
      setTxPending(false);
    }
  }, [signer, loadCampaigns]);

  // ── Event listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return;
    let eventProvider = null;
    let eventContract = null;
    let retryTimer    = null;
    let active        = true;

    const setup = () => {
      if (!active) return;
      try {
        eventProvider = new ethers.JsonRpcProvider(RPC_URLS[1] || RPC_URLS[0]);
        eventContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, eventProvider);
        eventContract.on("Pledged", (id, backer, amount) => {
          addNotif("New pledge of " + parseFloat(ethers.formatEther(amount)).toFixed(4) + " ETH on campaign #" + id, "info");
          loadCampaigns();
        });
        eventContract.on("MilestoneApproved", (id, mi, amount) => {
          addNotif("Milestone " + (Number(mi) + 1) + " approved — " + parseFloat(ethers.formatEther(amount)).toFixed(4) + " ETH released", "success");
          loadCampaigns();
        });
        eventContract.on("RefundEnabled", (id) => {
          addNotif("Refunds enabled for campaign #" + id, "warning");
          loadCampaigns();
        });
      } catch {
        retryTimer = setTimeout(setup, 15000);
      }
    };

    setup();
    return () => {
      active = false;
      clearTimeout(retryTimer);
      try { if (eventContract) eventContract.removeAllListeners(); } catch {}
      try { if (eventProvider) eventProvider.destroy(); } catch {}
    };
  }, [loadCampaigns]);

  // ── Notifications ───────────────────────────────────────────────
  const addNotif = (message, type = "info") => {
    const n = { id: Date.now(), message, type, time: new Date(), read: false };
    setNotifs(prev => [n, ...prev].slice(0, 20));
  };
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotifs = () => setNotifs([]);

  return {
    campaigns, loading, txPending,
    notifications, markAllRead, clearNotifs, addNotif,
    loadCampaigns, getMilestones, getMyPledge,
    pledge, castVote, claimRefund, createCampaign,
  };
}

// ── DEMO DATA ───────────────────────────────────────────────────────
const DEMO_CAMPAIGNS = [
  {
    id: 1, creator: "0xDemo1", title: "Lagos Solar Grid — Community Energy Access",
    category: "Energy", country: "Nigeria",
    imageURI: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
    goalEth: 0.5, raisedEth: 0.39, goal: BigInt("500000000000000000"), raised: BigInt("390000000000000000"),
    pct: 78, daysLeft: 9, goalMet: false, refundEnabled: false, milestoneCount: 3, nextMilestone: 0,
    milestones: [
      { index:0, description:"Purchase solar panels and inverters", releasePercent:30, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:1, description:"Install micro-grid infrastructure", releasePercent:40, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:2, description:"Connect 2,400 households", releasePercent:30, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
    ],
    team: ["Emeka A","Aisha B","Chidi C"], comments: 24,
  },
  {
    id: 2, creator: "0xDemo2", title: "Accra Cooperative Farm — Direct Market Access",
    category: "Agriculture", country: "Ghana",
    imageURI: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
    goalEth: 0.3, raisedEth: 0.162, goal: BigInt("300000000000000000"), raised: BigInt("162000000000000000"),
    pct: 54, daysLeft: 22, goalMet: false, refundEnabled: false, milestoneCount: 2, nextMilestone: 0,
    milestones: [
      { index:0, description:"Build cold storage facility", releasePercent:50, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:1, description:"Deploy mobile logistics platform", releasePercent:50, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
    ],
    team: ["Kwame D","Ama E"], comments: 18,
  },
  {
    id: 3, creator: "0xDemo3", title: "Dakar Mobile Clinic — Maternal Health Initiative",
    category: "Health", country: "Senegal",
    imageURI: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    goalEth: 0.4, raisedEth: 0.364, goal: BigInt("400000000000000000"), raised: BigInt("364000000000000000"),
    pct: 91, daysLeft: 4, goalMet: false, refundEnabled: false, milestoneCount: 3, nextMilestone: 0,
    milestones: [
      { index:0, description:"Procure 5 mobile health units", releasePercent:40, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:1, description:"Train medical staff", releasePercent:20, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:2, description:"Deploy to remote villages", releasePercent:40, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
    ],
    team: ["Fatou D","Moussa F","Aida G"], comments: 41,
  },
  {
    id: 4, creator: "0xDemo4", title: "Harare Tech Hub — Youth Digital Skills",
    category: "Education", country: "Zimbabwe",
    imageURI: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
    goalEth: 0.2, raisedEth: 0.2, goal: BigInt("200000000000000000"), raised: BigInt("200000000000000000"),
    pct: 100, daysLeft: 0, goalMet: true, refundEnabled: false, milestoneCount: 2, nextMilestone: 1,
    milestones: [
      { index:0, description:"Renovate building and install equipment", releasePercent:60, approved:true, released:true, voteYes:BigInt("120000000000000000"), voteNo:BigInt("10000000000000000"), voteDeadline:0 },
      { index:1, description:"Run first cohort of 100 students", releasePercent:40, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline: Math.floor(Date.now()/1000) + 36000 },
    ],
    team: ["Tendai H","Rumbi I"], comments: 33,
  },
  {
    id: 5, creator: "0xDemo5", title: "Nairobi Creative Arts Centre",
    category: "Arts", country: "Kenya",
    imageURI: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    goalEth: 0.25, raisedEth: 0.105, goal: BigInt("250000000000000000"), raised: BigInt("105000000000000000"),
    pct: 42, daysLeft: 18, goalMet: false, refundEnabled: false, milestoneCount: 3, nextMilestone: 0,
    milestones: [
      { index:0, description:"Secure venue and equipment", releasePercent:40, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:1, description:"Launch first exhibition", releasePercent:30, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:2, description:"Establish residency programme", releasePercent:30, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
    ],
    team: ["Wanjiru J","Otieno K"], comments: 11,
  },
  {
    id: 6, creator: "0xDemo6", title: "Conakry Clean Water Initiative",
    category: "Health", country: "Guinea",
    imageURI: "https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=600&q=80",
    goalEth: 0.35, raisedEth: 0.105, goal: BigInt("350000000000000000"), raised: BigInt("105000000000000000"),
    pct: 30, daysLeft: 28, goalMet: false, refundEnabled: false, milestoneCount: 3, nextMilestone: 0,
    milestones: [
      { index:0, description:"Install water filtration systems", releasePercent:35, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:1, description:"Build distribution network", releasePercent:40, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
      { index:2, description:"Train local operators", releasePercent:25, approved:false, released:false, voteYes:0n, voteNo:0n, voteDeadline:0 },
    ],
    team: ["Mamadou L","Fatoumata M"], comments: 7,
  },
];
