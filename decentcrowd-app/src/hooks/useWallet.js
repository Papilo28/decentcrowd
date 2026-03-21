// useWallet — thin wrapper around WalletConnect AppKit
import { useAppKitAccount, useAppKitProvider, useAppKitNetwork, useDisconnect } from "@reown/appkit/react";
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CHAIN_ID } from "../lib/contract";
import { appKit } from "../lib/walletConfig";

export function useWallet() {
  const { disconnect: wcDisconnect } = useDisconnect();
  const { address, isConnected }     = useAppKitAccount();
  const { walletProvider }           = useAppKitProvider("eip155");
  const { chainId }                  = useAppKitNetwork();

  const [signer,   setSigner]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [balance,  setBalance]  = useState(null);

  const isCorrectChain = chainId === CHAIN_ID;

  // Rebuild ethers signer whenever AppKit provider changes
  useEffect(() => {
    if (!walletProvider || !isConnected) {
      setSigner(null);
      setProvider(null);
      return;
    }
    const ethProvider = new ethers.BrowserProvider(walletProvider);
    setProvider(ethProvider);
    ethProvider.getSigner().then(setSigner).catch(() => setSigner(null));
    ethProvider.getBalance(address).then(b => setBalance(ethers.formatEther(b))).catch(() => {});
  }, [walletProvider, isConnected, address]);

  const refreshBalance = useCallback(async () => {
    if (!provider || !address) return;
    try {
      const b = await provider.getBalance(address);
      setBalance(ethers.formatEther(b));
    } catch {}
  }, [provider, address]);

  // Call appKit.open() directly — synchronous user-gesture call required by iOS Safari
  // Using the appKit instance (not the hook) ensures it works even outside React context
  const connect = useCallback(() => {
    appKit.open({ view: "Connect" });
  }, []);

  const disconnect = useCallback(async () => {
    try { await wcDisconnect(); } catch {}
    setSigner(null);
    setProvider(null);
    setBalance(null);
  }, [wcDisconnect]);

  const switchToSepolia = useCallback(() => {
    appKit.open({ view: "Networks" });
  }, []);

  return {
    address:        isConnected ? address : null,
    signer,
    provider,
    balance,
    chainId,
    connecting:     false,
    error:          null,
    isCorrectChain,
    connect,
    disconnect,
    switchToSepolia,
    refreshBalance,
  };
}
