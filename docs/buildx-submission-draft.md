## Project Name
OKX Approval Firewall — an agent-native approval firewall for X Layer wallets that inspects, scores, and remediates unsafe ERC-20 approvals.

## Track
Skill Arena

## Contact
kirill.rybkov@outlook.com

## Team
Solo submission by Kirill Sibirski.

## Summary
OKX Approval Firewall is a reusable operator skill for X Layer agents that turns approval management into a policy-driven workflow. It inventories live ERC-20 approvals, scores them under local trust and budget rules, replaces unlimited allowances with exact spend budgets, executes cleanup through Agentic Wallet, and writes human-readable plus machine-readable audit artifacts. Instead of treating approval cleanup as a one-off wallet action, it makes permission hygiene part of the agent runtime.

## What I Built
I built a reusable approval-control skill for agents operating on X Layer. The problem is simple but important: agents can trade, bridge, and pay, but they often leave dangerous approvals behind after execution. Unlimited allowances accumulate, trusted spenders have no local spend caps, and operators lack a clean audit trail for what changed and why.

OKX Approval Firewall solves that with a policy-driven remediation loop:

1. inspect current approvals
2. classify them under strict, minimal, or trading presets
3. apply local spender trust and budget rules from a policy file
4. generate a plan and a report artifact
5. revoke or reduce unsafe approvals through Agentic Wallet
6. write a local audit record with resulting transaction hashes

This matters because autonomous systems need a permission firewall, not just a revoke button. The project turns approval safety into a reusable skill that other agents and operators can adopt immediately.

## How It Functions
The skill is built as a CLI plus reusable operator workflow:

1. `status` gives a one-screen wallet health summary
2. `inspect` fetches the raw approval inventory
3. `plan` evaluates each approval against policy presets and local config
4. `report` writes a markdown or JSON artifact for human review
5. `execute --apply` performs live cleanup and optional exact-allowance regrant
6. `audit` shows recorded remediation runs and artifact paths

Transaction flow:

- approval state is fetched and normalized
- spenders are matched against trusted, watchlist, or blocked policy rules
- risky approvals are classified for revoke, keep, or exact-budget replacement
- remediation transactions are pre-scanned before execution
- Agentic Wallet executes the cleanup on X Layer
- an audit artifact is written locally with timestamps and tx hashes

## OnchainOS / Uniswap Integration
- Module(s) used: OnchainOS Security, OnchainOS transaction scanning, Agentic Wallet
- How integrated:
  - approval inventory is used to inspect current ERC-20 allowance exposure
  - pre-execution scanning is used to validate remediation transactions before signing
  - Agentic Wallet is used as the live execution path for revokes and exact re-grants on X Layer
  - local policy-as-code rules drive the decision engine for trusted, watchlist, blocked, capped, and exact-allowance spenders

## Proof of Work
- Agentic Wallet address: `0x5b6a6bc856fba3e3ac9fe4e9368d2aa3090990c8`
- GitHub repo: https://github.com/Kirillr-Sibirski/okx-buildx
- Deployment / live demo: CLI skill project with tracked live proof in `README.md` and `proof/`; add the final demo video link in the submission form
- On-chain tx examples:
  - setup unlimited approval: `0x23423ae4622271d62070c356305e06b803d62cb486aca426ff0aa2b399b69481`
  - revoke unlimited approval: `0x1e02d66dd26b2a85305e91771cd261e314e80c5407c507a745d91fbcba586d33`
  - cleanup leg of exact remediation: `0x4d32af6447c64bb6fc8cda31a2779a6f3912a7450401e7ff17c9281c18968fb4`
  - exact regrant leg of exact remediation: `0x8e675c89d98ecf38ebe5525514c60d513d4cd173f569652b85919326c7d445cf`
- Example artifact:
  - `.okx-approval-firewall/runs/2026-04-12T16-47-55-954Z-execute.json`

## Why It Matters
Most agent infrastructure focuses on getting agents to transact. Much less work has gone into making those agents safe after they transact. OKX Approval Firewall fills that gap for X Layer by giving agents and operators a permission-control layer with policy enforcement, exact-budget regranting, live execution through Agentic Wallet, and auditable output. Judges should care because it addresses a real operational risk, uses real X Layer activity, integrates directly with the OKX stack, and can be reused by many other agent projects in the ecosystem.
