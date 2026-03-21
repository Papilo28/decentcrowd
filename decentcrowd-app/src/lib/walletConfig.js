import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

export const sepolia = defineChain({
  id: 11155111,
  caipNetworkId: "eip155:11155111",
  chainNamespace: "eip155",
  name: "Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
});

// MetaMask wallet ID in WalletConnect's registry
const METAMASK_ID = "c57ca95b47569778a828d19178114f4db188b89b7825471898d727f4941c5494";

export const appKit = createAppKit({
  adapters:       [new EthersAdapter()],
  networks:       [sepolia],
  defaultNetwork: sepolia,
  projectId:      "6cac60d6ed61f8db475a1f4915307a50",
  metadata: {
    name:        "DecentCrowd",
    description: "Decentralized crowdfunding for Sub-Saharan Africa",
    url:         "https://app.decentcrowd.cc",
    icons:       ["https://decentcrowd.cc/favicon.ico"],
  },

  features: {
    analytics:           false,
    email:               false,
    socials:             false,
    onramp:              false,
    swaps:               false,
    // On desktop: jump straight to WalletConnect QR code view
    // On mobile: show wallet list (deep-link flow)
    connectMethodsOrder: ["wallet"],
  },

  // Pin MetaMask at the top of the wallet list on mobile
  featuredWalletIds: [METAMASK_ID],

  // On desktop: show only the QR code — no browser extension tiles
  // On mobile: AppKit automatically shows the deep-link wallet list
  allWallets: "SHOW",

  themeMode: "light",
  themeVariables: {
    "--w3m-accent":               "#0A0A0A",
    "--w3m-border-radius-master": "4px",
    "--w3m-font-family":          "'Plus Jakarta Sans', sans-serif",
    "--w3m-z-index":              "999999",
  },
});
