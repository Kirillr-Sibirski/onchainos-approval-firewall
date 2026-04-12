# PermissionGuard

`PermissionGuard` is an agent-native approval and allowance firewall for the OKX Build X Hackathon.

Instead of acting like a simple revoke tool, it wraps OnchainOS approval primitives in a policy engine that helps agents:

- inspect ERC-20 approval exposure
- identify risky or stale approvals
- recommend safer actions by policy preset
- produce shareable audit reports
- execute guarded revokes through Agentic Wallet flows

## Why this exists

OKX already exposes the raw building blocks for approvals and revokes, but not a reusable skill that manages the full approval lifecycle for autonomous agents. This repo is the first implementation step toward that higher-level primitive.

## Current status

V0.1 includes:

- a TypeScript CLI
- live `inspect`, `plan`, and `report` flows backed by `onchainos`
- a guarded `execute` flow for revoke transactions
- a reusable `SKILL.md` wrapper for other agents

## Requirements

- Node.js 22+
- `onchainos` CLI installed and configured
- Agentic Wallet access for execution paths

## Quickstart

```bash
npm install
npm run build
```

Inspect a wallet:

```bash
npm run dev -- inspect --address 0xYourWallet --chain xlayer
```

Generate a plan:

```bash
npm run dev -- plan --address 0xYourWallet --chain xlayer --policy strict
```

Generate a markdown report:

```bash
npm run dev -- report --address 0xYourWallet --chain xlayer --policy strict
```

Preview revoke execution:

```bash
npm run dev -- execute --address 0xYourWallet --chain xlayer --policy strict
```

Apply revokes through Agentic Wallet:

```bash
npm run dev -- execute --address 0xYourWallet --chain xlayer --policy strict --apply
```

## Command overview

- `inspect`: fetch and summarize approval exposure
- `plan`: convert approvals into policy-driven actions
- `report`: export the plan as markdown or JSON
- `execute`: tx-scan and revoke approvals marked for removal

## Policy presets

- `strict`: revoke unlimited and high-risk approvals aggressively
- `minimal`: only revoke clearly dangerous exposure
- `trading`: preserve normal workflow approvals while reducing oversized exposure

## Notes

- Approval amounts are currently analyzed in raw units because token decimals are not yet resolved in the first milestone.
- The initial execution flow only automates revoke transactions. Exact-amount re-approval is intentionally deferred to the next milestone.
