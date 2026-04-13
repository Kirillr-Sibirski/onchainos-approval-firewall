import assert from "node:assert/strict";
import test from "node:test";

import { buildBriefPrompt } from "../src/lib/brief.js";
import type { ApprovalRecord, PolicyDecision } from "../src/types.js";

test("brief prompt includes wallet, policy, and top actions", () => {
  const approval: ApprovalRecord = {
    tokenSymbol: "USDC",
    tokenAddress: "0x1000000000000000000000000000000000000001",
    chainIndex: "196",
    spenderAddress: "0x2000000000000000000000000000000000000002",
    allowance: "unlimited",
    allowanceRaw: "",
    isUnlimited: true,
    riskLevel: "high",
    raw: {}
  };

  const decisions: PolicyDecision[] = [
    {
      approval,
      action: "revoke",
      severity: "high",
      reason: "High-risk spender exposure should be revoked immediately."
    }
  ];

  const prompt = buildBriefPrompt({
    address: "0xabc",
    chain: "xlayer",
    policy: "strict",
    approvals: [approval],
    decisions
  });

  assert.match(prompt, /Wallet: 0xabc/);
  assert.match(prompt, /Policy: strict/);
  assert.match(prompt, /"action": "revoke"/);
});
