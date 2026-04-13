# OKX Build X Competition Analysis

Date: 2026-04-13

## Current Read

- I installed and read the official `okx-buildx-hackathon-agent-track` skill.
- I paginated the Moltbook `buildx` post feed and de-duplicated tagged `ProjectSubmission` posts.
- Current tagged concept count: `7` Skill Arena submissions and `13` X Layer Arena submissions.
- One X Layer post looks like an update accidentally tagged as a fresh submission, so the practical gap is closer to `7` vs `12`.

Conclusion: Skill Arena is materially less crowded than X Layer Arena.

## What Other Teams Built

### X Layer Arena patterns

- Trading and portfolio agents dominate: `X Layer Arbitrage Bot`, `Leigent`, `TriMind`, `DexFight`, `Bobby Protocol`, `AI Agent Portfolio Manager`, `Agent Fight Club`.
- Infra-style products exist, but there are fewer of them: `Fast Bridge X Layer`, `X Layer Agent Nexus`, `Xiaolongxia Mission Exchange`, `x402-guard`, `FrogGame AI`.
- The strongest visible competitor by sheer on-chain activity is `X Layer Arbitrage Bot`, which has posted thousands of runtime updates and claims `80k+` trades.

### Skill Arena patterns

- Payment and economic infra: `One API Suite for Agent AI Tools`, `ASG Pay`, `AgentCFO`.
- Trust and safety layers: `8004 Reputation Skill`, `X Layer Exit-to-Stable`.
- Trading intelligence: `Kairos Floor Score`, `LY BuildX CoPilot`.

### Closest overlaps to us

- `x402-guard` is a spending firewall for x402 payments.
- `AgentCFO` is a budget and vendor-trust layer.
- `X Layer Exit-to-Stable` is wallet de-risking with confirmation and simulation.

None of these is focused on approval hygiene itself: stale allowances, unlimited approvals, exact re-grants, and audit trails after remediation.

## Where OKX Approval Firewall Fits

`OKX Approval Firewall` is best positioned as a `Skill Arena` submission.

Why:

- It is a reusable operator skill, not an end-user full-stack application.
- It solves a concrete agent-ops problem that other submissions mostly do not cover.
- It already has strong proof ingredients:
  - live X Layer transactions
  - Agentic Wallet usage
  - OnchainOS security and execution flow
  - machine-readable audit artifacts
  - a clear demo loop

## Competitive Assessment

My honest take: this project has a good shot if we keep the core idea and sharpen the presentation.

Why I think it can compete:

- The lane is less crowded in Skill Arena.
- The problem is real and easy for judges to understand.
- The thesis is strong: agents need permission hygiene after execution, not only swap ability before execution.
- The repo already feels more complete than many submissions because it has a CLI, policy file, audit artifacts, and live proof hashes.

Main risk:

- It is less flashy than trading bots and marketplaces.
- If we present it as “just revoke approvals,” it will look smaller than it is.

That means the submission has to frame it as `agent permission infrastructure`, not a wallet utility.

## Recommendation

Do not pivot away from this idea.

Instead:

1. Submit it to `Skill Arena`.
2. Keep the current core thesis.
3. Tighten the demo and submission framing so judges immediately understand the scope.

## Changes I Recommend Before Submission

### High value

1. Add a short demo video.
   A 1-3 minute Loom showing `status -> plan -> report -> execute --apply -> audit` will help a lot.

2. Add one polished example artifact to the repo.
   A real markdown report and one JSON audit artifact make the project feel operational, not conceptual.

3. Make the submission headline sharper.
   Lead with: `Agent-native approval firewall for X Layer wallets`.

4. Explicitly contrast the project against nearby categories.
   Say that this is not a swap bot, not a budget dashboard, and not a revoke button. It is the permission control plane for agents.

### Medium value

1. Surface the exact module depth in the submission.
   Spell out:
   - approval inventory
   - policy scoring
   - tx pre-scan
   - Agentic Wallet execution
   - audit artifact generation

2. Emphasize the exact-allowance remediation loop.
   This is more defensible and more novel than generic revoke-only tooling.

3. Mention the live-proven X Layer transactions prominently.
   The proof should appear high in the submission, not buried at the bottom.

### Nice-to-have stretch

1. Add lightweight Permit2 awareness.
2. Add a more agent-native explanation surface such as “why is this approval risky?” output.
3. Add a submission-ready report mode that is easy to paste into Moltbook.

## Submission Priority

If time is limited, I would prioritize:

1. Demo video
2. Strong submission copy
3. Clean proof section with tx hashes
4. Community voting/comments on at least 5 other projects

## Human Blockers From The Official Skill

These still require you:

1. Get an OnchainOS API key from the Dev Portal.
2. Claim the Moltbook account and complete the verification tweet flow.
3. Provide the final public contact line for the submission.

## Notes On Data Quality

- Source for competition analysis: official Moltbook `buildx` feed, paginated on 2026-04-13.
- Counts are based on tagged `ProjectSubmission` posts, de-duplicated by author and normalized title.
- Some teams post frequent runtime updates, so raw feed volume overstates the number of distinct projects.
