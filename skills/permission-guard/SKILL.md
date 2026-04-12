---
name: permission-guard
description: >
  Use this skill to inspect, plan, and clean up ERC-20 approvals for an Agentic Wallet.
  Triggers: approval guard, allowance guard, revoke approvals, review spenders, approval firewall,
  token allowance risk, Permit2 hygiene, stale approvals, spender policy.
---

# PermissionGuard

PermissionGuard is a reusable agent skill built on top of OKX OnchainOS primitives.

It is designed for agents that need to:

- review current approval exposure
- explain why an approval is risky
- generate policy-driven revoke or replacement actions
- execute guarded cleanup via Agentic Wallet

## Command Surface

```bash
npm run dev -- inspect --address 0xYourWallet --chain xlayer
npm run dev -- plan --address 0xYourWallet --chain xlayer --policy strict
npm run dev -- report --address 0xYourWallet --chain xlayer --policy strict
npm run dev -- execute --address 0xYourWallet --chain xlayer --policy strict
```

## Policy Presets

- `strict`: revoke high-risk approvals and aggressively eliminate unlimited exposure
- `minimal`: only remove clearly dangerous approvals
- `trading`: preserve trading workflows while reducing oversized approvals

## Current Limitations

- V0.1 focuses on ERC-20 approvals first.
- Permit2 compatibility is planned but intentionally lightweight in the first milestone.
- Execution currently automates revoke flows only.

## Intended Demo

1. Inspect a live wallet on X Layer.
2. Generate a strict policy plan.
3. Preview or execute revoke actions.
4. Export the markdown report as proof of work.
