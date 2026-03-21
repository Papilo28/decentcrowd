# DecentCrowd

Decentralized crowdfunding for Sub-Saharan Africa.

## Structure

| Folder | Deploy to | URL |
|--------|-----------|-----|
| `decentcrowd-app/` | Vercel (Vite) | app.decentcrowd.cc |
| `docs/` | Vercel (static) | docs.decentcrowd.cc |
| `homepage/` | Vercel (static) | decentcrowd.cc |

## Contract

- **Network:** Ethereum Sepolia Testnet
- **Address:** `0x787daAD9f70489D00B9f18bE458De93737827b92`
- **Etherscan:** https://sepolia.etherscan.io/address/0x787daAD9f70489D00B9f18bE458De93737827b92

## Setup

```bash
cd decentcrowd-app
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Create 3 Vercel projects — one per folder
3. Add custom domains in Vercel settings
4. Add CNAME records in your domain registrar pointing to cname.vercel-dns.com
