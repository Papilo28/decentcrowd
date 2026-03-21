// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DecentCrowd
 * @notice Milestone-based crowdfunding escrow for Sub-Saharan Africa
 * @dev Backers pledge ETH → held in escrow → DAO approves milestones → tranches released to creator
 *      If goal not met by deadline → backers can claim full refund
 *      2.5% platform fee deducted on each milestone release
 */
contract DecentCrowd {

    // ─── CONSTANTS ───────────────────────────────────────────────
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5% in basis points
    uint256 public constant BPS_DENOMINATOR   = 10_000;
    uint256 public constant MIN_VOTE_PERIOD    = 24 hours;

    // ─── STATE ───────────────────────────────────────────────────
    address public owner;        // Platform treasury — receives 2.5% fee
    uint256 public campaignCount;

    struct Milestone {
        string  description;
        uint256 releasePercent; // out of 100 — must sum to 100 across all milestones
        bool    approved;
        bool    released;
        uint256 voteYes;
        uint256 voteNo;
        uint256 voteDeadline;
        mapping(address => bool) hasVoted;
    }

    struct Campaign {
        uint256 id;
        address payable creator;
        string  title;
        string  category;
        string  country;
        string  imageURI;
        uint256 goal;           // in wei
        uint256 raised;         // in wei
        uint256 deadline;       // unix timestamp
        uint256 milestoneCount;
        uint256 nextMilestone;
        bool    goalMet;
        bool    refundEnabled;
        mapping(uint256 => Milestone) milestones;
        mapping(address => uint256)   pledges;
        address[] backers;
    }

    mapping(uint256 => Campaign) public campaigns;

    // ─── EVENTS ──────────────────────────────────────────────────
    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline
    );
    event Pledged(uint256 indexed id, address indexed backer, uint256 amount);
    event Refunded(uint256 indexed id, address indexed backer, uint256 amount);
    event MilestoneVoteOpened(uint256 indexed id, uint256 milestoneIndex, uint256 voteDeadline);
    event MilestoneVoteCast(uint256 indexed id, uint256 milestoneIndex, address voter, bool support);
    event MilestoneApproved(uint256 indexed id, uint256 milestoneIndex, uint256 amountReleased);
    event MilestoneRejected(uint256 indexed id, uint256 milestoneIndex);
    event RefundEnabled(uint256 indexed id);

    // ─── MODIFIERS ───────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier campaignExists(uint256 id) {
        require(id > 0 && id <= campaignCount, "Campaign not found");
        _;
    }

    // ─── CONSTRUCTOR ─────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── CAMPAIGN CREATION ───────────────────────────────────────
    /**
     * @notice Create a new crowdfunding campaign
     * @param title         Campaign name
     * @param category      e.g. "Energy", "Agriculture", "Health"
     * @param country       e.g. "Nigeria"
     * @param imageURI      IPFS or HTTPS image URI
     * @param goal          Funding goal in wei
     * @param durationDays  How many days the campaign runs
     * @param milestoneDescriptions  Array of milestone descriptions
     * @param milestonePercents      Array of release percentages (must sum to 100)
     */
    function createCampaign(
        string memory title,
        string memory category,
        string memory country,
        string memory imageURI,
        uint256 goal,
        uint256 durationDays,
        string[] memory milestoneDescriptions,
        uint256[] memory milestonePercents
    ) external returns (uint256) {
        require(goal > 0, "Goal must be > 0");
        require(durationDays >= 1 && durationDays <= 365, "Duration: 1-365 days");
        require(milestoneDescriptions.length > 0, "Need at least 1 milestone");
        require(milestoneDescriptions.length == milestonePercents.length, "Milestone length mismatch");
        require(milestoneDescriptions.length <= 10, "Max 10 milestones");

        // Validate percentages sum to 100
        uint256 totalPct;
        for (uint256 i = 0; i < milestonePercents.length; i++) {
            totalPct += milestonePercents[i];
        }
        require(totalPct == 100, "Milestone percents must sum to 100");

        campaignCount++;
        uint256 id = campaignCount;
        Campaign storage c = campaigns[id];

        c.id            = id;
        c.creator       = payable(msg.sender);
        c.title         = title;
        c.category      = category;
        c.country       = country;
        c.imageURI      = imageURI;
        c.goal          = goal;
        c.deadline      = block.timestamp + (durationDays * 1 days);
        c.milestoneCount = milestoneDescriptions.length;

        for (uint256 i = 0; i < milestoneDescriptions.length; i++) {
            c.milestones[i].description    = milestoneDescriptions[i];
            c.milestones[i].releasePercent = milestonePercents[i];
        }

        emit CampaignCreated(id, msg.sender, title, goal, c.deadline);
        return id;
    }

    // ─── PLEDGING ────────────────────────────────────────────────
    /**
     * @notice Pledge ETH to a campaign. ETH is held in escrow until milestone release or refund.
     */
    function pledge(uint256 id) external payable campaignExists(id) {
        Campaign storage c = campaigns[id];
        require(block.timestamp < c.deadline, "Campaign ended");
        require(!c.refundEnabled, "Refunds active");
        require(msg.value > 0, "Send ETH to pledge");

        if (c.pledges[msg.sender] == 0) {
            c.backers.push(msg.sender);
        }
        c.pledges[msg.sender] += msg.value;
        c.raised += msg.value;

        if (c.raised >= c.goal) {
            c.goalMet = true;
        }

        emit Pledged(id, msg.sender, msg.value);
    }

    // ─── REFUNDS ─────────────────────────────────────────────────
    /**
     * @notice Owner enables refunds if deadline passed and goal not met
     */
    function enableRefund(uint256 id) external onlyOwner campaignExists(id) {
        Campaign storage c = campaigns[id];
        require(block.timestamp >= c.deadline, "Campaign still active");
        require(!c.goalMet, "Goal was met");
        require(!c.refundEnabled, "Already enabled");
        c.refundEnabled = true;
        emit RefundEnabled(id);
    }

    /**
     * @notice Backers call this to claim their refund when refunds are enabled
     */
    function claimRefund(uint256 id) external campaignExists(id) {
        Campaign storage c = campaigns[id];
        require(c.refundEnabled, "Refunds not active");
        uint256 amount = c.pledges[msg.sender];
        require(amount > 0, "No pledge to refund");
        c.pledges[msg.sender] = 0;
        c.raised -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Refund transfer failed");
        emit Refunded(id, msg.sender, amount);
    }

    // ─── DAO MILESTONE VOTING ────────────────────────────────────
    /**
     * @notice Owner opens a vote on the next milestone (called after creator submits proof)
     */
    function openMilestoneVote(uint256 id) external onlyOwner campaignExists(id) {
        Campaign storage c = campaigns[id];
        require(c.goalMet, "Goal not met yet");
        require(c.nextMilestone < c.milestoneCount, "All milestones done");
        Milestone storage m = c.milestones[c.nextMilestone];
        require(m.voteDeadline == 0, "Vote already open");
        m.voteDeadline = block.timestamp + MIN_VOTE_PERIOD;
        emit MilestoneVoteOpened(id, c.nextMilestone, m.voteDeadline);
    }

    /**
     * @notice Any backer of this campaign can vote on the current milestone
     * @param support true = approve release, false = reject
     */
    function vote(uint256 id, bool support) external campaignExists(id) {
        Campaign storage c = campaigns[id];
        require(c.pledges[msg.sender] > 0, "Not a backer");
        uint256 mi = c.nextMilestone;
        Milestone storage m = c.milestones[mi];
        require(m.voteDeadline > 0, "No active vote");
        require(block.timestamp < m.voteDeadline, "Vote period ended");
        require(!m.hasVoted[msg.sender], "Already voted");
        m.hasVoted[msg.sender] = true;
        if (support) {
            m.voteYes += c.pledges[msg.sender]; // weighted by pledge size
        } else {
            m.voteNo += c.pledges[msg.sender];
        }
        emit MilestoneVoteCast(id, mi, msg.sender, support);
    }

    /**
     * @notice Finalise vote after voting period ends — releases funds or enables refund
     */
    function finaliseMilestone(uint256 id) external campaignExists(id) {
        Campaign storage c = campaigns[id];
        uint256 mi = c.nextMilestone;
        Milestone storage m = c.milestones[mi];
        require(m.voteDeadline > 0, "No vote open");
        require(block.timestamp >= m.voteDeadline, "Vote period not over");
        require(!m.approved && !m.released, "Already finalised");

        if (m.voteYes >= m.voteNo) {
            // ── APPROVE: release tranche ──
            m.approved = true;
            m.released = true;
            uint256 tranche = (c.raised * m.releasePercent) / 100;
            uint256 fee     = (tranche * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            uint256 payout  = tranche - fee;
            c.nextMilestone++;
            // Send fee to platform owner
            (bool feeOk,) = owner.call{value: fee}("");
            require(feeOk, "Fee transfer failed");
            // Send payout to creator
            (bool payOk,) = c.creator.call{value: payout}("");
            require(payOk, "Payout transfer failed");
            emit MilestoneApproved(id, mi, payout);
        } else {
            // ── REJECT: enable refunds ──
            c.refundEnabled = true;
            emit MilestoneRejected(id, mi);
            emit RefundEnabled(id);
        }
    }

    // ─── VIEW FUNCTIONS ──────────────────────────────────────────
    function getCampaign(uint256 id) external view campaignExists(id) returns (
        uint256 _id,
        address _creator,
        string memory _title,
        string memory _category,
        string memory _country,
        string memory _imageURI,
        uint256 _goal,
        uint256 _raised,
        uint256 _deadline,
        uint256 _milestoneCount,
        uint256 _nextMilestone,
        bool _goalMet,
        bool _refundEnabled
    ) {
        Campaign storage c = campaigns[id];
        return (
            c.id, c.creator, c.title, c.category, c.country, c.imageURI,
            c.goal, c.raised, c.deadline,
            c.milestoneCount, c.nextMilestone, c.goalMet, c.refundEnabled
        );
    }

    function getMilestone(uint256 campaignId, uint256 milestoneIndex)
        external view campaignExists(campaignId)
        returns (
            string memory description,
            uint256 releasePercent,
            bool approved,
            bool released,
            uint256 voteYes,
            uint256 voteNo,
            uint256 voteDeadline
        )
    {
        Milestone storage m = campaigns[campaignId].milestones[milestoneIndex];
        return (
            m.description, m.releasePercent,
            m.approved, m.released,
            m.voteYes, m.voteNo, m.voteDeadline
        );
    }

    function getPledge(uint256 campaignId, address backer)
        external view campaignExists(campaignId) returns (uint256)
    {
        return campaigns[campaignId].pledges[backer];
    }

    function getBackers(uint256 campaignId)
        external view campaignExists(campaignId) returns (address[] memory)
    {
        return campaigns[campaignId].backers;
    }

    function getAllCampaigns() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](campaignCount);
        for (uint256 i = 0; i < campaignCount; i++) {
            ids[i] = i + 1;
        }
        return ids;
    }

    // ─── OWNER ───────────────────────────────────────────────────
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}
