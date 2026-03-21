// ─── CONTRACT CONFIG ───────────────────────────────────────────────────────
// After deploying with Hardhat, paste your contract address below
export const CONTRACT_ADDRESS = "0x787daAD9f70489D00B9f18bE458De93737827b92"; // ← replace after deploy

export const CHAIN_ID   = 11155111;
export const CHAIN_NAME = "Sepolia";
export const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// RPC endpoints in priority order — most reliable first
// Add your own Alchemy/Infura key here for production use
export const RPC_URLS = [
  "https://ethereum-sepolia-rpc.publicnode.com", // PublicNode — no key needed, generous limits
  "https://sepolia.drpc.org",                    // dRPC — free, fast
  "https://rpc.sepolia.eth.gateway.fm",          // Gateway.fm — reliable
  "https://rpc2.sepolia.org",                    // Ethereum Foundation backup
  "https://rpc.sepolia.org",                     // Ethereum Foundation (rate limited)
];
export const EXPLORER   = "https://sepolia.etherscan.io";

// ─── ABI (matches DecentCrowd.sol) ────────────────────────────────────────
export const ABI = [
  // Read
  "function campaignCount() view returns (uint256)",
  "function getCampaign(uint256 id) view returns (uint256,address,string,string,string,string,uint256,uint256,uint256,uint256,uint256,bool,bool)",
  "function getMilestone(uint256 campaignId, uint256 milestoneIndex) view returns (string,uint256,bool,bool,uint256,uint256,uint256)",
  "function getPledge(uint256 campaignId, address backer) view returns (uint256)",
  "function getBackers(uint256 campaignId) view returns (address[])",
  "function getAllCampaigns() view returns (uint256[])",

  // Write
  "function createCampaign(string,string,string,string,uint256,uint256,string[],uint256[]) returns (uint256)",
  "function pledge(uint256 id) payable",
  "function claimRefund(uint256 id)",
  "function vote(uint256 id, bool support)",
  "function finaliseMilestone(uint256 id)",
  "function openMilestoneVote(uint256 id)",
  "function enableRefund(uint256 id)",

  // Events
  "event CampaignCreated(uint256 indexed id, address indexed creator, string title, uint256 goal, uint256 deadline)",
  "event Pledged(uint256 indexed id, address indexed backer, uint256 amount)",
  "event Refunded(uint256 indexed id, address indexed backer, uint256 amount)",
  "event MilestoneVoteOpened(uint256 indexed id, uint256 milestoneIndex, uint256 voteDeadline)",
  "event MilestoneVoteCast(uint256 indexed id, uint256 milestoneIndex, address voter, bool support)",
  "event MilestoneApproved(uint256 indexed id, uint256 milestoneIndex, uint256 amountReleased)",
  "event MilestoneRejected(uint256 indexed id, uint256 milestoneIndex)",
  "event RefundEnabled(uint256 indexed id)",
];
